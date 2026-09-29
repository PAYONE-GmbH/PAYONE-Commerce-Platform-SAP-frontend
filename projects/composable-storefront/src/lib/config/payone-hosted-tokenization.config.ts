import { InjectionToken } from '@angular/core';
import type {
  CustomIconsConfig,
  LocaleTextConfig,
  LocaleTextErrors,
  UIConfig,
} from 'pcp-client-javascript-sdk';

export type PayoneUiConfig = UIConfig;
export type PayoneCustomIconsConfig = CustomIconsConfig;

export interface PayoneLocaleTextConfig extends Omit<LocaleTextConfig, 'errors'> {
  errors?: Omit<LocaleTextErrors, 'cardholderName'> & {
    cardholderName?: NonNullable<LocaleTextErrors['cardholderName']> & {
      isStrictInvalid?: string;
    };
  };
}

export interface PayoneCustomTextConfig {
  en?: PayoneLocaleTextConfig;
  de?: PayoneLocaleTextConfig;
  [locale: string]: PayoneLocaleTextConfig | undefined;
}

export interface PayoneIframeConfig {
  height: number | string;
  width: number | string;
  zIndex: number | string;
}

export interface PayoneHostedTokenizationOptions {
  iframe?: Partial<PayoneIframeConfig>;
  uiConfig?: PayoneUiConfig;
  customTextConfig?: PayoneCustomTextConfig;
  customIconsConfig?: PayoneCustomIconsConfig;
  isSecurityCodeMasked?: boolean;
  showCardholderName?: boolean;
  strictCardholderName?: boolean;
  localeMapping?: Readonly<Record<string, string>>;
}

export interface PayoneHostedTokenizationConfig {
  iframe: PayoneIframeConfig;
  uiConfig?: PayoneUiConfig;
  customTextConfig?: PayoneCustomTextConfig;
  customIconsConfig?: PayoneCustomIconsConfig;
  isSecurityCodeMasked: boolean;
  showCardholderName: boolean;
  strictCardholderName: boolean;
  localeMapping: Readonly<Record<string, string>>;
}

export const PAYONE_HOSTED_TOKENIZATION_CONFIG =
  new InjectionToken<PayoneHostedTokenizationConfig>('PAYONE_HOSTED_TOKENIZATION_CONFIG');

const DEFAULT_CONFIG: PayoneHostedTokenizationConfig = {
  iframe: {
    height: 'auto',
    width: 400,
    zIndex: 9999,
  },
  isSecurityCodeMasked: false,
  showCardholderName: true,
  strictCardholderName: true,
  localeMapping: {
    de: 'de_DE',
    'de-DE': 'de_DE',
    en: 'en_GB',
    'en-GB': 'en_GB',
    'en-US': 'en_US',
  },
};

export function resolvePayoneHostedTokenizationConfig(
  options: PayoneHostedTokenizationOptions = {},
): PayoneHostedTokenizationConfig {
  const width = positiveNumberOrString(
    options.iframe?.width ?? DEFAULT_CONFIG.iframe.width,
    'iframe.width',
  );
  const zIndex = positiveNumberOrString(
    options.iframe?.zIndex ?? DEFAULT_CONFIG.iframe.zIndex,
    'iframe.zIndex',
  );
  const height = positiveNumberOrString(
    options.iframe?.height ?? DEFAULT_CONFIG.iframe.height,
    'iframe.height',
  );

  return {
    iframe: { height, width, zIndex },
    uiConfig: options.uiConfig,
    customTextConfig: options.customTextConfig,
    customIconsConfig: options.customIconsConfig,
    isSecurityCodeMasked:
      options.isSecurityCodeMasked ?? DEFAULT_CONFIG.isSecurityCodeMasked,
    showCardholderName: options.showCardholderName ?? DEFAULT_CONFIG.showCardholderName,
    strictCardholderName:
      options.strictCardholderName ?? DEFAULT_CONFIG.strictCardholderName,
    localeMapping: {
      ...DEFAULT_CONFIG.localeMapping,
      ...options.localeMapping,
    },
  };
}

function positiveNumberOrString(value: number | string, property: string): number | string {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${property} must be a positive integer`);
    }
    return value;
  }
  if (value.trim().length === 0) {
    throw new Error(`${property} must not be empty`);
  }
  return value;
}
