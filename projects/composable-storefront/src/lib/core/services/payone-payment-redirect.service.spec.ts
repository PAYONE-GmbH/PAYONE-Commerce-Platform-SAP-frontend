import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PayonePaymentRedirectService } from './payone-payment-redirect.service';

describe('PayonePaymentRedirectService', () => {
  let service: PayonePaymentRedirectService;
  let location: { href: string };

  beforeEach(() => {
    location = { href: 'https://storefront.example/checkout' };
    TestBed.configureTestingModule({
      providers: [
        PayonePaymentRedirectService,
        {
          provide: DOCUMENT,
          useValue: { defaultView: { location } },
        },
      ],
    });
    service = TestBed.inject(PayonePaymentRedirectService);
  });

  it('performs a full-page redirect for a redirected payment', () => {
    expect(
      service.redirectIfRequired(
        'REDIRECTED',
        'https://payments.example/continue',
      ),
    ).toBe(true);
    expect(location.href).toBe('https://payments.example/continue');
  });

  it('ignores payment results that do not require a redirect', () => {
    expect(
      service.redirectIfRequired(
        'CAPTURED',
        'https://payments.example/continue',
      ),
    ).toBe(false);
    expect(location.href).toBe('https://storefront.example/checkout');
  });

  it('ignores redirected results without a redirect URL', () => {
    expect(service.redirectIfRequired('REDIRECTED')).toBe(false);
    expect(location.href).toBe('https://storefront.example/checkout');
  });
});
