import { NgClass } from '@angular/common';
import type { AfterViewInit, ElementRef, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type {
  PayoneHostedTokenizationSession,
  PayoneTokenizerFailure,
  PayoneTokenizerSuccess,
} from '../../core/models/payone.models';
import { PayoneTokenizer } from '../../tokenization/payone-tokenizer';

export type PayoneHostedTokenizationPhase =
  | 'IDLE'
  | 'INITIALIZING'
  | 'READY'
  | 'TOKENIZING'
  | 'FAILED';

@Component({
  selector: 'payone-hosted-tokenization',
  standalone: true,
  imports: [NgClass],
  templateUrl: './payone-hosted-tokenization.component.html',
  styleUrl: './payone-hosted-tokenization.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayoneHostedTokenizationComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly tokenizer = inject(PayoneTokenizer);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private viewReady = false;
  private generation = 0;

  @Input({ required: true }) session?: PayoneHostedTokenizationSession;
  @Input() submitLabel = 'Submit';
  @Input() submitButtonClass = '';

  @Output() readonly ready = new EventEmitter<void>();
  @Output() readonly tokenized = new EventEmitter<PayoneTokenizerSuccess>();
  @Output() readonly tokenizationFailed = new EventEmitter<PayoneTokenizerFailure>();

  @ViewChild('iframeWrapper') private iframeWrapper?: ElementRef<HTMLElement>;
  @ViewChild('submitButton') private submitButton?: ElementRef<HTMLButtonElement>;

  phase: PayoneHostedTokenizationPhase = 'IDLE';

  constructor() {
    this.tokenizer.result$.pipe(takeUntilDestroyed()).subscribe((result) => {
      if (result.type === 'success') {
        this.phase = 'READY';
        this.tokenized.emit(result);
      } else {
        // A tokenization failure may be recoverable after the shopper corrects
        // the hosted form, so keep the merchant submit button available.
        this.phase = 'READY';
        this.tokenizationFailed.emit(result);
      }
      this.changeDetector.markForCheck();
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    void this.initialize();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['session'] && this.viewReady) {
      void this.initialize();
    }
  }

  ngOnDestroy(): void {
    this.generation += 1;
    this.tokenizer.destroy();
  }

  onSubmit(): void {
    if (this.phase === 'READY') {
      this.phase = 'TOKENIZING';
    }
  }

  private async initialize(): Promise<void> {
    const session = this.session;
    const wrapper = this.iframeWrapper?.nativeElement;
    const button = this.submitButton?.nativeElement;
    if (!session || !wrapper || !button || !this.tokenizer.available) {
      return;
    }

    const generation = ++this.generation;
    this.phase = 'INITIALIZING';
    this.changeDetector.markForCheck();
    try {
      await this.tokenizer.initialize(session, wrapper, button);
      if (generation !== this.generation) {
        return;
      }
      this.phase = 'READY';
      this.ready.emit();
    } catch {
      if (generation !== this.generation) {
        return;
      }
      const failure: PayoneTokenizerFailure = {
        type: 'failure',
        error: {
          code: 'TOKENIZER_INITIALIZATION_FAILED',
          message: 'Secure card fields could not be initialized.',
        },
      };
      this.phase = 'FAILED';
      this.tokenizationFailed.emit(failure);
    }
    this.changeDetector.markForCheck();
  }
}
