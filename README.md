# @cynco/sdk

The official TypeScript SDK for the [Cynco](https://cynco.io) REST API.

Cynco is an AI-native business platform for accounting, invoicing, payments, and operations. This SDK provides full typed access to the Cynco API from any Node.js or TypeScript environment.

## Installation

```bash
npm install @cynco/sdk
```

```bash
pnpm add @cynco/sdk
```

```bash
yarn add @cynco/sdk
```

**Requirements:** Node.js 18 or later.

## Quick Start

```typescript
import Cynco from '@cynco/sdk';

const cynco = new Cynco('cak_your_api_key');

// List invoices
const page = await cynco.invoices.list({ status: 'paid', limit: 20 });
console.log(page.data); // Invoice[]

// Create a customer
const customer = await cynco.customers.create({
  name: 'Acme Corp',
  email: 'billing@acme.com',
  type: 'company',
  currency: 'MYR',
});

// Retrieve a single resource
const invoice = await cynco.invoices.retrieve('inv_abc123');
```

## Configuration

```typescript
const cynco = new Cynco('cak_your_api_key', {
  baseUrl: 'https://app.cynco.io/api/v1', // Default
  timeout: 30_000,                         // 30 seconds (default)
  maxRetries: 3,                           // Automatic retries (default)
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseUrl` | `string` | `https://app.cynco.io/api/v1` | API base URL |
| `timeout` | `number` | `30000` | Request timeout in milliseconds |
| `maxRetries` | `number` | `3` | Max retries on transient failures |
| `fetch` | `typeof fetch` | `globalThis.fetch` | Custom fetch implementation |

## Resources

All resources follow a consistent pattern:

```typescript
cynco.{resource}.list(params?)      // Paginated list (also async iterable)
cynco.{resource}.retrieve(id)       // Get by ID
cynco.{resource}.create(data, opts) // Create (where applicable)
cynco.{resource}.update(id, data)   // Update (where applicable)
cynco.{resource}.delete(id)         // Delete (where applicable)
```

### Invoices

```typescript
// List with filters
const page = await cynco.invoices.list({
  status: 'overdue',
  customerId: 'cust_abc',
  dateFrom: '2026-01-01',
  limit: 50,
});

// Create
const invoice = await cynco.invoices.create({
  customerId: 'cust_abc',
  issueDate: '2026-03-22',
  dueDate: '2026-04-22',
  lineItems: [
    { description: 'Consulting', quantity: 10, unitPrice: 500 },
  ],
});

// Actions
await cynco.invoices.send('inv_123');
await cynco.invoices.markPaid('inv_123', { paidDate: '2026-03-25' });
await cynco.invoices.void('inv_123');

// PDF
const { url } = await cynco.invoices.getPdf('inv_123');
```

### Customers

```typescript
const page = await cynco.customers.list({ search: 'acme', type: 'company' });
const customer = await cynco.customers.create({ name: 'Acme Corp' });
const updated = await cynco.customers.update('cust_123', { name: 'Acme Inc' });
await cynco.customers.delete('cust_123');
```

### Vendors

```typescript
const page = await cynco.vendors.list({ search: 'supplier' });
const vendor = await cynco.vendors.create({
  name: 'Office Supplies Co',
  email: 'accounts@supplier.com',
});
```

### Bills

```typescript
const page = await cynco.bills.list({ status: 'received', vendorId: 'vnd_123' });
const bill = await cynco.bills.create({
  vendorId: 'vnd_123',
  issueDate: '2026-03-20',
  dueDate: '2026-04-20',
  lineItems: [{ description: 'Paper supplies', quantity: 100, unitPrice: 5 }],
});

await cynco.bills.markPaid('bill_123');
await cynco.bills.void('bill_123');
```

### Items

```typescript
const page = await cynco.items.list({ type: 'service' });
const item = await cynco.items.create({
  name: 'Consulting Hour',
  type: 'service',
  unitPrice: 500,
});
```

### Chart of Accounts

```typescript
const page = await cynco.accounts.list({ type: 'revenue' });
const account = await cynco.accounts.create({
  name: 'Sales Revenue',
  code: '4000',
  type: 'revenue',
});
```

### Journal Entries

```typescript
const page = await cynco.journalEntries.list({ status: 'posted' });
const entry = await cynco.journalEntries.create({
  date: '2026-03-22',
  description: 'Monthly depreciation',
  lines: [
    { accountId: 'acc_dep_exp', debit: 1000, credit: 0 },
    { accountId: 'acc_accum_dep', debit: 0, credit: 1000 },
  ],
});

await cynco.journalEntries.post('je_123');
await cynco.journalEntries.void('je_123');
```

### Bank Accounts

```typescript
const page = await cynco.bankAccounts.list();
const account = await cynco.bankAccounts.create({
  name: 'Operating Account',
  accountNumber: '1234567890',
  bankName: 'Maybank',
  currency: 'MYR',
});

// List transactions for a bank account
const txns = await cynco.bankAccounts.listTransactions('ba_123', {
  status: 'cleared',
  dateFrom: '2026-03-01',
});
```

### Reports

```typescript
const bs = await cynco.reports.balanceSheet({
  endDate: '2026-03-31',
  currency: 'MYR',
});
console.log(bs.totalAssets, bs.totalLiabilities, bs.totalEquity);

const pnl = await cynco.reports.profitAndLoss({
  startDate: '2026-01-01',
  endDate: '2026-03-31',
});
console.log(pnl.netIncome);

const tb = await cynco.reports.trialBalance({ endDate: '2026-03-31' });
console.log(tb.totalDebits, tb.totalCredits);
```

### Webhooks

```typescript
const page = await cynco.webhooks.list();
const webhook = await cynco.webhooks.create({
  url: 'https://example.com/webhooks/cynco',
  events: ['invoice.paid', 'customer.created'],
});

await cynco.webhooks.update('wh_123', { isActive: false });
const { secret } = await cynco.webhooks.rotateSecret('wh_123');
```

## Pagination

### Standard (single page)

```typescript
const page = await cynco.invoices.list({ limit: 20, offset: 40 });

console.log(page.data);               // Invoice[]
console.log(page.pagination.total);    // Total count
console.log(page.pagination.hasMore);  // More pages?

// Manual pagination
const nextPage = await page.nextPage(); // Page<Invoice> | null
```

### Auto-pagination

Iterate over all items across all pages automatically:

```typescript
for await (const invoice of cynco.invoices.list({ limit: 50 })) {
  console.log(invoice.id);
}
```

### Collect all items

```typescript
const allCustomers: Customer[] = [];
for await (const customer of cynco.customers.list({ limit: 100 })) {
  allCustomers.push(customer);
}
```

## Error Handling

All API errors are instances of `CyncoError` with specific subclasses:

```typescript
import Cynco, {
  CyncoError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
} from '@cynco/sdk';

try {
  await cynco.customers.create({ name: '' });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log(error.status);    // 422
    console.log(error.code);      // "validation_error"
    console.log(error.message);   // "Validation failed"
    console.log(error.details);   // [{ field: "name", message: "is required" }]
    console.log(error.requestId); // UUID for support
  }
}
```

| Error Class | Status | When |
|-------------|--------|------|
| `AuthenticationError` | 401 | Invalid or missing API key |
| `PermissionError` | 403 | Insufficient permissions |
| `NotFoundError` | 404 | Resource does not exist |
| `ConflictError` | 409 | Conflicting request |
| `ValidationError` | 422 | Invalid request body |
| `RateLimitError` | 429 | Rate limit exceeded (after retries) |
| `InternalError` | 5xx | Server error (after retries) |
| `TimeoutError` | - | Request timed out |
| `ConnectionError` | - | Network unreachable |

## Retries

The SDK automatically retries on rate limits (429) and server errors (5xx) with exponential backoff and jitter.

- **GET, HEAD, DELETE** requests are always retried.
- **POST, PATCH, PUT** requests are only retried if an idempotency key is provided (except for 429, which is always safe to retry since the request was never processed).
- Retries respect the `Retry-After` header.
- Maximum retry count is configurable via `maxRetries` (default: 3).

## Idempotency

For safe retries on mutations, pass an idempotency key:

```typescript
const customer = await cynco.customers.create(
  { name: 'Acme Corp' },
  { idempotencyKey: 'create-acme-20260322' },
);
```

If a request with the same idempotency key was already processed, the API returns the original response instead of creating a duplicate.

## Webhook Verification

Verify incoming webhook signatures using the static `Cynco.webhooks` utility. No client instantiation needed.

```typescript
import Cynco from '@cynco/sdk';

// In your webhook handler (e.g. Express)
app.post('/webhooks/cynco', (req, res) => {
  const payload = req.body;       // Raw string body
  const signature = req.headers['x-webhook-signature'];
  const timestamp = req.headers['x-webhook-timestamp'];

  const isValid = Cynco.webhooks.verify(
    payload,
    signature,
    timestamp,
    process.env.CYNCO_WEBHOOK_SECRET,
  );

  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(payload);
  // Handle the event...

  res.sendStatus(200);
});
```

### Verify or throw

```typescript
try {
  Cynco.webhooks.verifyOrThrow(payload, signature, timestamp, secret);
} catch (error) {
  // "Invalid webhook signature" or "Webhook timestamp is too old"
}
```

### Custom tolerance

By default, timestamps older than 5 minutes are rejected. You can customise this:

```typescript
Cynco.webhooks.verify(payload, signature, timestamp, secret, {
  tolerance: 600, // 10 minutes
});
```

### Testing webhooks

Generate test signatures for development:

```typescript
const { signature, timestamp } = Cynco.webhooks.sign(
  JSON.stringify({ event: 'invoice.paid', data: {} }),
  'whsec_your_test_secret',
);
```

## TypeScript

Every resource, parameter, and response is fully typed. Import individual types as needed:

```typescript
import type {
  Invoice,
  Customer,
  InvoiceCreateInput,
  CustomerListParams,
  PaginatedResponse,
  WebhookEvent,
} from '@cynco/sdk';
```

## CommonJS

The SDK ships as a dual ESM/CJS package:

```javascript
const { default: Cynco } = require('cynco');
const cynco = new Cynco('cak_your_api_key');
```

## License

MIT - Cynco Sdn Bhd
