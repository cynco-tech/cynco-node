import { CyncoClient } from './client.js';
import { webhookVerifier } from './webhooks.js';
import { Invoices } from './resources/invoices.js';
import { Customers } from './resources/customers.js';
import { Vendors } from './resources/vendors.js';
import { Bills } from './resources/bills.js';
import { Items } from './resources/items.js';
import { Accounts } from './resources/accounts.js';
import { JournalEntries } from './resources/journal-entries.js';
import { BankAccounts } from './resources/bank-accounts.js';
import { Reports } from './resources/reports.js';
import { Webhooks } from './resources/webhooks.js';
import type { CyncoClientOptions } from './types.js';

/**
 * The official Cynco TypeScript SDK.
 *
 * ```ts
 * import Cynco from 'cynco';
 *
 * const cynco = new Cynco('cak_your_api_key');
 *
 * const { data } = await cynco.invoices.list({ limit: 20 });
 * ```
 */
class Cynco {
  /** Invoices resource. */
  readonly invoices: Invoices;
  /** Customers resource. */
  readonly customers: Customers;
  /** Vendors resource. */
  readonly vendors: Vendors;
  /** Bills resource. */
  readonly bills: Bills;
  /** Items (products & services) resource. */
  readonly items: Items;
  /** Chart of accounts resource. */
  readonly accounts: Accounts;
  /** Journal entries resource. */
  readonly journalEntries: JournalEntries;
  /** Bank accounts resource. */
  readonly bankAccounts: BankAccounts;
  /** Financial reports resource. */
  readonly reports: Reports;
  /** Webhook endpoints resource. */
  readonly webhooks: Webhooks;

  /**
   * Static webhook signature verification utilities.
   *
   * ```ts
   * const valid = Cynco.webhooks.verify(payload, signature, timestamp, secret);
   * ```
   */
  static readonly webhooks = webhookVerifier;

  private readonly _client: CyncoClient;

  /**
   * Create a new Cynco client instance.
   *
   * @param apiKey  - Your Cynco API key (starts with `cak_`).
   * @param options - Optional client configuration.
   */
  constructor(apiKey: string, options?: CyncoClientOptions) {
    this._client = new CyncoClient(apiKey, options);

    this.invoices = new Invoices(this._client);
    this.customers = new Customers(this._client);
    this.vendors = new Vendors(this._client);
    this.bills = new Bills(this._client);
    this.items = new Items(this._client);
    this.accounts = new Accounts(this._client);
    this.journalEntries = new JournalEntries(this._client);
    this.bankAccounts = new BankAccounts(this._client);
    this.reports = new Reports(this._client);
    this.webhooks = new Webhooks(this._client);
  }
}

// ---------------------------------------------------------------------------
// Re-exports
// ---------------------------------------------------------------------------

export default Cynco;
export { Cynco };

// Client
export { CyncoClient } from './client.js';

// Errors
export {
  CyncoError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalError,
  TimeoutError,
  ConnectionError,
} from './errors.js';

// Pagination
export { Page, CursorPage, PagePromise, CursorPagePromise } from './pagination.js';

// Webhooks
export { webhookVerifier } from './webhooks.js';

// Resources
export { Invoices } from './resources/invoices.js';
export { Customers } from './resources/customers.js';
export { Vendors } from './resources/vendors.js';
export { Bills } from './resources/bills.js';
export { Items } from './resources/items.js';
export { Accounts } from './resources/accounts.js';
export { JournalEntries } from './resources/journal-entries.js';
export { BankAccounts } from './resources/bank-accounts.js';
export { Reports } from './resources/reports.js';
export { Webhooks } from './resources/webhooks.js';

// Types — re-export everything from types.ts
export type {
  // Client config
  CyncoClientOptions,
  RequestOptions,
  // Response envelopes
  CyncoResponse,
  PaginatedResponse,
  CursorPaginatedResponse,
  OffsetPagination,
  CursorPagination,
  PaginationLinks,
  ResponseMeta,
  RateLimitInfo,
  ErrorResponse,
  ValidationDetail,
  // List params
  ListParams,
  InvoiceListParams,
  CustomerListParams,
  VendorListParams,
  BillListParams,
  ItemListParams,
  AccountListParams,
  JournalEntryListParams,
  BankAccountListParams,
  BankTransactionListParams,
  WebhookListParams,
  // Create / update inputs
  InvoiceCreateInput,
  InvoiceUpdateInput,
  InvoiceLineItemInput,
  CustomerCreateInput,
  CustomerUpdateInput,
  VendorCreateInput,
  VendorUpdateInput,
  BillCreateInput,
  BillUpdateInput,
  BillLineItemInput,
  ItemCreateInput,
  ItemUpdateInput,
  AccountCreateInput,
  AccountUpdateInput,
  JournalEntryCreateInput,
  JournalEntryUpdateInput,
  JournalEntryLineInput,
  BankAccountCreateInput,
  BankAccountUpdateInput,
  WebhookCreateInput,
  WebhookUpdateInput,
  // Resource types
  Invoice,
  InvoiceLineItem,
  InvoiceStatus,
  Customer,
  Vendor,
  Bill,
  BillLineItem,
  BillStatus,
  Item,
  Account,
  AccountType,
  JournalEntry,
  JournalEntryLine,
  BankAccount,
  BankTransaction,
  Webhook,
  WebhookEvent,
  WebhookPayload,
  // Reports
  ReportParams,
  BalanceSheetReport,
  ProfitAndLossReport,
  TrialBalanceReport,
  TrialBalanceRow,
  ReportSection,
  ReportRow,
  // Shared
  Address,
  BankDetails,
} from './types.js';
