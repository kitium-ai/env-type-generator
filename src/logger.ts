/**
 * Shared logger for env-type-generator
 * Wraps @kitiumai/logger to provide sane defaults for CLI + services
 */

import path from 'path';
import {
  CentralLogger,
  LogLevel,
  type ILogger,
  type LoggerConfig,
  type LokiConfig,
} from '@kitiumai/logger';

type DeploymentEnvironment = 'development' | 'staging' | 'production';

let cachedLogger: ILogger | null = null;

/**
 * Resolve deployment environment from NODE_ENV
 */
function resolveEnvironment(value?: string): DeploymentEnvironment {
  const normalized = value?.toLowerCase();
  if (normalized === 'production' || normalized === 'staging') {
    return normalized;
  }
  return 'development';
}

/**
 * Resolve log level with INFO as safe default
 */
function resolveLogLevel(value?: string): LogLevel {
  switch ((value ?? '').toLowerCase()) {
    case LogLevel.ERROR:
      return LogLevel.ERROR;
    case LogLevel.WARN:
      return LogLevel.WARN;
    case LogLevel.HTTP:
      return LogLevel.HTTP;
    case LogLevel.DEBUG:
      return LogLevel.DEBUG;
    default:
      return LogLevel.INFO;
  }
}

/**
 * Build Loki configuration - disabled by default unless explicitly enabled
 */
function buildLokiConfig(environment: DeploymentEnvironment): LokiConfig {
  const isLokiEnabled = process.env['ENV_TYPE_LOKI_ENABLED'] === 'true';
  const basicAuth =
    process.env['ENV_TYPE_LOKI_USERNAME'] && process.env['ENV_TYPE_LOKI_PASSWORD']
      ? {
          username: process.env['ENV_TYPE_LOKI_USERNAME'],
          password: process.env['ENV_TYPE_LOKI_PASSWORD'],
        }
      : undefined;

  return {
    enabled: isLokiEnabled,
    host: process.env['ENV_TYPE_LOKI_HOST'] ?? 'localhost',
    port: Number.parseInt(process.env['ENV_TYPE_LOKI_PORT'] ?? '3100', 10),
    protocol: (process.env['ENV_TYPE_LOKI_PROTOCOL'] ?? 'http') as 'http' | 'https',
    labels: {
      service: process.env['ENV_TYPE_SERVICE_NAME'] ?? 'env-type-generator',
      environment,
    },
    ...(basicAuth && { basicAuth }),
    batchSize: Number.parseInt(process.env['ENV_TYPE_LOKI_BATCH_SIZE'] ?? '250', 10),
    interval: Number.parseInt(process.env['ENV_TYPE_LOKI_INTERVAL'] ?? '5000', 10),
    timeout: Number.parseInt(process.env['ENV_TYPE_LOKI_TIMEOUT'] ?? '15000', 10),
  };
}

/**
 * Build logger configuration with sensible defaults for a CLI/tooling package
 */
function createLoggerConfig(): LoggerConfig {
  const environment = resolveEnvironment(process.env['NODE_ENV']);
  const logLevel = resolveLogLevel(process.env['ENV_TYPE_LOG_LEVEL']);
  const logDir = process.env['ENV_TYPE_LOG_DIR'] ?? path.resolve(process.cwd(), 'logs');

  return {
    serviceName: process.env['ENV_TYPE_SERVICE_NAME'] ?? 'env-type-generator',
    environment,
    logLevel,
    loki: buildLokiConfig(environment),
    enableConsoleTransport: process.env['ENV_TYPE_LOG_CONSOLE'] !== 'false',
    enableFileTransport: process.env['ENV_TYPE_LOG_FILE'] === 'true',
    fileLogPath: logDir,
    maxFileSize: process.env['ENV_TYPE_LOG_MAX_FILE_SIZE'] ?? '25m',
    maxFiles: Number.parseInt(process.env['ENV_TYPE_LOG_MAX_FILES'] ?? '5', 10),
    includeTimestamp: process.env['ENV_TYPE_LOG_TIMESTAMP'] !== 'false',
    includeMeta: process.env['ENV_TYPE_LOG_META'] !== 'false',
  };
}

/**
 * Lazily instantiate shared logger
 */
function getBaseLogger(): ILogger {
  if (!cachedLogger) {
    const config: LoggerConfig = createLoggerConfig();
    cachedLogger = new CentralLogger(config);
  }

  return cachedLogger;
}

/**
 * Get shared logger, optionally scoped via child logger metadata
 */
export function getEnvTypeLogger(scope?: string): ILogger {
  const logger = getBaseLogger();
  if (!scope) {
    return logger;
  }

  return logger.child({ scope });
}

export type { ILogger } from '@kitiumai/logger';
