import { GeneratorService } from './services/generator-service.js';
import type { GeneratedOutput, GeneratorConfig } from './types/index.js';

const DEFAULT_CONFIG: GeneratorConfig = {
  envFiles: ['.env'],
  outputPath: './src/types/env.d.ts',
  validationLib: 'none',
  parseTypes: true,
  strict: false,
  cache: true,
};

export function generateEnvTypes(partial?: Partial<GeneratorConfig>): GeneratedOutput {
  const config: GeneratorConfig = {
    ...DEFAULT_CONFIG,
    ...partial,
    compliance: partial?.compliance ?? DEFAULT_CONFIG.compliance,
  } as GeneratorConfig;
  const service = new GeneratorService();
  const result = service.generate(config);

  if (!result.success) {
    throw result.error;
  }

  return result.data;
}
