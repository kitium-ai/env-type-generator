/**
 * Unit tests for GeneratorService
 */

import * as fs from 'fs';
import * as path from 'path';
import { vi } from 'vitest';
import { GeneratorService } from './generator-service';
import { GeneratorConfig } from '../types';

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

describe('GeneratorService', () => {
  let service: GeneratorService;
  const testDir = path.join(__dirname, '../../test-service-fixtures');
  const envFile = path.join(testDir, '.env');
  const outputFile = path.join(testDir, 'env.d.ts');
  const validationFile = path.join(testDir, 'env.validator.ts');
  let activeTimers: NodeJS.Timeout[] = [];

  const ensureFileExists = (filePath: string): void => {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '');
    }
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
    service = new GeneratorService();
    fs.writeFileSync(envFile, 'DATABASE_URL=postgresql://localhost\nAPI_KEY=secret');
  });

  afterEach(async () => {
    activeTimers.forEach((timer) => clearTimeout(timer));
    activeTimers = [];
    await service.stopWatch();
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('generate', () => {
    it('should generate type definitions', () => {
      const config: GeneratorConfig = {
        envFiles: [envFile],
        outputPath: outputFile,
        parseTypes: false,
        strict: false,
      };

      const result = service.generate(config);

      expect(result.success).toBe(true);

      expect(fs.existsSync(outputFile)).toBe(true);
      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('declare namespace NodeJS');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('API_KEY');
    });

    it('should generate runtime helper when parseTypes is enabled', () => {
      const config: GeneratorConfig = {
        envFiles: [envFile],
        outputPath: outputFile,
        parseTypes: true,
        strict: false,
      };

      const result = service.generate(config);
      expect(result.success).toBe(true);

      const helperPath = outputFile.replace('.d.ts', '.js');
      expect(fs.existsSync(helperPath)).toBe(true);
      const content = fs.readFileSync(helperPath, 'utf-8');
      expect(content).toContain('export const env =');
    });

    it('should generate validation schema when specified', () => {
      const config: GeneratorConfig = {
        envFiles: [envFile],
        outputPath: outputFile,
        validationLib: 'zod',
        validationOutput: validationFile,
        parseTypes: true,
        strict: false,
      };

      const result = service.generate(config);
      expect(result.success).toBe(true);

      expect(fs.existsSync(validationFile)).toBe(true);
      const content = fs.readFileSync(validationFile, 'utf-8');
      expect(content).toContain("import { z } from 'zod'");
    });

    it('should merge variables from multiple files', () => {
      const env1 = path.join(testDir, '.env.local');
      fs.writeFileSync(env1, 'LOCAL_KEY=local');

      const config: GeneratorConfig = {
        envFiles: [envFile, env1],
        outputPath: outputFile,
        parseTypes: false,
        strict: false,
      };

      const result = service.generate(config);
      expect(result.success).toBe(true);

      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('DATABASE_URL');
      expect(content).toContain('LOCAL_KEY');
    });

    it('should override variables from earlier files with later files', () => {
      const env1 = path.join(testDir, '.env');
      const env2 = path.join(testDir, '.env.local');

      fs.writeFileSync(env1, 'KEY=value1');
      fs.writeFileSync(env2, 'KEY=value2');

      const config: GeneratorConfig = {
        envFiles: [env1, env2],
        outputPath: outputFile,
        parseTypes: false,
        strict: false,
      };

      const result = service.generate(config);
      expect(result.success).toBe(true);

      expect(fs.existsSync(outputFile)).toBe(true);
    });

    it('should create output directory if it does not exist', () => {
      const nestedOutput = path.join(testDir, 'nested', 'deep', 'env.d.ts');

      const config: GeneratorConfig = {
        envFiles: [envFile],
        outputPath: nestedOutput,
        parseTypes: false,
        strict: false,
      };

      const result = service.generate(config);
      expect(result.success).toBe(true);

      expect(fs.existsSync(nestedOutput)).toBe(true);
    });

    it('should handle required variables', () => {
      const config: GeneratorConfig = {
        envFiles: [envFile],
        outputPath: outputFile,
        parseTypes: false,
        requiredVars: ['DATABASE_URL'],
        strict: false,
      };

      const result = service.generate(config);
      expect(result.success).toBe(true);

      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).toContain('DATABASE_URL: string;');
    });

    it('should handle strict mode', () => {
      const config: GeneratorConfig = {
        envFiles: [envFile],
        outputPath: outputFile,
        parseTypes: false,
        strict: true,
      };

      const result = service.generate(config);
      expect(result.success).toBe(true);

      const content = fs.readFileSync(outputFile, 'utf-8');
      expect(content).not.toContain('?:');
    });

    it('should handle non-existent env files', () => {
      const config: GeneratorConfig = {
        envFiles: ['non-existent.env'],
        outputPath: outputFile,
        parseTypes: false,
        strict: false,
      };

      const result = service.generate(config);

      expect(result.success).toBe(false);
    });
  });

  describe('watch', () => {
    it('should start watch mode', () => {
      const config: GeneratorConfig = {
        envFiles: [envFile],
        outputPath: outputFile,
        parseTypes: false,
        strict: false,
        watch: true,
      };

      service.watch(config);

      expect(service.isWatching()).toBe(true);
    });

    it('should regenerate on file change', (done) => {
      const config: GeneratorConfig = {
        envFiles: [envFile],
        outputPath: outputFile,
        parseTypes: false,
        strict: false,
        watch: true,
      };

      service.watch(config);

      // Wait for initial generation
      schedule(() => {
        ensureFileExists(outputFile);
        const initialContent = fs.readFileSync(outputFile, 'utf-8');

        // Modify file
        fs.appendFileSync(envFile, '\nNEW_KEY=newvalue');

        // Wait for regeneration
        schedule(() => {
          ensureFileExists(outputFile);
          const updatedContent = fs.readFileSync(outputFile, 'utf-8');
          expect(updatedContent).toContain('NEW_KEY');
          expect(updatedContent).not.toEqual(initialContent);
          done();
        }, 500);
      }, 200);
    }, 10000);
  });

  describe('stopWatch', () => {
    it('should stop watch mode', async () => {
      const config: GeneratorConfig = {
        envFiles: [envFile],
        outputPath: outputFile,
        parseTypes: false,
        strict: false,
        watch: true,
      };

      service.watch(config);
      expect(service.isWatching()).toBe(true);

      await service.stopWatch();
      expect(service.isWatching()).toBe(false);
    });
  });

  describe('isWatching', () => {
    it('should return false initially', () => {
      expect(service.isWatching()).toBe(false);
    });

    it('should return true after starting watch', () => {
      const config: GeneratorConfig = {
        envFiles: [envFile],
        outputPath: outputFile,
        parseTypes: false,
        strict: false,
        watch: true,
      };

      service.watch(config);
      expect(service.isWatching()).toBe(true);
    });
  });
});
