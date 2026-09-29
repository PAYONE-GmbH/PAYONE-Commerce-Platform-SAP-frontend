import type { Config } from '@spartacus/core';

export const PAYONE_OCC_ENDPOINT = {
  authenticationToken: 'payoneAuthenticationToken',
  commerceCase: 'payoneCommerceCase',
  placeOrder: 'payonePlaceOrder',
} as const;

export const PAYONE_OCC_ENDPOINTS_CONFIG = {
  backend: {
    occ: {
      endpoints: {
        [PAYONE_OCC_ENDPOINT.authenticationToken]:
          'users/${userId}/carts/${cartId}/payone/authentication-token',
        [PAYONE_OCC_ENDPOINT.commerceCase]:
          'users/${userId}/carts/${cartId}/payone/commerce-case',
        [PAYONE_OCC_ENDPOINT.placeOrder]:
          'users/${userId}/carts/${cartId}/payone/placeorder',
      },
    },
  },
} as Config;
