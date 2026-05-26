# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-05-26

### Changed

- Aligned SDK resources, input types, webhook events, reports, and pagination metadata with the current Cynco API.
- Removed convenience methods for routes that are not exposed by the API.
- Updated package metadata to the `cynco-labs` GitHub organization.

### Added

- Batch helpers for invoices, customers, vendors, and journal entries.
- Top-level `bankTransactions` resource for `/bank-transactions`.
- Top-level `generalLedger` resource for `/general-ledger`.
- Webhook create response typing that exposes the one-time signing secret only on creation.

## [0.1.0] - 2026-03-22

### Added

- Initial release of the Cynco TypeScript SDK.
- Resource clients: invoices, customers, vendors, bills, items, accounts, journal entries, bank accounts, reports, webhooks.
- Auto-pagination with `for await...of` support.
- Automatic retry with exponential backoff for rate limits and server errors.
- Idempotency key support for safe mutation retries.
- Webhook signature verification with HMAC-SHA256.
- Full TypeScript types for all API resources and operations.
- ESM and CommonJS dual-package output.
- Configurable base URL, timeout, max retries, and custom fetch.
