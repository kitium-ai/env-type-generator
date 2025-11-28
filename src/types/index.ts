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

export type EnvConstraint = {
  /** Override the inferred type */
  type?: 'string' | 'number' | 'boolean' | 'object';
  /** Mark variable as required, even if not present in requiredVars */
  required?: boolean;
  /** Optional default value to apply when value is undefined */
  defaultValue?: string;
  /** Allowed enum values */
  enum?: string[];
  /** Regex pattern (as string) to validate against */
  pattern?: string;
  /** Union of possible primitive types */
  union?: Array<'string' | 'number' | 'boolean' | 'object'>;
  /** Apply a built-in transformer at validation time */
  transformer?: 'json' | 'base64' | 'trim';
  /** Human readable description */
  description?: string;
};

export type EnvSchema = Record<string, EnvConstraint>;

export type EnvProfile = {
  name: string;
  envFiles: string[];
  outputPath?: string;
  validationOutput?: string;
};

export type ComplianceOptions = {
  emitSbom?: string | boolean;
  emitAttestation?: string | boolean;
  scanSecrets?: boolean;
  failOnSecret?: boolean;
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
  schema?: EnvSchema;
  profiles?: EnvProfile[];
  profile?: string;
  workspaceRoot?: string;
  cache?: boolean;
  compliance?: ComplianceOptions;
};

export type TypeInfo = {
  name: string;
  type: string;
  required: boolean;
  parsed: boolean;
  comment?: string;
};

export type GeneratedOutput = {
  typeDefinition: string;
  runtimeHelper?: string;
  validationSchema?: string;
  skipped?: boolean;
};

export type ValidationLibrary = 'zod' | 'yup' | 'joi' | 'none';

export type ParserOptions = {
  parseTypes?: boolean;
  requiredVars?: string[];
  schema?: EnvSchema;
};

export type GeneratorOptions = {
  parseTypes: boolean;
  validationLib: ValidationLibrary;
  requiredVars: string[];
  strict: boolean;
  schema?: EnvSchema;
};
