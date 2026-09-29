# Architecture

## Frontend library

The package has one responsibility: initialize PAYONE Hosted Tokenization and
return a normalized tokenization result to a consuming storefront.

It:

- obtains active user/cart IDs through public Composable Storefront facades;
- calls the backend plugin's `/authentication-token`, `/commerce-case`, and `/placeorder` endpoints;
- initializes `PCPCreditCardTokenizer` only in a browser;
- owns only DOM resources created inside its component;
- emits the opaque `paymentProcessingToken`, normalized card scheme, masked card details, input mode, and issuer country;
- performs SSR-safe full-page navigation for `REDIRECTED` place-order responses;
- maps the four supported schemes to fixed PAYONE payment product IDs.

It transports the storefront-authored place-order request but does not define
that request, decide when to place orders, poll payment status, or update
Spartacus order state.

## Consuming storefront

The storefront owns:

- payment-method tabs and checkout navigation;
- the place order request and response;
- delayed execution from the Review Order step;
- non-redirect result and order-confirmation handling;
- SEPA and other project-specific payment methods.

## SAP Commerce backend plugin

The backend authenticates access to the cart, creates the PAYONE authentication
token and commerce case, derives authoritative order/payment data, executes
`PaymentExecution` with `SALE`, places the order, and persists provider IDs.
The browser never calls PAYONE REST APIs.

## Card flow

1. The storefront requests an authentication token and commerce case through `PayoneBackendPluginService`.
2. The storefront passes the backend-created session to `PayoneHostedTokenizationComponent`.
3. The library initializes the hosted iframe.
4. PAYONE returns an opaque token and masked card metadata.
5. The library normalizes the card scheme and emits the tokenization result.
6. The storefront maps the scheme with `getPayonePaymentProductId()`, builds its request, and calls `PayoneBackendPluginService.placeOrder()`.
7. The backend executes and resolves the payment/order flow.
