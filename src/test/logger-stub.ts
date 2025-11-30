// Test-only stub for @kitiumai/logger
export interface ILoggerStub {
  info: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  child: (meta?: Record<string, unknown>) => ILoggerStub;
}

const stub: ILoggerStub = {
  info: () => {},
  debug: () => {},
  error: () => {},
  warn: () => {},
  child: () => stub,
};

export function initializeLogger(_scope?: string): void {
  // no-op in tests
}

export function getLogger(): ILoggerStub {
  return stub;
}

export function getLevel(): string {
  return 'info';
}

export function setLevel(_level: string): void {
  // no-op
}
