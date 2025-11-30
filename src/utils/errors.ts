/**
 * Error handling for env-type-generator
 * Uses @kitiumai/error for structured, enterprise-grade error management
 */

import { KitiumError } from '@kitiumai/error';

/**
 * Create a file not found error
 * @param filePath The path to the missing file
 */
export function createFileNotFoundError(filePath: string): KitiumError {
  return new KitiumError({
    code: 'env_gen/file_not_found',
    message: `Environment file not found: ${filePath}`,
    statusCode: 404,
    severity: 'error',
    kind: 'not_found',
    retryable: false,
    help: 'Ensure the .env file path is correct and the file exists',
    docs: 'https://docs.kitium.ai/errors/env-gen/file_not_found',
    context: { filePath },
  });
}

/**
 * Create a parse error
 * @param filePath The path to the file that failed parsing
 * @param reason The reason for the parse failure
 * @param additionalContext Additional context to include in the error
 */
export function createParseError(
  filePath: string,
  reason: string,
  additionalContext?: Record<string, unknown>
): KitiumError {
  return new KitiumError({
    code: 'env_gen/parse_error',
    message: `Failed to parse ${filePath}: ${reason}`,
    statusCode: 400,
    severity: 'error',
    kind: 'validation',
    retryable: false,
    help: 'Check the .env file format for syntax errors',
    docs: 'https://docs.kitium.ai/errors/env-gen/parse_error',
    context: {
      filePath,
      reason,
      ...additionalContext,
    },
  });
}

/**
 * Create a validation error
 * @param message The validation error message
 * @param context Additional context for the error
 */
export function createValidationError(
  message: string,
  context?: Record<string, unknown>
): KitiumError {
  return new KitiumError({
    code: 'env_gen/validation_error',
    message: `Validation failed: ${message}`,
    statusCode: 422,
    severity: 'error',
    kind: 'validation',
    retryable: false,
    help: 'Review the validation requirements for environment variables',
    docs: 'https://docs.kitium.ai/errors/env-gen/validation_error',
    context,
  });
}

/**
 * Create a generation error
 * @param message The generation error message
 * @param context Additional context for the error
 */
export function createGenerationError(
  message: string,
  context?: Record<string, unknown>
): KitiumError {
  return new KitiumError({
    code: 'env_gen/generation_error',
    message: `Type generation failed: ${message}`,
    statusCode: 500,
    severity: 'error',
    kind: 'internal',
    retryable: false,
    help: 'Check file permissions and output path configuration',
    docs: 'https://docs.kitium.ai/errors/env-gen/generation_error',
    context,
  });
}

/**
 * Create a generic env-type-generator error
 * @param message The error message
 * @param context Additional context for the error
 */
export function createEnvTypeGeneratorError(
  message: string,
  context?: Record<string, unknown>
): KitiumError {
  return new KitiumError({
    code: 'env_gen/internal_error',
    message,
    statusCode: 500,
    severity: 'error',
    kind: 'internal',
    retryable: false,
    context,
  });
}

/**
 * Backward compatibility: EnvTypeGeneratorError extends KitiumError
 * @deprecated Use createEnvTypeGeneratorError() instead
 */
export class EnvTypeGeneratorError extends KitiumError {
  constructor(message: string) {
    super(createEnvTypeGeneratorError(message).toJSON());
    this.name = 'EnvTypeGeneratorError';
  }
}

/**
 * Backward compatibility: FileNotFoundError extends KitiumError
 * @deprecated Use createFileNotFoundError() instead
 */
export class FileNotFoundError extends KitiumError {
  constructor(filePath: string) {
    super(createFileNotFoundError(filePath).toJSON());
    this.name = 'FileNotFoundError';
  }
}

/**
 * Backward compatibility: ParseError extends KitiumError
 * @deprecated Use createParseError() instead
 */
export class ParseError extends KitiumError {
  constructor(filePath: string, reason: string) {
    super(createParseError(filePath, reason).toJSON());
    this.name = 'ParseError';
  }
}

/**
 * Backward compatibility: ValidationError extends KitiumError
 * @deprecated Use createValidationError() instead
 */
export class ValidationError extends KitiumError {
  constructor(message: string) {
    super(createValidationError(message).toJSON());
    this.name = 'ValidationError';
  }
}

/**
 * Backward compatibility: GenerationError extends KitiumError
 * @deprecated Use createGenerationError() instead
 */
export class GenerationError extends KitiumError {
  constructor(message: string) {
    super(createGenerationError(message).toJSON());
    this.name = 'GenerationError';
  }
}
