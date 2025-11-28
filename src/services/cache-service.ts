import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import type { GeneratorConfig } from '../types/index.js';

const CACHE_PATH = path.resolve('.env-type-generator/cache.json');

type CachePayload = {
  profile: string;
  hash: string;
};

export class CacheService {
  public isFresh(config: GeneratorConfig): boolean {
    if (config.cache === false) {
      return false;
    }

    const currentHash = this.computeHash(config);
    const cached = this.readCache();
    return cached?.hash === currentHash && cached.profile === (config.profile ?? 'default');
  }

  public write(config: GeneratorConfig): void {
    if (config.cache === false) {
      return;
    }

    const payload: CachePayload = {
      profile: config.profile ?? 'default',
      hash: this.computeHash(config),
    };

    const directory = path.dirname(CACHE_PATH);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }

    fs.writeFileSync(CACHE_PATH, JSON.stringify(payload, null, 2), 'utf-8');
  }

  private computeHash(config: GeneratorConfig): string {
    const hash = crypto.createHash('sha256');
    const relevant = {
      envFiles: this.readEnvFiles(config.envFiles),
      outputPath: config.outputPath,
      validationOutput: config.validationOutput,
      requiredVars: config.requiredVars ?? [],
      parseTypes: config.parseTypes ?? true,
      strict: config.strict ?? false,
      schema: config.schema ?? {},
      validationLib: config.validationLib ?? 'none',
      profile: config.profile ?? 'default',
    };

    hash.update(JSON.stringify(relevant));
    return hash.digest('hex');
  }

  private readEnvFiles(pathsToRead: string[]): Record<string, string> {
    return pathsToRead.reduce<Record<string, string>>((acc, filePath) => {
      const absolute = path.resolve(filePath);
      if (fs.existsSync(absolute)) {
        acc[absolute] = fs.readFileSync(absolute, 'utf-8');
      }
      return acc;
    }, {});
  }

  private readCache(): CachePayload | undefined {
    try {
      if (!fs.existsSync(CACHE_PATH)) {
        return undefined;
      }
      const content = fs.readFileSync(CACHE_PATH, 'utf-8');
      return JSON.parse(content) as CachePayload;
    } catch {
      return undefined;
    }
  }
}
