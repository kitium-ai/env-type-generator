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

    this.logger.info('Starting file watcher', { files: absolutePaths, debounceMs });

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
  }

  /**
   * Handle file change with debouncing
   */
  private handleChange(filePath: string, callback: FileChangeCallback, debounceMs: number): void {
    const existingTimer = this.debounceTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.debounceTimers.delete(filePath);
      void this.executeCallback(callback, filePath);
    }, debounceMs);

    this.debounceTimers.set(filePath, timer);
  }

  /**
   * Execute callback safely
   */
  private async executeCallback(callback: FileChangeCallback, filePath: string): Promise<void> {
    try {
      await callback(filePath);
    } catch (error) {
      this.logger.error('Watcher callback failed', { filePath }, error as Error);
      throw new EnvTypeGeneratorError(
        `Callback execution failed for ${filePath}: ${(error as Error).message}`
      );
    }
  }

  /**
   * Stop watching files
   */
  public async stop(): Promise<void> {
    if (!this.watcher) {
      return;
    }

    this.logger.info('Stopping file watcher');

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    await this.watcher.close();
    this.watcher = null;
  }

  /**
   * Check if watcher is running
   */
  public isWatching(): boolean {
    return this.watcher !== null;
  }
}
