/**
 * Core type definitions for env-type-generator
 */

export type EnvVariable = {
  key: string;
  value: string;
  comment?: string;
};

export type ParsedEnvFile = {
  variables: EnvVariable[];
  filePath: string;
};

export type GeneratorConfig = {
  envFiles: string[];
  outputPath: string;
  validationLib?: 'zod' | 'yup' | 'joi' | 'none';
  validationOutput?: string;
  requiredVars?: string[];
  parseTypes?: boolean;
  strict?: boolean;
  watch?: boolean;
};

export type TypeInfo = {
  name: string;
  type: string;
  required: boolean;
  parsed: boolean;
  comment?: string;
  camelCaseName?: string;
  snakeCaseName?: string;
};

export type GeneratedOutput = {
  typeDefinition: string;
  runtimeHelper?: string;
  validationSchema?: string;
};

export type ValidationLibrary = 'zod' | 'yup' | 'joi' | 'none';

export type ParserOptions = {
  parseTypes?: boolean;
  requiredVars?: string[];
};

export type GeneratorOptions = {
  parseTypes: boolean;
  validationLib: ValidationLibrary;
  requiredVars: string[];
  strict: boolean;
};
