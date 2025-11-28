/**
 * Main generator service
 * Orchestrates parsing, type generation, and file writing
 */

import * as fs from 'fs';
import * as path from 'path';
import type { Result } from '@kitiumai/types';
import { compact, unique, uniqueBy } from '@kitiumai/utils-ts';
import type { ILogger } from '@kitiumai/logger';
import { getEnvTypeLogger } from '../logger.js';
import type {
  GeneratorConfig,
  EnvVariable,
  GeneratorOptions,
  GeneratedOutput,
} from '../types/index.js';
import { EnvParser } from '../parsers/env-parser.js';
import { TypeGenerator } from '../generators/type-generator.js';
import { ValidationGenerator } from '../generators/validation-generator.js';
import { FileWatcher } from './file-watcher.js';
import { GenerationError } from '../utils/errors.js';
import { CacheService } from './cache-service.js';
import { SbomGenerator } from '../generators/sbom-generator.js';
import { SecretScanner } from '../utils/secret-scanner.js';
import { AttestationService } from './attestation-service.js';

type GeneratorServiceDependencies = {
  parser?: EnvParser;
  typeGenerator?: TypeGenerator;
  validationGenerator?: ValidationGenerator;
  watcher?: FileWatcher;
  logger?: ILogger;
  cacheService?: CacheService;
  sbomGenerator?: SbomGenerator;
  secretScanner?: SecretScanner;
  attestationService?: AttestationService;
};

export class GeneratorService {
  private readonly parser: EnvParser;
  private readonly typeGenerator: TypeGenerator;
  private readonly validationGenerator: ValidationGenerator;
  private readonly watcher: FileWatcher;
  private readonly logger: ILogger;
  private readonly cache: CacheService;
  private readonly sbomGenerator: SbomGenerator;
  private readonly secretScanner: SecretScanner;
  private readonly attestationService: AttestationService;

  constructor(dependencies: GeneratorServiceDependencies = {}) {
    this.logger = dependencies.logger ?? getEnvTypeLogger('generator-service');
    this.parser = dependencies.parser ?? new EnvParser();
    this.typeGenerator = dependencies.typeGenerator ?? new TypeGenerator();
    this.validationGenerator = dependencies.validationGenerator ?? new ValidationGenerator();
    this.watcher =
      dependencies.watcher ?? new FileWatcher(this.logger.child({ component: 'file-watcher' }));
    this.cache = dependencies.cacheService ?? new CacheService();
    this.sbomGenerator = dependencies.sbomGenerator ?? new SbomGenerator();
    this.secretScanner = dependencies.secretScanner ?? new SecretScanner();
    this.attestationService =
      dependencies.attestationService ?? new AttestationService();
  }

  /**
   * Generate types and validation schemas
   */
  public generate(config: GeneratorConfig): Result<GeneratedOutput, GenerationError> {
    const resolvedConfig = this.resolveConfig(config);
    const options = this.buildGeneratorOptions(resolvedConfig);

    try {
      this.logger.info('Starting env type generation', {
        envFiles: resolvedConfig.envFiles,
        outputPath: resolvedConfig.outputPath,
        validationOutput: resolvedConfig.validationOutput,
        parseTypes: options.parseTypes,
        strict: options.strict,
      });

      if (this.cache.isFresh(resolvedConfig)) {
        this.logger.info('Skipping generation because cache is fresh', {
          profile: resolvedConfig.profile ?? 'default',
        });
        const skippedOutput: GeneratedOutput = { typeDefinition: '', skipped: true };
        this.emitComplianceArtifacts(resolvedConfig, skippedOutput);
        return { success: true, data: skippedOutput };
      }

      const parsedFiles = this.parser.parseFiles(resolvedConfig.envFiles, {
        parseTypes: options.parseTypes,
        requiredVars: options.requiredVars,
        schema: resolvedConfig.schema,
      });

      const allVariables = this.mergeVariables(parsedFiles.map((file) => file.variables));

      const typeDefinition = this.typeGenerator.generateTypes(allVariables, options);
      this.writeFile(resolvedConfig.outputPath, typeDefinition);

      let runtimeHelper: string | undefined;
      if (options.parseTypes) {
        const helperPath = resolvedConfig.outputPath.replace(/\.d\.ts$/, '.js');
        runtimeHelper = this.typeGenerator.generateRuntimeHelper(allVariables, options);
        if (runtimeHelper) {
          this.writeFile(helperPath, runtimeHelper);
        }
      }

      let validationSchema: string | undefined;
      if (
        resolvedConfig.validationLib &&
        resolvedConfig.validationLib !== 'none' &&
        resolvedConfig.validationOutput
      ) {
        validationSchema =
          this.validationGenerator.generateSchema(allVariables, resolvedConfig.validationLib, options) ??
          undefined;

        if (validationSchema) {
          this.writeFile(resolvedConfig.validationOutput, validationSchema);
        }
      }

      if (resolvedConfig.compliance?.scanSecrets) {
        const findings = this.secretScanner.scan(allVariables);
        if (findings.length) {
          this.logger.warn('Potential secrets detected in env files', { findings });
          if (resolvedConfig.compliance.failOnSecret) {
            throw new GenerationError('Secret scan failed because sensitive values were detected');
          }
        }
      }

      this.cache.write(resolvedConfig);

      this.logger.info('Env type generation completed', {
        outputPath: resolvedConfig.outputPath,
        validationOutput: resolvedConfig.validationOutput,
        runtimeHelperGenerated: Boolean(runtimeHelper),
      });

      this.emitComplianceArtifacts(resolvedConfig, {
        typeDefinition,
        runtimeHelper,
        validationSchema,
      });

      this.logMetrics(allVariables, resolvedConfig);

      return {
        success: true,
        data: {
          typeDefinition,
          runtimeHelper,
          validationSchema,
        },
      };
    } catch (error) {
      const generationError =
        error instanceof GenerationError ? error : new GenerationError((error as Error).message);

      this.logger.error(
        'Env type generation failed',
        { outputPath: resolvedConfig.outputPath },
        generationError
      );

      return {
        success: false,
        error: generationError,
      };
    }
  }

  /**
   * Start watching mode
   */
  public watch(config: GeneratorConfig): void {
    const resolvedConfig = this.resolveConfig(config);
    // Generate initial types
    const result = this.generate(resolvedConfig);

    if (!result.success) {
      throw result.error;
    }

    this.logger.info('Watch mode enabled', {
      files: resolvedConfig.envFiles,
      outputPath: resolvedConfig.outputPath,
    });

    // Start watching
    this.watcher.watch({
      files: resolvedConfig.envFiles,
      onChanged: (filePath: string) => {
        this.logger.info('Regenerating types after env change', { filePath });
        const regenerationResult = this.generate(resolvedConfig);
        if (!regenerationResult.success) {
          this.logger.error(
            'Failed to regenerate env types after change',
            { filePath },
            regenerationResult.error
          );
        }
      },
    });
  }

  /**
   * Stop watching mode
   */
  public async stopWatch(): Promise<void> {
    await this.watcher.stop();
  }

  /**
   * Merge variables from multiple files
   * Later files override earlier ones
   */
  private mergeVariables(variableArrays: EnvVariable[][]): EnvVariable[] {
    const flattened = variableArrays.flat();
    const deduped = uniqueBy([...flattened].reverse(), 'key');
    return deduped.reverse();
  }

  /**
   * Write content to file
   */
  private writeFile(filePath: string, content: string): void {
    try {
      const absolutePath = path.resolve(filePath);
      const directory = path.dirname(absolutePath);

      // Ensure directory exists
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      // Write file
      fs.writeFileSync(absolutePath, content, 'utf-8');
      this.logger.debug('Wrote generated file', { filePath: absolutePath });
    } catch (error) {
      throw new GenerationError(`Failed to write file ${filePath}: ${(error as Error).message}`);
    }
  }

  private buildGeneratorOptions(config: GeneratorConfig): GeneratorOptions {
    return {
      parseTypes: config.parseTypes ?? true,
      validationLib: config.validationLib ?? 'none',
      requiredVars: this.normalizeRequiredVars(config.requiredVars),
      strict: config.strict ?? false,
      schema: config.schema,
    };
  }

  private normalizeRequiredVars(requiredVars?: string[]): string[] {
    if (!requiredVars?.length) {
      return [];
    }

    const trimmed = requiredVars.map((key) => (typeof key === 'string' ? key.trim() : undefined));
    return unique(compact(trimmed));
  }

  /**
   * Check if watcher is running
   */
  public isWatching(): boolean {
    return this.watcher.isWatching();
  }

  private resolveConfig(config: GeneratorConfig): GeneratorConfig {
    const profileName = config.profile ?? 'default';
    const profileOverride = config.profiles?.find((profile) => profile.name === profileName);
    const workspaceRoot = config.workspaceRoot ? path.resolve(config.workspaceRoot) : undefined;

    const merged: GeneratorConfig = {
      ...config,
      envFiles: profileOverride?.envFiles ?? config.envFiles,
      outputPath: profileOverride?.outputPath ?? config.outputPath,
      validationOutput: profileOverride?.validationOutput ?? config.validationOutput,
      profile: profileName,
      cache: config.cache ?? true,
    };

    if (workspaceRoot) {
      merged.envFiles = merged.envFiles.map((file) => path.resolve(workspaceRoot, file));
      merged.outputPath = path.resolve(workspaceRoot, merged.outputPath);
      merged.validationOutput = merged.validationOutput
        ? path.resolve(workspaceRoot, merged.validationOutput)
        : undefined;
    }

    return merged;
  }

  private emitComplianceArtifacts(config: GeneratorConfig, output: GeneratedOutput): void {
    if (config.compliance?.emitSbom) {
      const sbomPath = this.sbomGenerator.emit(config, config.compliance.emitSbom);
      this.logger.info('Emitted SBOM', { path: sbomPath });
    }

    if (config.compliance?.emitAttestation) {
      const attestationPath = this.attestationService.emit(
        config,
        output,
        config.compliance.emitAttestation
      );
      this.logger.info('Emitted attestation', { path: attestationPath });
    }
  }

  private logMetrics(variables: EnvVariable[], config: GeneratorConfig): void {
    const requiredSet = new Set(this.normalizeRequiredVars(config.requiredVars));
    const enumCount = variables.filter((variable) => config.schema?.[variable.key]?.enum?.length).length;
    const patternCount = variables.filter((variable) => config.schema?.[variable.key]?.pattern).length;

    this.logger.info('Generation metrics', {
      profile: config.profile,
      totalVariables: variables.length,
      required: variables.filter((v) => requiredSet.has(v.key) || config.schema?.[v.key]?.required).length,
      enums: enumCount,
      patterns: patternCount,
      validationLib: config.validationLib ?? 'none',
    });
  }
}
