/**
 * File watcher service
 * Watches .env files for changes and triggers regeneration
 */

import * as chokidar from 'chokidar';
import * as path from 'path';
import type { ILogger } from '@kitiumai/logger';
import { getEnvTypeLogger } from '../logger.js';
import { EnvTypeGeneratorError } from '../utils/errors.js';

export type FileChangeCallback = (filePath: string) => void | Promise<void>;

export type WatcherOptions = {
  files: string[];
  onChanged: FileChangeCallback;
  debounceMs?: number;
};

export class FileWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private readonly debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(private readonly logger: ILogger = getEnvTypeLogger('file-watcher')) {}

  /**
   * Start watching files
   */
  public watch(options: WatcherOptions): void {
    const { files, onChanged, debounceMs = 300 } = options;

    if (this.watcher) {
      throw new EnvTypeGeneratorError('Watcher is already running');
    }

    const absolutePaths = files.map((file) => path.resolve(file));

    this.logger.info('Starting file watcher', {
      fileCount: absolutePaths.length,
      files: absolutePaths,
      debounceMs,
      config: {
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50,
        },
      },
    });

    this.watcher = chokidar.watch(absolutePaths, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    this.watcher.on('change', (filePath: string) => {
      this.logger.debug('Detected change in env file', { filePath });
      this.handleChange(filePath, onChanged, debounceMs);
    });

    this.watcher.on('error', (error: Error) => {
      this.logger.error('File watcher encountered an error', { error: error.message }, error);
      throw new EnvTypeGeneratorError(`Watcher error: ${error.message}`);
    });

    this.logger.info('File watcher initialized successfully', {
      fileCount: absolutePaths.length,
      status: 'watching',
    });
  }

  /**
   * Handle file change with debouncing
   */
  private handleChange(filePath: string, callback: FileChangeCallback, debounceMs: number): void {
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      this.logger.debug('Debounce timer reset for file', {
        filePath,
        debounceMs,
        reason: 'file changed again during debounce period',
      });
      clearTimeout(existingTimer);
    } else {
      this.logger.debug('File change detected, scheduling callback', {
        filePath,
        debounceMs,
      });
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      void this.executeCallback(callback, filePath);
    }, debounceMs);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Execute callback safely with performance tracking
   */
  private async executeCallback(callback: FileChangeCallback, filePath: string): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.debug('Executing watcher callback', { filePath });
      await callback(filePath);
      const duration = Date.now() - startTime;

      this.logger.info('Watcher callback completed successfully', {
        filePath,
        duration,
        performance: {
          ms: duration,
        },
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(
        'Watcher callback failed',
        {
          filePath,
          duration,
          error: errorMessage,
        },
        error as Error
      );

      throw new EnvTypeGeneratorError(`Callback execution failed for ${filePath}: ${errorMessage}`);
    }
  }

  /**
   * Stop watching files
   */
  public async stop(): Promise<void> {
    if (!this.watcher) {
      this.logger.debug('File watcher is not running, nothing to stop');
      return;
    }

    const timerCount = this.debounceTimers.size;
    this.logger.info('Stopping file watcher', {
      activeTimers: timerCount,
    });

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    await this.watcher.close();
    this.watcher = null;

    this.logger.info('File watcher stopped successfully', {
      cleanedUpTimers: timerCount,
    });
  }

  /**
   * Check if watcher is running
   */
  public isWatching(): boolean {
    return this.watcher !== null;
  }
}
