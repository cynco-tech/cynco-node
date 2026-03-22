// ---------------------------------------------------------------------------
// Client configuration
// ---------------------------------------------------------------------------

export interface CyncoClientOptions {
  /** Base URL for the Cynco API. Defaults to https://app.cynco.io/api/v1 */
  baseUrl?: string;
  /** Request timeout in milliseconds. Defaults to 30000 (30s). */
  timeout?: number;
  /** Maximum number of automatic retries on transient failures. Defaults to 3. */
  maxRetries?: number;
  /** Custom fetch implementation. Defaults to the global fetch. */
  fetch?: typeof globalThis.fetch;
}

export interface RequestOptions {
  /** Idempotency key for safe retries on mutating requests. */
  idempotencyKey?: string;
  /** AbortSignal for request cancellation. */
  signal?: AbortSignal;
  /** Additional headers to merge into the request. */
  headers?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// API response envelopes
// ---------------------------------------------------------------------------

export interface CyncoResponse<T> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: OffsetPagination;
  links?: PaginationLinks;
  meta?: ResponseMeta;
}

export interface CursorPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: CursorPagination;
  links?: PaginationLinks;
  meta?: ResponseMeta;
}

export interface OffsetPagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface CursorPagination {
  limit: number;
  hasMore: boolean;
  nextCursor: string | null;
}

export interface PaginationLinks {
  self?: string;
  next?: string;
  prev?: string;
  first?: string;
  last?: string;
}

export interface ResponseMeta {
  requestId?: string;
  rateLimit?: RateLimitInfo;
  apiVersion?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ValidationDetail[];
  };
  meta?: ResponseMeta;
}

export interface ValidationDetail {
  field: string;
  message: string;
}

// ---------------------------------------------------------------------------
// List / query params
// ---------------------------------------------------------------------------

export interface ListParams {
  page?: number;
  limit?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  fields?: string;
}

/**
 * Query params for GET /api/v1/invoices.
 * Matches the Zod `listQuerySchema` in api.v1.invoices.tsx.
 * Sort accepts: 'created_at' | 'due_date' | 'total'.
 */
export interface InvoiceListParams extends ListParams {
  status?: InvoiceStatus;
  created_from?: string;
  created_to?: string;
  due_from?: string;
  due_to?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

/**
 * Query params for GET /api/v1/customers.
 * Matches the Zod `listQuerySchema` in api.v1.customers.tsx.
 * Sort accepts: 'name' | 'email' | 'created_at'.
 */
export interface CustomerListParams extends ListParams {
  status?: 'active' | 'inactive' | 'all';
  search?: string;
}

/**
 * Query params for GET /api/v1/vendors.
 * Matches the Zod `listQuerySchema` in api.v1.vendors.tsx.
 * Sort accepts: 'name' | 'created_at' | 'total_amount'.
 */
export interface VendorListParams extends ListParams {
  status?: 'active' | 'inactive' | 'all';
  category?: string;
  search?: string;
}

/**
 * Query params for GET /api/v1/bills.
 * Matches the Zod `listQuerySchema` in api.v1.bills.tsx.
 * Sort accepts: 'created_at' | 'due_date' | 'total_amount' | 'bill_number'.
 */
export interface BillListParams extends ListParams {
  status?: BillStatus | 'all';
  search?: string;
  vendorId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Query params for GET /api/v1/items.
 * Matches the Zod `listQuerySchema` in api.v1.items.tsx.
 */
export interface ItemListParams extends ListParams {
  search?: string;
}

/**
 * Query params for GET /api/v1/accounts.
 * Matches the Zod `listQuerySchema` in api.v1.accounts.tsx.
 */
export interface AccountListParams extends ListParams {
  account_type?: AccountType;
  active_only?: 'true' | 'false';
}

export interface JournalEntryListParams extends ListParams {
  dateFrom?: string;
  dateTo?: string;
  status?: 'draft' | 'posted' | 'voided';
  search?: string;
}

export interface BankAccountListParams extends ListParams {
  search?: string;
  isActive?: boolean;
}

export interface BankTransactionListParams extends ListParams {
  bankAccountId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'pending' | 'cleared' | 'reconciled';
  type?: 'credit' | 'debit';
  search?: string;
}

export interface WebhookListParams extends ListParams {
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Create / update inputs
// ---------------------------------------------------------------------------

/**
 * Invoice update input.
 * Matches the Zod `updateInvoiceSchema` in invoice.schemas.ts.
 * Note: Invoice create is not yet exposed via API (Phase 2).
 */
export interface InvoiceUpdateInput {
  memo?: string | null;
  paymentTerms?: string | null;
  dueDate?: string | null;
}

/**
 * Customer create input.
 * Matches the Zod `createCustomerSchema` in customer.schemas.ts.
 */
export interface CustomerCreateInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  registrationNumber?: string;
  taxId?: string;
  website?: string;
  paymentTerms?: string;
  preferredPaymentMethod?: string;
  preferredCurrency?: string;
  creditLimit?: string;
  category?: string;
  notes?: string;
}

/**
 * Customer update input.
 * Matches the Zod `updateCustomerSchema` in customer.schemas.ts.
 * All create fields are optional, plus `isActive`.
 */
export interface CustomerUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  registrationNumber?: string;
  taxId?: string;
  website?: string;
  paymentTerms?: string;
  preferredPaymentMethod?: string;
  preferredCurrency?: string;
  creditLimit?: string;
  category?: string;
  notes?: string;
  isActive?: boolean;
}

/**
 * Vendor create input.
 * Matches the Zod `createVendorSchema` in vendor.schemas.ts.
 */
export interface VendorCreateInput {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  registrationNumber?: string;
  taxId?: string;
  website?: string;
  paymentTerms?: string;
  preferredPaymentMethod?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  category?: string;
  notes?: string;
  defaultExpenseAccountId?: string;
  defaultPayableAccountId?: string;
}

/**
 * Vendor update input.
 * Matches the Zod `updateVendorSchema` in vendor.schemas.ts.
 * All create fields are optional, plus `isActive`.
 */
export interface VendorUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  registrationNumber?: string;
  taxId?: string;
  website?: string;
  paymentTerms?: string;
  preferredPaymentMethod?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranch?: string;
  category?: string;
  notes?: string;
  defaultExpenseAccountId?: string;
  defaultPayableAccountId?: string;
  isActive?: boolean;
}

/**
 * Bill update input.
 * Matches the Zod `updateBillSchema` in bill.schemas.ts.
 * Note: Bill create is not yet exposed via API.
 */
export interface BillUpdateInput {
  vendorId?: string;
  billNumber?: string;
  referenceNumber?: string;
  status?: BillStatus;
  currency?: string;
  dueDate?: string;
  issueDate?: string;
  category?: string;
  memo?: string;
  notes?: string;
}

/**
 * Item create input.
 * Matches the Zod `createItemSchema` in item.schemas.ts.
 */
export interface ItemCreateInput {
  name: string;
  description?: string;
  unitPrice: number;
  taxRate?: number;
  discountRate?: number;
}

/**
 * Item update input.
 * Matches the Zod `updateItemSchema` in item.schemas.ts.
 */
export interface ItemUpdateInput {
  name?: string;
  description?: string;
  unitPrice?: number;
  taxRate?: number;
  discountRate?: number;
}

export interface JournalEntryCreateInput {
  date: string;
  reference?: string;
  description?: string;
  lines: JournalEntryLineInput[];
}

export interface JournalEntryUpdateInput {
  date?: string;
  reference?: string;
  description?: string;
  lines?: JournalEntryLineInput[];
}

export interface JournalEntryLineInput {
  accountId: string;
  debit: number;
  credit: number;
  description?: string;
}

export interface BankAccountCreateInput {
  name: string;
  accountNumber: string;
  bankName: string;
  currency?: string;
  accountId?: string;
  routingNumber?: string;
  swiftCode?: string;
}

export interface BankAccountUpdateInput {
  name?: string;
  bankName?: string;
  currency?: string;
  accountId?: string;
  routingNumber?: string;
  swiftCode?: string;
}

export interface WebhookCreateInput {
  url: string;
  events: WebhookEvent[];
  secret?: string;
  description?: string;
}

export interface WebhookUpdateInput {
  url?: string;
  events?: WebhookEvent[];
  secret?: string;
  description?: string;
  isActive?: boolean;
}

// ---------------------------------------------------------------------------
// Resource types — must EXACTLY match serializer output
// ---------------------------------------------------------------------------

/**
 * Invoice as returned by the API.
 * Matches `serializeInvoice()` in invoice.serializer.ts.
 */
export interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  currency: string;
  lineItems: unknown[];
  taxes: number;
  totalAmount: number | null;
  paidAmount: number;
  hasDeposit: boolean;
  depositAmount: number;
  dueDate: string | null;
  paymentTerms: string | null;
  memo: string | null;
  source: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus =
  | 'draft'
  | 'finalized'
  | 'paid'
  | 'overdue'
  | 'partially_paid'
  | 'deposit_paid'
  | 'deposit_due';

/**
 * Customer as returned by the API.
 * Matches `serializeCustomer()` in customer.serializer.ts.
 */
export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  registrationNumber: string | null;
  taxId: string | null;
  website: string | null;
  paymentTerms: string | null;
  preferredPaymentMethod: string | null;
  preferredCurrency: string | null;
  creditLimit: number | null;
  category: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Vendor as returned by the API.
 * Matches `serializeVendor()` in vendor.serializer.ts.
 */
export interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  registrationNumber: string | null;
  taxId: string | null;
  website: string | null;
  paymentTerms: string | null;
  preferredPaymentMethod: string | null;
  preferredCurrency: string | null;
  creditLimit: number | null;
  category: string | null;
  notes: string | null;
  isActive: boolean;
  totalAmount: number;
  totalPayments: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Bill as returned by the API.
 * Matches `serializeBill()` in bill.serializer.ts.
 */
export interface Bill {
  id: string;
  billNumber: string | null;
  referenceNumber: string | null;
  vendorId: string | null;
  vendorName: string | null;
  status: string;
  currency: string;
  subtotalAmount: number | null;
  taxAmount: number | null;
  totalAmount: number | null;
  issueDate: string | null;
  dueDate: string | null;
  category: string | null;
  memo: string | null;
  notes: string | null;
  source: string | null;
  lineItems: unknown[] | null;
  createdAt: string;
  updatedAt: string;
}

export type BillStatus =
  | 'draft'
  | 'in_review'
  | 'pending_approval'
  | 'approved'
  | 'awaiting_payment'
  | 'scheduled'
  | 'paid'
  | 'rejected'
  | 'void';

/**
 * Item as returned by the API.
 * Matches `serializeItem()` in item.serializer.ts.
 */
export interface Item {
  id: string;
  name: string;
  description: string | null;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Account type values accepted by the accounts API.
 * Matches the `account_type` enum in the accounts route listQuerySchema.
 */
export type AccountType =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense'
  | 'contra_asset'
  | 'contra_liability'
  | 'contra_equity'
  | 'contra_revenue'
  | 'contra_expense';

/**
 * Account as returned by the API.
 * Matches `serializeAccount()` in api.v1.accounts.tsx.
 */
export interface Account {
  id: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  normalBalance: string | null;
  parentAccountId: string | null;
  path: string | null;
  level: number;
  isActive: boolean;
  isSystemAccount: boolean;
  isHeaderAccount: boolean;
  isCashAccount: boolean;
  isBankAccount: boolean;
  taxRelated: boolean;
  defaultTaxRate: number | null;
  taxCode: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  reference: string | null;
  description: string | null;
  status: 'draft' | 'posted' | 'voided';
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  account?: Account;
  debit: number;
  credit: number;
  description: string | null;
}

export interface BankAccount {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  currency: string;
  accountId: string | null;
  routingNumber: string | null;
  swiftCode: string | null;
  balance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  date: string;
  description: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'pending' | 'cleared' | 'reconciled';
  reference: string | null;
  category: string | null;
  matchedTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  secret: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WebhookEvent =
  | 'invoice.created'
  | 'invoice.updated'
  | 'invoice.sent'
  | 'invoice.paid'
  | 'invoice.voided'
  | 'invoice.overdue'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'vendor.created'
  | 'vendor.updated'
  | 'vendor.deleted'
  | 'bill.created'
  | 'bill.updated'
  | 'bill.paid'
  | 'bill.voided'
  | 'payment.received'
  | 'payment.sent'
  | 'bank_transaction.created'
  | 'bank_transaction.reconciled';

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  createdAt: string;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Report types
// ---------------------------------------------------------------------------

export interface ReportParams {
  startDate: string;
  endDate: string;
  currency?: string;
  comparePrevious?: boolean;
}

export interface BalanceSheetReport {
  reportType: 'balance_sheet';
  asOf: string;
  currency: string;
  assets: ReportSection;
  liabilities: ReportSection;
  equity: ReportSection;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
}

export interface ProfitAndLossReport {
  reportType: 'profit_and_loss';
  startDate: string;
  endDate: string;
  currency: string;
  revenue: ReportSection;
  costOfGoodsSold: ReportSection;
  grossProfit: number;
  operatingExpenses: ReportSection;
  operatingIncome: number;
  otherIncome: ReportSection;
  otherExpenses: ReportSection;
  netIncome: number;
}

export interface TrialBalanceReport {
  reportType: 'trial_balance';
  asOf: string;
  currency: string;
  accounts: TrialBalanceRow[];
  totalDebits: number;
  totalCredits: number;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  debit: number;
  credit: number;
}

export interface ReportSection {
  label: string;
  rows: ReportRow[];
  total: number;
}

export interface ReportRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: number;
  previousAmount?: number;
}
