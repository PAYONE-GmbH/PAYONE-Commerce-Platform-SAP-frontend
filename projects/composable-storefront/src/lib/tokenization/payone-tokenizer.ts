import type { Observable } from 'rxjs';
import type {
  PayoneHostedTokenizationSession,
  PayoneTokenizerResult,
} from '../core/models/payone.models';

export abstract class PayoneTokenizer {
  abstract readonly available: boolean;
  abstract readonly result$: Observable<PayoneTokenizerResult>;

  abstract initialize(
    session: PayoneHostedTokenizationSession,
    iframeWrapper: HTMLElement,
    submitButton: HTMLButtonElement,
  ): Promise<void>;

  abstract destroy(): void;
}
