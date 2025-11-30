import { vi } from 'vitest';

// Mock logger BEFORE importing vitest helpers (they may use logger internally)
vi.mock('@kitiumai/logger', () => {
  const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    child: vi.fn().mockReturnThis(),
  } as const;
  return {
    initializeLogger: vi.fn(),
    getLogger: vi.fn(() => mockLogger),
    getLevel: vi.fn(() => 'info'),
    setLevel: vi.fn(),
  };
});

// Dynamically import helpers after mocks are in place
(async () => {
  const { setupCommonPatterns, setupVitestGlobals } = await import(
    '@kitiumai/vitest-helpers/setup'
  );
  setupVitestGlobals();
  setupCommonPatterns();
})();
