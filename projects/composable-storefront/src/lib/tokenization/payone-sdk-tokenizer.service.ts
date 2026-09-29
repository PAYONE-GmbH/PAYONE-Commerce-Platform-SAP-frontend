import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import type { Config } from 'pcp-client-javascript-sdk';
import { PCPCreditCardTokenizer } from 'pcp-client-javascript-sdk';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { PAYONE_HOSTED_TOKENIZATION_CONFIG } from '../config/payone-hosted-tokenization.config';
import type {
  PayoneCardScheme,
  PayoneHostedTokenizationSession,
  PayoneTokenizerResult,
} from '../core/models/payone.models';
import { isPayoneCardScheme } from '../core/models/payone.models';
import { PayoneTokenizer } from './payone-tokenizer';

@Injectable()
export class PayoneSdkTokenizerService extends PayoneTokenizer {
  private static nextWrapperId = 0;

  private readonly platformId = inject(PLATFORM_ID);
  private readonly tokenizationConfig = inject(PAYONE_HOSTED_TOKENIZATION_CONFIG);
  private readonly resultSubject = new Subject<PayoneTokenizerResult>();
  private initializationQueue: Promise<void> = Promise.resolve();
  private generation = 0;
  private activeButton?: HTMLButtonElement;
  private activeWrapper?: HTMLElement;

  override readonly available = isPlatformBrowser(this.platformId);
  override readonly result$: Observable<PayoneTokenizerResult> = this.resultSubject.asObservable();

  override initialize(
    session: PayoneHostedTokenizationSession,
    iframeWrapper: HTMLElement,
    submitButton: HTMLButtonElement,
  ): Promise<void> {
    const generation = ++this.generation;
    this.initializationQueue = this.initializationQueue
      .catch(() => undefined)
      .then(async () => {
        if (generation !== this.generation) {
          return;
        }
        if (!this.available) {
          throw new Error('PAYONE tokenizer is unavailable during server rendering');
        }

        this.cleanupDom();
        this.validateSession(session);

        if (!iframeWrapper.id) {
          iframeWrapper.id = `payone-hosted-card-${++PayoneSdkTokenizerService.nextWrapperId}`;
        }
        this.activeButton = submitButton;
        this.activeWrapper = iframeWrapper;

        const locale = this.tokenizationConfig.localeMapping[session.locale] ?? session.locale;
        const allowedCardSchemes = [...session.allowedCardSchemes];
        const sdkConfig: PayoneSdkConfig = {
          iframe: {
            iframeWrapperId: iframeWrapper.id,
            height: this.tokenizationConfig.iframe.height,
            width: this.tokenizationConfig.iframe.width,
            zIndex: this.tokenizationConfig.iframe.zIndex,
          },
          token: session.token,
          email: session.email,
          mode: session.mode,
          locale,
          allowedCardSchemes,
          isSecurityCodeMasked: this.tokenizationConfig.isSecurityCodeMasked,
          showCardholderName: this.tokenizationConfig.showCardholderName,
          strictCardholderName: this.tokenizationConfig.strictCardholderName,
          uiConfig: this.tokenizationConfig.uiConfig,
          customTextConfig: this.tokenizationConfig.customTextConfig,
          customIconsConfig: this.tokenizationConfig.customIconsConfig,
          CTPConfig: session.clickToPay,
          submitButton: { element: submitButton },
          tokenizationSuccessCallback: (
            statusCode,
            paymentProcessingToken,
            cardDetails,
            inputMode,
            issuerCountry,
          ) => {
            if (generation !== this.generation) {
              return;
            }
            if (paymentProcessingToken.length === 0 || paymentProcessingToken.length > 40) {
              this.emitFailure('INVALID_TOKENIZATION_RESPONSE');
              return;
            }
            const cardType = this.resolveCardScheme(
              cardDetails.cardType,
              cardDetails.cardNumber,
            );
            if (cardType === undefined || !allowedCardSchemes.includes(cardType)) {
              this.emitFailure('UNSUPPORTED_CARD_SCHEME');
              return;
            }

            this.resultSubject.next({
              type: 'success',
              statusCode,
              paymentProcessingToken,
              cardType,
              cardDetails: {
                cardholderName: cardDetails.cardholderName,
                cardNumber: cardDetails.cardNumber,
                expiryDate: cardDetails.expiryDate,
              },
              inputMode,
              issuerCountry: issuerCountry ?? cardDetails.issuerCountry,
            });
          },
          tokenizationFailureCallback: (statusCode) => {
            if (generation === this.generation) {
              this.emitFailure('TOKENIZATION_FAILED', statusCode);
            }
          },
        };

        await PCPCreditCardTokenizer.create(sdkConfig as Config);
        if (generation !== this.generation) {
          this.cleanupDom();
        }
      });

    return this.initializationQueue;
  }

  override destroy(): void {
    this.generation += 1;
    this.cleanupDom();
  }

  private validateSession(session: PayoneHostedTokenizationSession): void {
    const expiresAt = Date.parse(session.expiresAt);
    const clickToPayAmount = session.clickToPay?.transactionAmount;
    if (
      !session.token ||
      !Number.isFinite(expiresAt) ||
      expiresAt <= Date.now() ||
      (session.mode !== 'test' && session.mode !== 'live') ||
      session.allowedCardSchemes.length === 0 ||
      session.allowedCardSchemes.some((scheme) => !isPayoneCardScheme(scheme)) ||
      (clickToPayAmount !== undefined &&
        (!/^\d+(?:\.\d+)?$/.test(clickToPayAmount.amount) ||
          !/^[A-Z]{3}$/.test(clickToPayAmount.currencyCode)))
    ) {
      throw new Error('Invalid hosted tokenization session');
    }
  }

  private resolveCardScheme(
    sdkCardType: string | null | undefined,
    maskedCardNumber: string,
  ): PayoneCardScheme | undefined {
    if (typeof sdkCardType === 'string') {
      const normalizedCardType = sdkCardType.trim().toLowerCase();
      if (isPayoneCardScheme(normalizedCardType)) {
        return normalizedCardType;
      }
      if (normalizedCardType.length > 0) {
        return undefined;
      }
    }

    // Hosted Tokenization 1.4 can return cardType=null for American Express.
    // The callback contains only a masked PAN, but its 34/37 issuer prefix is
    // sufficient to recover this scheme without exposing or storing the PAN.
    const visibleDigits = maskedCardNumber.replace(/\D/g, '');
    return /^3[47]/.test(visibleDigits) ? 'amex' : undefined;
  }

  private emitFailure(code: string, statusCode?: number): void {
    this.resultSubject.next({
      type: 'failure',
      statusCode,
      error: {
        code,
        message: 'Card details could not be tokenized.',
      },
    });
  }

  private cleanupDom(): void {
    if (this.activeButton) {
      this.activeButton.onclick = null;
    }
    this.activeWrapper?.replaceChildren();
    this.activeButton = undefined;
    this.activeWrapper = undefined;
  }
}

interface PayoneSdkConfig extends Omit<Config, 'iframe' | 'tokenizationSuccessCallback'> {
  iframe: {
    iframeWrapperId: string;
    height?: number | string;
    width?: number | string;
    zIndex?: number | string;
  };
  isSecurityCodeMasked: boolean;
  strictCardholderName: boolean;
  tokenizationSuccessCallback: (
    statusCode: number,
    token: string,
    cardDetails: {
      cardholderName: string;
      cardNumber: string;
      expiryDate: string;
      cardType: string | null;
      issuerCountry?: string;
    },
    inputMode: string,
    issuerCountry?: string,
  ) => void;
}
