# Security

- Never put PAYONE API credentials, merchant secrets, or signing material in the package or storefront configuration.
- PAN and CVV remain inside the PAYONE-hosted iframe.
- Never log or persist the Hosted Tokenization JWT or `paymentProcessingToken`.
- Amount, currency, customer data, addresses, merchant reference, return URLs, and `SALE` authorization remain backend-owned.
- The storefront derives `paymentProductId` only through the library's fixed card-scheme mapping; the backend must validate it against the tokenized card.
- Authentication-token responses must not be cached.
- Do not expose raw PAYONE error messages to shoppers.
- Do not commit real test credentials or private npm registry credentials.
