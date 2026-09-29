# @payone/composable-storefront

Reusable PAYONE Hosted Tokenization for SAP Commerce Cloud Composable
Storefront.

```ts
import { providePayoneHostedTokenization } from '@payone/composable-storefront';

providePayoneHostedTokenization({
  iframe: { height: 'auto', width: 400, zIndex: 9999 },
  isSecurityCodeMasked: false,
  showCardholderName: true,
  strictCardholderName: true,
});
```

Render `PayoneHostedTokenizationComponent` with a backend-created session and
handle its normalized events. `PayoneBackendPluginService` calls the SAP
Commerce controller's `authentication-token`, `commerce-case`, and `placeorder`
endpoints. The consuming storefront supplies the `placeorder` request and
response types. `PayonePaymentRedirectService` handles full-page navigation for
`REDIRECTED` responses.

The consuming storefront owns checkout navigation, order confirmation, SEPA,
and other project-specific behavior. Use
`getPayonePaymentProductId()` for the fixed Visa, American Express, Mastercard,
and Diners Club product mapping.

The package never calls PAYONE REST APIs directly and never handles PAN or CVV.
