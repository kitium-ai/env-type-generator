import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import type { GeneratorConfig } from '../types/index.js';

export class SbomGenerator {
  public emit(config: GeneratorConfig, outputPath?: string | boolean): string {
    const targetPath = this.resolveOutputPath(outputPath);
    const sbom = this.buildSbom(config, targetPath);
    const serialized = JSON.stringify(sbom, null, 2);

    const directory = path.dirname(targetPath);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    fs.writeFileSync(targetPath, serialized, 'utf-8');
    return targetPath;
  }

  private resolveOutputPath(outputPath?: string | boolean): string {
    const defaultPath = path.resolve('.env-type-generator/sbom.json');
    if (!outputPath || outputPath === true) {
      return defaultPath;
    }
    return path.resolve(outputPath as string);
  }

  private buildSbom(config: GeneratorConfig, targetPath: string): Record<string, unknown> {
    const files = [...config.envFiles];
    if (config.outputPath) {
      files.push(config.outputPath);
    }
    if (config.validationOutput) {
      files.push(config.validationOutput);
    }

    const artifacts = files.map((file) => {
      const absolute = path.resolve(file);
      const content = fs.existsSync(absolute) ? fs.readFileSync(absolute) : undefined;
      return {
        path: absolute,
        exists: Boolean(content),
        hash: content ? this.hash(content) : undefined,
      };
    });

    return {
      bomFormat: 'CycloneDX',
      specVersion: '1.6',
      serialNumber: `urn:uuid:${crypto.randomUUID()}`,
      metadata: {
        timestamp: new Date().toISOString(),
        tools: [{ name: 'env-type-generator', version: '2.x' }],
        properties: [
          { name: 'profile', value: config.profile ?? 'default' },
          { name: 'envFiles', value: config.envFiles.join(',') },
        ],
      },
      components: artifacts.map((artifact) => ({
        type: 'file',
        name: path.basename(artifact.path),
        purl: undefined,
        hashes: artifact.hash ? [{ alg: 'SHA-256', content: artifact.hash }] : [],
        properties: [
          { name: 'path', value: artifact.path },
          { name: 'exists', value: String(artifact.exists) },
        ],
      })),
      targetPath,
    };
  }

  private hash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
