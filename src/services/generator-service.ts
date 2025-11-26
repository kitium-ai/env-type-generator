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

type GeneratorServiceDependencies = {
  parser?: EnvParser;
  typeGenerator?: TypeGenerator;
  validationGenerator?: ValidationGenerator;
  watcher?: FileWatcher;
  logger?: ILogger;
};

export class GeneratorService {
  private readonly parser: EnvParser;
  private readonly typeGenerator: TypeGenerator;
  private readonly validationGenerator: ValidationGenerator;
  private readonly watcher: FileWatcher;
  private readonly logger: ILogger;

  constructor(dependencies: GeneratorServiceDependencies = {}) {
    this.logger = dependencies.logger ?? getEnvTypeLogger('generator-service');
    this.parser = dependencies.parser ?? new EnvParser();
    this.typeGenerator = dependencies.typeGenerator ?? new TypeGenerator();
    this.validationGenerator = dependencies.validationGenerator ?? new ValidationGenerator();
    this.watcher =
      dependencies.watcher ?? new FileWatcher(this.logger.child({ component: 'file-watcher' }));
  }

  /**
   * Generate types and validation schemas
   */
  public generate(config: GeneratorConfig): Result<GeneratedOutput, GenerationError> {
    const options = this.buildGeneratorOptions(config);

    try {
      this.logger.info('Starting env type generation', {
        envFiles: config.envFiles,
        outputPath: config.outputPath,
        validationOutput: config.validationOutput,
        parseTypes: options.parseTypes,
        strict: options.strict,
      });

      const parsedFiles = this.parser.parseFiles(config.envFiles, {
        parseTypes: options.parseTypes,
        requiredVars: options.requiredVars,
      });

      const allVariables = this.mergeVariables(parsedFiles.map((file) => file.variables));

      const typeDefinition = this.typeGenerator.generateTypes(allVariables, options);
      this.writeFile(config.outputPath, typeDefinition);

      let runtimeHelper: string | undefined;
      if (options.parseTypes) {
        const helperPath = config.outputPath.replace(/\.d\.ts$/, '.js');
        runtimeHelper = this.typeGenerator.generateRuntimeHelper(allVariables, options);
        if (runtimeHelper) {
          this.writeFile(helperPath, runtimeHelper);
        }
      }

      let validationSchema: string | undefined;
      if (config.validationLib && config.validationLib !== 'none' && config.validationOutput) {
        validationSchema =
          this.validationGenerator.generateSchema(allVariables, config.validationLib, options) ??
          undefined;

        if (validationSchema) {
          this.writeFile(config.validationOutput, validationSchema);
        }
      }

      this.logger.info('Env type generation completed', {
        outputPath: config.outputPath,
        validationOutput: config.validationOutput,
        runtimeHelperGenerated: Boolean(runtimeHelper),
      });

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
        { outputPath: config.outputPath },
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
    // Generate initial types
    const result = this.generate(config);

    if (!result.success) {
      throw result.error;
    }

    this.logger.info('Watch mode enabled', {
      files: config.envFiles,
      outputPath: config.outputPath,
    });

    // Start watching
    this.watcher.watch({
      files: config.envFiles,
      onChanged: (filePath: string) => {
        this.logger.info('Regenerating types after env change', { filePath });
        const regenerationResult = this.generate(config);
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
}
