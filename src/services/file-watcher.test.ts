/**
 * Unit tests for FileWatcher
 */

import * as fs from 'fs';
import * as path from 'path';
import { vi } from 'vitest';
import { FileWatcher, type FileChangeCallback } from './file-watcher';
import { EnvTypeGeneratorError } from '../utils/errors';

vi.mock('../logger', () => {
  const mockLogger = {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    child: vi.fn().mockReturnThis(),
  };

  return {
    getEnvTypeLogger: vi.fn(() => mockLogger),
  };
});

describe.sequential('FileWatcher', () => {
  let watcher: FileWatcher;
  const testDir = path.join(__dirname, '../../test-watch-fixtures');
  const testFile = path.join(testDir, 'test.env');
  let activeTimers: NodeJS.Timeout[] = [];

  const safeAppend = (content: string): void => {
    if (!fs.existsSync(testFile)) {
      fs.writeFileSync(testFile, 'KEY=value');
    }
    fs.appendFileSync(testFile, content);
  };

  const schedule = (fn: () => void, delay: number): NodeJS.Timeout => {
    const timer = setTimeout(() => {
      fn();
      activeTimers = activeTimers.filter((t) => t !== timer);
    }, delay);
    activeTimers.push(timer);
    return timer;
  };

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  beforeEach(() => {
    watcher = new FileWatcher();
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    fs.writeFileSync(testFile, 'KEY=value');
  });

  afterEach(async () => {
    activeTimers.forEach((timer) => clearTimeout(timer));
    activeTimers = [];
    await watcher.stop();
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('watch', () => {
    it('should start watching files', (done) => {
      let callCount = 0;

      watcher.watch({
        files: [testFile],
        onChanged: () => {
          callCount++;
          if (callCount === 1) {
            expect(watcher.isWatching()).toBe(true);
            done();
          }
        },
        debounceMs: 100,
      });

      // Trigger file change
      schedule(() => {
        safeAppend('\nNEW_KEY=value');
      }, 200);
    });

    it('should debounce multiple rapid changes', (done) => {
      let callCount = 0;

      watcher.watch({
        files: [testFile],
        onChanged: () => {
          callCount++;
        },
        debounceMs: 200,
      });

      // Trigger multiple rapid changes
      schedule(() => safeAppend('\nKEY1=value1'), 50);
      schedule(() => safeAppend('\nKEY2=value2'), 100);
      schedule(() => safeAppend('\nKEY3=value3'), 150);

      // Check after debounce period
      setTimeout(() => {
        // Should only have been called once due to debouncing
        expect(callCount).toBeLessThanOrEqual(1);
        done();
      }, 500);
    });

    it('should throw error if watcher is already running', () => {
      const handler = vi.fn<FileChangeCallback>();
      watcher.watch({
        files: [testFile],
        onChanged: handler,
      });

      expect(() =>
        watcher.watch({
          files: [testFile],
          onChanged: handler,
        })
      ).toThrow(EnvTypeGeneratorError);
    });

    it('should handle async callbacks', (done) => {
      const asyncCallback = vi.fn<FileChangeCallback>(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      watcher.watch({
        files: [testFile],
        onChanged: asyncCallback,
        debounceMs: 100,
      });

      schedule(() => {
        safeAppend('\nASYNC_KEY=value');
      }, 200);

      setTimeout(() => {
        expect(asyncCallback).toHaveBeenCalled();
        done();
      }, 600);
    });
  });

  describe('stop', () => {
    it('should stop watching files', async () => {
      const handler = vi.fn<FileChangeCallback>();
      watcher.watch({
        files: [testFile],
        onChanged: handler,
      });

      expect(watcher.isWatching()).toBe(true);

      await watcher.stop();

      expect(watcher.isWatching()).toBe(false);
    });

    it('should handle stop when not watching', async () => {
      expect(watcher.isWatching()).toBe(false);
      await expect(watcher.stop()).resolves.not.toThrow();
    });

    it('should clear debounce timers on stop', (done) => {
      const callback = vi.fn<FileChangeCallback>();

      watcher.watch({
        files: [testFile],
        onChanged: callback,
        debounceMs: 500,
      });

      // Trigger change
      schedule(() => {
        safeAppend('\nKEY=value');
      }, 100);

      // Stop before debounce completes
      schedule(() => {
        void watcher.stop().then(() => {
          // Wait and check callback wasn't called
          schedule(() => {
            expect(callback).not.toHaveBeenCalled();
            done();
          }, 300);
        });
      }, 200);
    });
  });

  describe('isWatching', () => {
    it('should return false when not watching', () => {
      expect(watcher.isWatching()).toBe(false);
    });

    it('should return true when watching', () => {
      const handler = vi.fn<FileChangeCallback>();
      watcher.watch({
        files: [testFile],
        onChanged: handler,
      });

      expect(watcher.isWatching()).toBe(true);
    });
  });
});
