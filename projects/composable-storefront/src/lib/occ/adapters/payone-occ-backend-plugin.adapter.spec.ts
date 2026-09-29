import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OccEndpointsService } from '@spartacus/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PAYONE_OCC_ENDPOINT } from '../services/payone-occ-endpoints';
import { PayoneOccBackendPluginAdapter } from './payone-occ-backend-plugin.adapter';

describe('PayoneOccBackendPluginAdapter', () => {
  let adapter: PayoneOccBackendPluginAdapter;
  let http: HttpTestingController;
  const buildUrl = vi.fn((endpoint: string) => `/occ/${endpoint}`);

  beforeEach(() => {
    buildUrl.mockClear();
    TestBed.configureTestingModule({
      providers: [
        PayoneOccBackendPluginAdapter,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
        { provide: OccEndpointsService, useValue: { buildUrl } },
      ],
    });
    adapter = TestBed.inject(PayoneOccBackendPluginAdapter);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('calls the backend-plugin commerce-case endpoint', () => {
    adapter.createCommerceCase('current', 'cart-1').subscribe();

    const request = http.expectOne(`/occ/${PAYONE_OCC_ENDPOINT.commerceCase}`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    expect(buildUrl).toHaveBeenCalledWith(PAYONE_OCC_ENDPOINT.commerceCase, {
      urlParams: { userId: 'current', cartId: 'cart-1' },
    });
    request.flush({ commerceCaseId: 'case-1', checkoutId: 'checkout-1' });
  });

  it('calls the backend-plugin authentication-token endpoint', () => {
    adapter.createAuthenticationToken('current', 'cart-1').subscribe();

    const request = http.expectOne(
      `/occ/${PAYONE_OCC_ENDPOINT.authenticationToken}`,
    );
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    expect(buildUrl).toHaveBeenCalledWith(
      PAYONE_OCC_ENDPOINT.authenticationToken,
      {
        urlParams: { userId: 'current', cartId: 'cart-1' },
      },
    );
    request.flush({ token: 'jwt', expirationDate: '2099-01-01T00:00:00Z' });
  });

  it('calls the backend-plugin place-order endpoint with the storefront body', () => {
    const body = { commerceCaseId: 'case-1', checkoutId: 'checkout-1' };

    adapter.placeOrder('current', 'cart-1', body).subscribe();

    const request = http.expectOne(`/occ/${PAYONE_OCC_ENDPOINT.placeOrder}`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toBe(body);
    expect(buildUrl).toHaveBeenCalledWith(PAYONE_OCC_ENDPOINT.placeOrder, {
      urlParams: { userId: 'current', cartId: 'cart-1' },
    });
    request.flush({ orderCode: 'order-1', paymentStatus: 'CAPTURED' });
  });
});
