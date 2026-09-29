import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { Config, CTPConfig } from 'pcp-client-javascript-sdk';
import { PCPCreditCardTokenizer } from 'pcp-client-javascript-sdk';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  PAYONE_HOSTED_TOKENIZATION_CONFIG,
  resolvePayoneHostedTokenizationConfig,
} from '../config/payone-hosted-tokenization.config';
import type { PayoneHostedTokenizationSession } from '../core/models/payone.models';
import { PayoneSdkTokenizerService } from './payone-sdk-tokenizer.service';

const session: PayoneHostedTokenizationSession = {
  token: 'short-lived-jwt',
  expiresAt: '2099-01-01T00:00:00Z',
  mode: 'test',
  locale: 'de',
  allowedCardSchemes: ['visa', 'mastercard'],
};

function configure(platformId: 'browser' | 'server'): PayoneSdkTokenizerService {
  TestBed.configureTestingModule({
    providers: [
      PayoneSdkTokenizerService,
      { provide: PLATFORM_ID, useValue: platformId },
      {
        provide: PAYONE_HOSTED_TOKENIZATION_CONFIG,
        useValue: resolvePayoneHostedTokenizationConfig(),
      },
    ],
  });
  return TestBed.inject(PayoneSdkTokenizerService);
}

describe('PayoneSdkTokenizerService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('initializes the verified SDK configuration and emits success', async () => {
    let capturedConfig: Config | undefined;
    vi.spyOn(PCPCreditCardTokenizer, 'create').mockImplementation(async (config) => {
      capturedConfig = config;
      return {} as PCPCreditCardTokenizer;
    });
    const service = configure('browser');
    const wrapper = document.createElement('div');
    const button = document.createElement('button');
    const results = vi.fn();
    service.result$.subscribe(results);

    await service.initialize(session, wrapper, button);

    expect(capturedConfig).toMatchObject({
      token: 'short-lived-jwt',
      mode: 'test',
      locale: 'de_DE',
      allowedCardSchemes: ['visa', 'mastercard'],
      submitButton: { element: button },
    });
    const successCallback = capturedConfig?.tokenizationSuccessCallback as
      | (NonNullable<Config['tokenizationSuccessCallback']> &
          ((...args: [...Parameters<Config['tokenizationSuccessCallback']>, string]) => void))
      | undefined;
    successCallback?.(
      201,
      'opaque-token',
      {
        cardholderName: 'Ignored',
        cardNumber: '411111XXXXXX1111',
        expiryDate: '12/30',
        cardType: 'VISA',
      },
      'manual',
      'DE',
    );
    expect(results).toHaveBeenCalledWith({
      type: 'success',
      statusCode: 201,
      paymentProcessingToken: 'opaque-token',
      cardType: 'visa',
      cardDetails: {
        cardholderName: 'Ignored',
        cardNumber: '411111XXXXXX1111',
        expiryDate: '12/30',
      },
      inputMode: 'manual',
      issuerCountry: 'DE',
    });
  });

  it('recovers American Express when SDK 1.4 returns a null card type', async () => {
    let capturedConfig: Config | undefined;
    vi.spyOn(PCPCreditCardTokenizer, 'create').mockImplementation(async (config) => {
      capturedConfig = config;
      return {} as PCPCreditCardTokenizer;
    });
    const service = configure('browser');
    const results = vi.fn();
    service.result$.subscribe(results);

    await service.initialize(
      { ...session, allowedCardSchemes: ['amex'] },
      document.createElement('div'),
      document.createElement('button'),
    );

    const successCallback = capturedConfig?.tokenizationSuccessCallback as
      | ((
          statusCode: number,
          token: string,
          cardDetails: {
            cardholderName: string;
            cardNumber: string;
            expiryDate: string;
            cardType: string | null;
          },
          inputMode: string,
        ) => void)
      | undefined;
    successCallback?.(
      201,
      '9340000000000014184',
      {
        cardholderName: 'test Test',
        cardNumber: '340000XXXXX0009',
        expiryDate: '1129',
        cardType: null,
      },
      'manual',
    );

    expect(results).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'success',
        paymentProcessingToken: '9340000000000014184',
        cardType: 'amex',
      }),
    );
  });

  it('passes extended iframe, field and backend-authored Click to Pay configuration', async () => {
    let capturedConfig: Config | undefined;
    vi.spyOn(PCPCreditCardTokenizer, 'create').mockImplementation(async (config) => {
      capturedConfig = config;
      return {} as PCPCreditCardTokenizer;
    });
    TestBed.configureTestingModule({
      providers: [
        PayoneSdkTokenizerService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: PAYONE_HOSTED_TOKENIZATION_CONFIG,
          useValue: resolvePayoneHostedTokenizationConfig({
            iframe: { width: '100%', zIndex: '9999' },
            isSecurityCodeMasked: true,
            strictCardholderName: false,
          }),
        },
      ],
    });
    const clickToPay: CTPConfig = {
      enableCTP: true,
      enableCustomerOnboarding: true,
      schemeConfig: { merchantPresentationName: 'Store' },
      transactionAmount: { amount: '1999', currencyCode: 'EUR' },
    };

    await TestBed.inject(PayoneSdkTokenizerService).initialize(
      { ...session, email: 'shopper@example.test', clickToPay },
      document.createElement('div'),
      document.createElement('button'),
    );

    expect(capturedConfig).toMatchObject({
      email: 'shopper@example.test',
      isSecurityCodeMasked: true,
      strictCardholderName: false,
      CTPConfig: clickToPay,
      iframe: { width: '100%', zIndex: '9999' },
    });
  });

  it('maps the SDK failure callback to a safe error', async () => {
    let capturedConfig: Config | undefined;
    vi.spyOn(PCPCreditCardTokenizer, 'create').mockImplementation(async (config) => {
      capturedConfig = config;
      return {} as PCPCreditCardTokenizer;
    });
    const service = configure('browser');
    const results = vi.fn();
    service.result$.subscribe(results);

    await service.initialize(
      session,
      document.createElement('div'),
      document.createElement('button'),
    );
    capturedConfig?.tokenizationFailureCallback(400, {
      error: 'raw provider error that must not escape',
    });

    expect(results).toHaveBeenCalledWith({
      type: 'failure',
      statusCode: 400,
      error: {
        code: 'TOKENIZATION_FAILED',
        message: 'Card details could not be tokenized.',
      },
    });
  });

  it('cleans up the owned DOM resources', async () => {
    vi.spyOn(PCPCreditCardTokenizer, 'create').mockImplementation(async (config) => {
      if (config.submitButton.element) {
        config.submitButton.element.onclick = () => undefined;
      }
      return {} as PCPCreditCardTokenizer;
    });
    const service = configure('browser');
    const wrapper = document.createElement('div');
    wrapper.append(document.createElement('iframe'));
    const button = document.createElement('button');

    await service.initialize(session, wrapper, button);
    service.destroy();

    expect(button.onclick).toBeNull();
    expect(wrapper.childElementCount).toBe(0);
  });

  it('does not initialize the SDK during SSR', async () => {
    const create = vi.spyOn(PCPCreditCardTokenizer, 'create');
    const service = configure('server');

    await expect(
      service.initialize(session, document.createElement('div'), document.createElement('button')),
    ).rejects.toThrow(/server rendering/);
    expect(create).not.toHaveBeenCalled();
  });
});
