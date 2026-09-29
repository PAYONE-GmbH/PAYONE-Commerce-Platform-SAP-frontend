import { TestBed } from '@angular/core/testing';
import type { Observable } from 'rxjs';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type {
  PayoneHostedTokenizationSession,
  PayoneTokenizerResult,
  PayoneTokenizerSuccess,
} from '../../core/models/payone.models';
import { PayoneTokenizer } from '../../tokenization/payone-tokenizer';
import { PayoneHostedTokenizationComponent } from './payone-hosted-tokenization.component';

class FakeTokenizer extends PayoneTokenizer {
  override readonly available = true;
  readonly results = new Subject<PayoneTokenizerResult>();
  override readonly result$: Observable<PayoneTokenizerResult> = this.results.asObservable();
  readonly initializeSpy = vi.fn<
    (
      session: PayoneHostedTokenizationSession,
      iframeWrapper: HTMLElement,
      submitButton: HTMLButtonElement,
    ) => Promise<void>
  >(async () => undefined);
  readonly destroySpy = vi.fn();

  override initialize(
    session: PayoneHostedTokenizationSession,
    iframeWrapper: HTMLElement,
    submitButton: HTMLButtonElement,
  ): Promise<void> {
    return this.initializeSpy(session, iframeWrapper, submitButton);
  }

  override destroy(): void {
    this.destroySpy();
  }
}

describe('PayoneHostedTokenizationComponent', () => {
  it('owns the hosted fields DOM and emits the normalized tokenizer result', async () => {
    const tokenizer = new FakeTokenizer();
    TestBed.configureTestingModule({
      imports: [PayoneHostedTokenizationComponent],
      providers: [{ provide: PayoneTokenizer, useValue: tokenizer }],
    });
    const fixture = TestBed.createComponent(PayoneHostedTokenizationComponent);
    const session: PayoneHostedTokenizationSession = {
      token: 'jwt',
      expiresAt: '2099-01-01T00:00:00Z',
      mode: 'test',
      locale: 'de-DE',
      allowedCardSchemes: ['visa'],
    };
    const tokenized = vi.fn();
    fixture.componentInstance.tokenized.subscribe(tokenized);
    fixture.componentRef.setInput('session', session);

    fixture.detectChanges();
    await fixture.whenStable();

    expect(tokenizer.initializeSpy).toHaveBeenCalledWith(
      session,
      expect.any(HTMLElement),
      expect.any(HTMLButtonElement),
    );
    const result: PayoneTokenizerSuccess = {
      type: 'success',
      statusCode: 201,
      paymentProcessingToken: 'opaque-token',
      cardType: 'visa',
      cardDetails: {
        cardholderName: 'Test Shopper',
        cardNumber: '411111XXXXXX1111',
        expiryDate: '12/30',
      },
      inputMode: 'manual',
      issuerCountry: 'DE',
    };
    tokenizer.results.next(result);

    expect(tokenized).toHaveBeenCalledWith(result);
    fixture.destroy();
    expect(tokenizer.destroySpy).toHaveBeenCalledOnce();
  });
});
