# Backend-plugin controller contract

The controller exposes these cart-scoped endpoints:

```http
POST /occ/v2/{baseSiteId}/users/{userId}/carts/{cartId}/payone/authentication-token
POST /occ/v2/{baseSiteId}/users/{userId}/carts/{cartId}/payone/commerce-case
POST /occ/v2/{baseSiteId}/users/{userId}/carts/{cartId}/payone/placeorder
```

The library calls all three endpoints. For `placeorder`, the consuming
storefront owns the request and response DTOs while the library owns only the
cart-scoped OCC transport.

## Authentication token

The response contains the short-lived Hosted Tokenization JWT:

```json
{
  "token": "short-lived-jwt",
  "id": "optional-token-id",
  "expirationDate": "2026-08-21T12:30:00Z"
}
```

It must contain no merchant credentials and must not be cached.

## Commerce case

```json
{
  "commerceCaseId": "case-id",
  "checkoutId": "checkout-id",
  "amount": 1999,
  "currencyIsoCode": "EUR",
  "allowedPaymentActions": ["SALE"]
}
```

Amount, currency, customer, addresses, entries, merchant configuration, and
authorization mode remain backend-authored.

## Storefront-owned place-order contract

The library does not define this endpoint's request or result type. The supplied
storefront constructs the request from the commerce case and tokenization
result, then passes it to `PayoneBackendPluginService.placeOrder()`:

```json
{
  "commerceCaseId": "case-id",
  "checkoutId": "checkout-id",
  "paymentMethod": "CARD",
  "paymentProcessingToken": "opaque-token",
  "paymentProductId": 1
}
```

The product ID mapping is fixed: Visa `1`, American Express `2`, Mastercard
`3`, and Diners Club `132`. The storefront obtains it through
`getPayonePaymentProductId()` rather than configuration.
