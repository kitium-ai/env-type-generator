import type { EnvVariable } from '../types/index.js';

export type SecretFinding = {
  key: string;
  valuePreview: string;
  reason: string;
};

const HIGH_RISK_KEYS = ['SECRET', 'TOKEN', 'KEY', 'PASSWORD', 'PRIVATE'];

const KNOWN_PATTERNS: Array<{ regex: RegExp; reason: string }> = [
  { regex: /sk_live_[0-9a-zA-Z]{20,}/, reason: 'Possible Stripe secret key' },
  { regex: /AIza[0-9A-Za-z\-_]{35}/, reason: 'Possible Google API key' },
  { regex: /ghp_[0-9A-Za-z]{30,}/, reason: 'Possible GitHub personal access token' },
  {
    regex: /[a-zA-Z0-9_-]{32,}\.[a-zA-Z0-9_-]{32,}\.[a-zA-Z0-9_-]{32,}/,
    reason: 'Possible JWT token',
  },
];

export class SecretScanner {
  public scan(variables: EnvVariable[]): SecretFinding[] {
    const findings: SecretFinding[] = [];

    for (const variable of variables) {
      const upperKey = variable.key.toUpperCase();
      const trimmedValue = variable.value.trim();

      if (!trimmedValue) {
        continue;
      }

      const matchingKeyword = HIGH_RISK_KEYS.find((keyword) => upperKey.includes(keyword));
      if (matchingKeyword && trimmedValue.length >= 20) {
        findings.push({
          key: variable.key,
          valuePreview: this.buildPreview(trimmedValue),
          reason: `High-risk key name containing ${matchingKeyword}`,
        });
        continue;
      }

      for (const pattern of KNOWN_PATTERNS) {
        if (pattern.regex.test(trimmedValue)) {
          findings.push({
            key: variable.key,
            valuePreview: this.buildPreview(trimmedValue),
            reason: pattern.reason,
          });
          break;
        }
      }

      if (trimmedValue.length >= 40 && /[A-Za-z0-9+/]{40,}={0,2}/.test(trimmedValue)) {
        findings.push({
          key: variable.key,
          valuePreview: this.buildPreview(trimmedValue),
          reason: 'Value resembles a long secret token',
        });
      }
    }

    return findings;
  }

  private buildPreview(value: string): string {
    if (value.length <= 8) {
      return value;
    }
    return `${value.substring(0, 4)}…${value.substring(value.length - 4)}`;
  }
}
