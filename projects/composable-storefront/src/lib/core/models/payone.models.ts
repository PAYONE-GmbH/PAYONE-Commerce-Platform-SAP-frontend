import type { CardScheme, CTPConfig } from 'pcp-client-javascript-sdk';

export type PayoneEnvironmentMode = 'test' | 'live';
export interface PayoneClickToPayConfig extends CTPConfig {
  /** Theme supported by newer Hosted Tokenization pages. */
  theme?: 'light' | 'dark';
}

export const PAYONE_CARD_SCHEMES = [
  'visa',
  'amex',
  'mastercard',
  'diners',
] as const satisfies readonly CardScheme[];

export type PayoneCardScheme = (typeof PAYONE_CARD_SCHEMES)[number];

/** Card schemes accepted by the SAP Commerce backend-plugin controller. */
export type PayoneBackendCardScheme = PayoneCardScheme;

export type PayonePaymentProductId = 1 | 2 | 3 | 132;

/**
 * PAYONE payment-product mapping for the backend-plugin card flow. This is
 * library-owned intentionally: storefront configuration must not choose the
 * product id sent to PaymentExecution.
 */
export const PAYONE_PAYMENT_PRODUCT_ID_BY_CARD_SCHEME: Readonly<
  Record<PayoneBackendCardScheme, PayonePaymentProductId>
> = {
  visa: 1,
  amex: 2,
  mastercard: 3,
  diners: 132,
};

export const PAYONE_BACKEND_CARD_SCHEMES: readonly PayoneBackendCardScheme[] =
  PAYONE_CARD_SCHEMES;

export function isPayoneBackendCardScheme(
  value: string,
): value is PayoneBackendCardScheme {
  return PAYONE_BACKEND_CARD_SCHEMES.includes(value as PayoneBackendCardScheme);
}

export function getPayonePaymentProductId(
  scheme: string,
): PayonePaymentProductId {
  if (!isPayoneBackendCardScheme(scheme)) {
    throw new Error(`Unsupported PAYONE backend-plugin card scheme: ${scheme}`);
  }
  return PAYONE_PAYMENT_PRODUCT_ID_BY_CARD_SCHEME[scheme];
}

export function isPayoneCardScheme(value: string): value is PayoneCardScheme {
  return PAYONE_CARD_SCHEMES.includes(value as PayoneCardScheme);
}

export interface PayoneHostedTokenizationSession {
  token: string;
  expiresAt: string;
  mode: PayoneEnvironmentMode;
  locale: string;
  allowedCardSchemes: PayoneCardScheme[];
  /** Shopper email supplied by the backend for Click to Pay card lookup. */
  email?: string;
  /**
   * Backend-authored Click to Pay configuration. The transaction amount and
   * currency must always be derived from the authoritative cart.
   */
  clickToPay?: PayoneClickToPayConfig;
}

export interface PayoneCommerceCase {
  commerceCaseId: string;
  checkoutId: string;
  amount: number;
  currencyIsoCode: string;
  allowedPaymentActions?: string[];
}

export interface PayoneAuthenticationToken {
  token: string;
  id?: string;
  expirationDate: string;
}

export interface PayoneError {
  code: string;
  message: string;
}

export interface PayoneTokenizerSuccess {
  type: 'success';
  statusCode: number;
  paymentProcessingToken: string;
  cardType: PayoneCardScheme;
  cardDetails: {
    cardholderName: string;
    cardNumber: string;
    expiryDate: string;
  };
  inputMode: string;
  issuerCountry?: string;
}

export interface PayoneTokenizerFailure {
  type: 'failure';
  statusCode?: number;
  error: PayoneError;
}

export type PayoneTokenizerResult = PayoneTokenizerSuccess | PayoneTokenizerFailure;
