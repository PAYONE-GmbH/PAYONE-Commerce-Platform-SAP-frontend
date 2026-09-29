# PAYONE Composable Storefront library

Reusable PAYONE Hosted Tokenization integration for SAP Commerce Cloud
Composable Storefront.

The publishable package is `@payone/composable-storefront`. It supports Angular
21.2, Composable Storefront 221121.15.1, RxJS 7.8, SSR/hydration, and
`pcp-client-javascript-sdk` 1.4.0.

## Scope

The library owns:

- the Hosted Tokenization SDK and iframe lifecycle;
- UI, locale, masking, cardholder-name, validation-icon, and Click to Pay configuration;
- normalized tokenization callbacks;
- `/authentication-token`, `/commerce-case`, and `/placeorder` calls through the SAP Commerce backend plugin;
- full-page navigation for `REDIRECTED` place-order responses;
- the fixed product mapping for Visa (`1`), American Express (`2`), Mastercard (`3`), and Diners Club (`132`).

The library only transports the storefront-authored `/placeorder` body and
response. The consuming storefront owns those DTOs, checkout navigation,
order confirmation, SEPA, and any other payment methods. The browser never calls
PAYONE REST APIs.

## Installation

```bash
npm install @payone/composable-storefront
```

Register the provider:

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
handle its `tokenized` and `tokenizationFailed` events.

See [the storefront integration guide](docs/storefront-integration.md) and
[the backend-plugin contract](docs/api-contract.md). A complete, printable
version is available as the
[PDF integration and usage guide](output/pdf/payone-composable-storefront-integration-guide.pdf).

## Development commands

```bash
npm install
npm run lint
npm test
npm run build
npm run pack:dry-run
```

Never commit npm registry credentials, PAYONE credentials, authentication
tokens, or payment processing tokens.
