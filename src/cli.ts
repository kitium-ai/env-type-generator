#!/usr/bin/env node

/**
 * CLI entry point for env-type-generator
 */

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { GeneratorService } from './services/generator-service.js';
import { getEnvTypeLogger } from './logger.js';
import {
  createFileNotFoundError,
  createValidationError,
  createEnvTypeGeneratorError,
} from './utils/errors.js';
import type { GeneratorConfig, ValidationLibrary } from './types/index.js';

const program = new Command();

program
  .name('env-type-gen')
  .description('Auto-generate TypeScript types from .env files')
  .version('1.0.0');

program
  .option('-e, --env-files <files...>', 'Environment files to parse', ['.env'])
  .option('-o, --output <path>', 'Output path for type definitions', './src/types/env.d.ts')
  .option('-v, --validation-lib <library>', 'Validation library (zod|yup|joi|none)', 'none')
  .option(
    '-s, --validation-output <path>',
    'Output path for validation schema',
    './src/config/env.validator.ts'
  )
  .option('-r, --required <vars...>', 'Required environment variables', [])
  .option('-p, --parse-types', 'Parse and infer types from values', false)
  .option('-t, --strict', 'Treat all variables as required', false)
  .option('-w, --watch', 'Watch mode - regenerate on file changes', false)
  .option('-c, --config <path>', 'Path to config file')
  .action(async (options) => {
    const logger = getEnvTypeLogger('cli');

    try {
      let config: GeneratorConfig;

      // Load config from file if specified
      if (options.config) {
        config = loadConfigFile(options.config);
      } else {
        // Build config from CLI options
        config = {
          envFiles: options.envFiles as string[],
          outputPath: options.output as string,
          validationLib: options.validationLib as ValidationLibrary,
          validationOutput: options.validationOutput as string,
          requiredVars: options.required as string[],
          parseTypes: options.parseTypes as boolean,
          strict: options.strict as boolean,
          watch: options.watch as boolean,
        };
      }

      // Validate config
      validateConfig(config);

      // Create generator service
      const service = new GeneratorService({
        logger: logger.child({ scope: 'generator-service' }),
      });

      if (config.watch) {
        logger.info('Watch mode enabled', { envFiles: config.envFiles, output: config.outputPath });

        try {
          service.watch(config);
        } catch (error) {
          logger.error(
            'Failed to start watch mode',
            { error: (error as Error).message },
            error as Error
          );
          process.exit(1);
        }

        logger.info('Initial types generated', { output: config.outputPath });
        if (config.validationLib && config.validationLib !== 'none' && config.validationOutput) {
          logger.info('Initial validation schema generated', { output: config.validationOutput });
        }

        // Keep process running
        process.on('SIGINT', () => {
          logger.info('Stopping watcher due to SIGINT');
          void service.stopWatch().then(() => {
            logger.info('Watcher stopped gracefully');
            process.exit(0);
          });
        });
      } else {
        logger.info('Generating env types', {
          envFiles: config.envFiles,
          output: config.outputPath,
        });

        const result = service.generate(config);

        if (!result.success) {
          logger.error('Type generation failed', { output: config.outputPath }, result.error);
          process.exit(1);
        }

        logger.info('Types generated successfully', { output: config.outputPath });

        if (config.validationLib && config.validationLib !== 'none') {
          logger.info('Validation schema generated', { output: config.validationOutput });
        }
      }
    } catch (error) {
      logger.error('CLI execution failed', { error: (error as Error).message }, error as Error);
      process.exit(1);
    }
  });

/**
 * Load configuration from file
 */
function loadConfigFile(configPath: string): GeneratorConfig {
  const absolutePath = path.resolve(configPath);

  if (!fs.existsSync(absolutePath)) {
    throw createFileNotFoundError(absolutePath);
  }

  try {
    const config = require(absolutePath) as GeneratorConfig;
    return config;
  } catch (error) {
    const errorMsg = `Failed to load config from ${absolutePath}: ${(error as Error).message}`;
    throw createEnvTypeGeneratorError(errorMsg, {
      configPath: absolutePath,
      reason: (error as Error).message,
    });
  }
}

/**
 * Validate configuration
 */
function validateConfig(config: GeneratorConfig): void {
  // Check if env files exist
  for (const envFile of config.envFiles) {
    const absolutePath = path.resolve(envFile);
    if (!fs.existsSync(absolutePath)) {
      throw createFileNotFoundError(absolutePath);
    }
  }

  // Validate validation library
  const validLibs: ValidationLibrary[] = ['zod', 'yup', 'joi', 'none'];
  if (config.validationLib && !validLibs.includes(config.validationLib)) {
    throw createValidationError(`Invalid validation library: ${config.validationLib}`, {
      validationLib: config.validationLib,
      supportedLibs: validLibs,
      help: 'Use one of: zod, yup, joi, or none',
    });
  }

  // Check if output path ends with .d.ts
  if (!config.outputPath.endsWith('.d.ts')) {
    throw createValidationError('Output path must end with .d.ts', {
      outputPath: config.outputPath,
      expectedSuffix: '.d.ts',
    });
  }
}

// Parse command line arguments
program.parse(process.argv);

// Show help if no arguments
if (process.argv.length === 2) {
  program.help();
}
