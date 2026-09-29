import { describe, expect, it } from 'vitest';
import {
  PAYONE_CARD_SCHEMES,
  getPayonePaymentProductId,
  isPayoneCardScheme,
} from './payone.models';

describe('getPayonePaymentProductId', () => {
  it.each([
    ['visa', 1],
    ['amex', 2],
    ['mastercard', 3],
    ['diners', 132],
  ] as const)('maps %s to product ID %i', (scheme, productId) => {
    expect(getPayonePaymentProductId(scheme)).toBe(productId);
  });

  it('exposes only schemes supported by the payment contract', () => {
    expect(PAYONE_CARD_SCHEMES).toEqual(['visa', 'amex', 'mastercard', 'diners']);
    expect(isPayoneCardScheme('unionpay')).toBe(false);
  });

  it('rejects a scheme without a payment-product mapping', () => {
    expect(() => getPayonePaymentProductId('unionpay')).toThrow(
      'Unsupported PAYONE backend-plugin card scheme: unionpay',
    );
  });
});
