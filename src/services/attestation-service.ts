import * as fs from 'fs';
import * as path from 'path';
import crypto from 'crypto';
import type { GeneratedOutput, GeneratorConfig } from '../types/index.js';

export class AttestationService {
  public emit(config: GeneratorConfig, output: GeneratedOutput, target?: string): string {
    const destination = this.resolveOutputPath(target);
    const attest = this.buildAttestation(config, output);
    const serialized = JSON.stringify(attest, null, 2);

    const directory = path.dirname(destination);
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true });
    }
    fs.writeFileSync(destination, serialized, 'utf-8');
    return destination;
  }

  private resolveOutputPath(pathLike?: string): string {
    const defaultPath = path.resolve('.env-type-generator/attestation.json');
    if (!pathLike || pathLike === true) return defaultPath;
    return path.resolve(pathLike);
  }

  private buildAttestation(config: GeneratorConfig, output: GeneratedOutput) {
    const hashes = this.buildHashes([config.outputPath, config.validationOutput].filter(Boolean) as string[]);

    return {
      _type: 'env-type-generator.attestation',
      version: '1.0',
      profile: config.profile ?? 'default',
      issuedAt: new Date().toISOString(),
      outputs: hashes,
      skipped: output.skipped ?? false,
      metadata: {
        envFiles: config.envFiles,
        validationLib: config.validationLib ?? 'none',
        strict: config.strict ?? false,
        parseTypes: config.parseTypes ?? true,
      },
    };
  }

  private buildHashes(pathsToHash: string[]) {
    return pathsToHash.map((file) => {
      const absolute = path.resolve(file);
      const exists = fs.existsSync(absolute);
      return {
        path: absolute,
        exists,
        sha256: exists ? this.hash(fs.readFileSync(absolute)) : undefined,
      };
    });
  }

  private hash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }
}
