import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';

/** Handles full-page redirects requested by a PAYONE place-order response. */
@Injectable({ providedIn: 'root' })
export class PayonePaymentRedirectService {
  private readonly document = inject(DOCUMENT);

  redirectIfRequired(paymentStatus: string, redirectUrl?: string): boolean {
    if (paymentStatus !== 'REDIRECTED' || !redirectUrl) {
      return false;
    }

    // A redirect can only be performed in the browser. Returning true during
    // SSR still marks the payment result as redirect-based and prevents the
    // consuming storefront from treating it as a failed order response.
    const browserWindow = this.document.defaultView;
    if (browserWindow) {
      browserWindow.location.href = redirectUrl;
    }

    return true;
  }
}
