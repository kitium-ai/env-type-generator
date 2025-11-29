/**
 * Main entry point for env-type-generator
 * Exports public API for programmatic usage
 */

export { GeneratorService } from './services/generator-service.js';
export { generateEnvTypes } from './api.js';
export { EnvParser } from './parsers/env-parser.js';
export { TypeGenerator } from './generators/type-generator.js';
export { ValidationGenerator } from './generators/validation-generator.js';
export { FileWatcher } from './services/file-watcher.js';
export { defineEnvSchema } from './utils/schema-helpers.js';

export type {
  EnvVariable,
  ParsedEnvFile,
  GeneratorConfig,
  TypeInfo,
  GeneratedOutput,
  ValidationLibrary,
  ParserOptions,
  GeneratorOptions,
  EnvSchema,
  EnvConstraint,
  EnvProfile,
  ComplianceOptions,
} from './types/index.js';

export {
  EnvTypeGeneratorError,
  FileNotFoundError,
  ParseError,
  ValidationError,
  GenerationError,
} from './utils/errors.js';
