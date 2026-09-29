# Integration with the supplied electronicsstore

The supplied storefront uses `providePayoneHostedTokenization()` and keeps its
existing checkout/order workflow.

## Register the provider

```ts
import { providePayoneHostedTokenization } from '@payone/composable-storefront';

providePayoneHostedTokenization({
  iframe: { height: 'auto', width: 400, zIndex: 9999 },
  isSecurityCodeMasked: false,
  showCardholderName: true,
  strictCardholderName: true,
});
```

The provider registers:

- the Hosted Tokenization SDK wrapper;
- `PayoneBackendPluginService`;
- OCC configuration for `/authentication-token`, `/commerce-case`, and `/placeorder`.

## Create the session

Use `PayoneBackendPluginService` to create the authentication token and commerce
case. Build `PayoneHostedTokenizationSession` from the returned token plus
backend-controlled mode, locale, and allowed schemes.

## Render the component

```html
<payone-hosted-tokenization
  [session]="cardSession"
  submitLabel="Continue with card"
  submitButtonClass="btn btn-primary btn-block"
  (tokenized)="onCardTokenized($event)"
  (tokenizationFailed)="onCardTokenizationFailed($event)"
/>
```

On success, store the opaque token and normalized card scheme until the Review
Order step. The storefront builds its place-order body, calls
`PayoneBackendPluginService.placeOrder()` to post it to `/placeorder`, and uses:

```ts
const paymentProductId = getPayonePaymentProductId(result.cardType);
```

Pass the returned payment status and redirect URL to
`PayonePaymentRedirectService.redirectIfRequired()`. It performs the full-page
navigation and returns whether the result was handled as a redirect.

Supported schemes are Visa, American Express, Mastercard, and Diners Club.

For local package development, build a new versioned `.tgz`, copy it to the
storefront's `local-packages` directory, and install that exact version. A fake
JWT cannot initialize the real PAYONE iframe; mock the tokenizer abstraction in
component tests.
