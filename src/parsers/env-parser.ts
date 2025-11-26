/**
 * Environment file parser
 * Parses .env files and extracts variables with metadata
 */

import * as fs from 'fs';
import * as path from 'path';
import type { EnvVariable, ParsedEnvFile, ParserOptions } from '../types/index.js';
import { FileNotFoundError, ParseError } from '../utils/errors.js';

export class EnvParser {
  /**
   * Parse a single .env file
   */
  public parseFile(filePath: string, options: ParserOptions = {}): ParsedEnvFile {
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new FileNotFoundError(absolutePath);
    }

    try {
      const content = fs.readFileSync(absolutePath, 'utf-8');
      const variables = this.parseContent(content, options);

      return {
        variables,
        filePath: absolutePath,
      };
    } catch (error) {
      if (error instanceof FileNotFoundError) {
        throw error;
      }
      throw new ParseError(absolutePath, (error as Error).message);
    }
  }

  /**
   * Parse multiple .env files
   */
  public parseFiles(filePaths: string[], options: ParserOptions = {}): ParsedEnvFile[] {
    return filePaths.map((filePath) => this.parseFile(filePath, options));
  }

  /**
   * Parse .env file content
   */
  private parseContent(content: string, _options: ParserOptions = {}): EnvVariable[] {
    const lines = content.split('\n');
    const variables: EnvVariable[] = [];
    let currentComment: string | undefined;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Skip empty lines
      if (!trimmedLine) {
        currentComment = undefined;
        continue;
      }

      // Handle comments
      if (trimmedLine.startsWith('#')) {
        currentComment = trimmedLine.substring(1).trim();
        continue;
      }

      // Parse variable
      const match = trimmedLine.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/i);
      if (match) {
        const [, key, rawValue] = match;
        const value = this.parseValue(rawValue);

        variables.push({
          key,
          value,
          comment: currentComment,
        });

        currentComment = undefined;
      }
    }

    return variables;
  }

  /**
   * Parse environment variable value
   * Handles quotes and escape sequences
   */
  private parseValue(rawValue: string): string {
    let value = rawValue.trim();

    // Remove inline comments
    const commentIndex = value.indexOf('#');
    if (commentIndex > 0) {
      // Check if # is inside quotes
      const beforeComment = value.substring(0, commentIndex);
      const singleQuotes = (beforeComment.match(/'/g) ?? []).length;
      const doubleQuotes = (beforeComment.match(/"/g) ?? []).length;

      // If quotes are balanced before #, it's a comment
      if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0) {
        value = value.substring(0, commentIndex).trim();
      }
    }

    // Handle quoted values
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.substring(1, value.length - 1);

      // Unescape sequences for double quotes
      if (rawValue.trim().startsWith('"')) {
        value = value
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\\\/g, '\\')
          .replace(/\\"/g, '"');
      }
    }

    return value;
  }

  /**
   * Infer TypeScript type from value
   */
  public inferType(value: string): string {
    // Check for boolean
    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return 'boolean';
    }

    // Check for number
    if (/^-?\d+(\.\d+)?$/.test(value)) {
      return 'number';
    }

    // Check for JSON object/array
    if (
      (value.startsWith('{') && value.endsWith('}')) ||
      (value.startsWith('[') && value.endsWith(']'))
    ) {
      try {
        JSON.parse(value);
        return 'object';
      } catch {
        return 'string';
      }
    }

    // Default to string
    return 'string';
  }
}
