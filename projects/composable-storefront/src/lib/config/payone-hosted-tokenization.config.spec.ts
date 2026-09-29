import { describe, expect, it } from 'vitest';
import { resolvePayoneHostedTokenizationConfig } from './payone-hosted-tokenization.config';

describe('resolvePayoneHostedTokenizationConfig', () => {
  it('applies defaults and iframe overrides', () => {
    const config = resolvePayoneHostedTokenizationConfig({
      iframe: { width: '100%' },
      isSecurityCodeMasked: true,
      strictCardholderName: false,
    });

    expect(config.iframe).toEqual({ height: 'auto', width: '100%', zIndex: 9999 });
    expect(config.isSecurityCodeMasked).toBe(true);
    expect(config.strictCardholderName).toBe(false);
    expect(config.localeMapping['de']).toBe('de_DE');
  });
});
