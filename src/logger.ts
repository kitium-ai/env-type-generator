/**
 * Shared logger for env-type-generator
 * Wraps @kitiumai/logger v2.0 to provide scoped loggers for CLI + services
 */

import { getLogger, initializeLogger, type ILogger } from '@kitiumai/logger';

let isInitialized = false;

/**
 * Ensure logger is initialized with default configuration
 */
function ensureLoggerInitialized(): void {
  if (!isInitialized) {
    initializeLogger('env-type-generator');
    isInitialized = true;
  }
}

/**
 * Get shared logger, optionally scoped
 * @param scope - Optional scope for the logger (e.g., 'cli', 'generator', 'watcher')
 */
export function getEnvTypeLogger(scope?: string): ILogger {
  ensureLoggerInitialized();

  if (!scope) {
    return getLogger();
  }

  // Return a child logger with the scope as context
  const baseLogger = getLogger();
  return baseLogger.child({ scope });
}

export type { ILogger } from '@kitiumai/logger';
