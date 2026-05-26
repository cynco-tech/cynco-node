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
  page: number;
  total: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  /** Present only on older test doubles; the live API uses `page`. */
  offset?: number;
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

export type BatchOperationMethod = 'create' | 'update' | 'delete';

export interface BatchOperation<TData = Record<string, unknown>> {
  /** Client-provided identifier returned with the operation result. */
  operationId?: string;
  method: BatchOperationMethod;
  /** Required for update and delete operations. */
  id?: string;
  /** Required for create and update operations. */
  data?: TData;
}

export interface BatchRequest<TData = Record<string, unknown>> {
  operations: BatchOperation<TData>[];
  /** Atomic mode is reserved by the API and must currently be false. */
  atomic?: false;
}

export interface BatchResultItem<TData = Record<string, unknown>> {
  operationId: string;
  status: number;
  data?: TData;
  error?: {
    code: string;
    message: string;
  };
}

export interface BatchResponse<TData = Record<string, unknown>> {
  total: number;
  succeeded: number;
  failed: number;
  results: BatchResultItem<TData>[];
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
  id?: string;
}

export interface JournalEntryListParams extends ListParams {
  period?: string;
  status?: JournalEntryStatus;
  source?: JournalEntrySource;
  search?: string;
}

export interface BankAccountListParams {
  id?: string;
}

export interface BankTransactionListParams extends ListParams {
  id?: string;
  accountId?: string;
  startDate?: string;
  endDate?: string;
  status?: BankTransactionStatus;
  type?: 'credit' | 'debit';
  matchStatus?: BankTransactionMatchStatus;
  search?: string;
}

export interface GeneralLedgerEntryListParams {
  page?: number;
  page_size?: number;
  account_id?: string;
  period?: string;
  start_date?: string;
  end_date?: string;
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
  dueDate?: string;
  issueDate?: string;
  category?: string;
  memo?: string;
  notes?: string;
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

export interface JournalEntryLineInput {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description?: string | null;
  costCenter?: string | null;
  project?: string | null;
  department?: string | null;
}

export interface JournalEntryCreateInput {
  entryDate: string;
  description: string;
  lines: JournalEntryLineInput[];
  memo?: string | null;
  currency?: string;
  documentType?: string | null;
  documentNumber?: string | null;
  documentDate?: string | null;
  vendorId?: string | null;
  vendorName?: string | null;
  customerId?: string | null;
  customerName?: string | null;
  source?: 'manual' | 'adjustment' | 'opening_balance' | 'import';
}

export interface JournalEntryUpdateInput {
  entryDate?: string;
  description?: string;
  lines?: JournalEntryLineInput[];
  memo?: string | null;
  currency?: string;
  documentType?: string | null;
  documentNumber?: string | null;
  documentDate?: string | null;
}

export interface WebhookCreateInput {
  url: string;
  events: WebhookEvent[];
  description?: string;
}

export interface WebhookUpdateInput {
  url?: string;
  events?: WebhookEvent[];
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

export type JournalEntryStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'posted'
  | 'reversed'
  | 'cancelled';

export type JournalEntrySource =
  | 'extraction'
  | 'manual'
  | 'import'
  | 'adjustment'
  | 'opening_balance'
  | 'closing_entry'
  | 'bill'
  | 'invoice'
  | 'credit_note'
  | 'depreciation';

export type BankTransactionStatus =
  | 'imported'
  | 'categorized'
  | 'posted'
  | 'reconciled'
  | 'excluded';

export type BankTransactionMatchStatus =
  | 'unmatched'
  | 'suggested'
  | 'matched'
  | 'reconciled'
  | 'excluded';

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
  entryNumber: string | null;
  entryDate: string;
  period: string | null;
  status: JournalEntryStatus;
  source: JournalEntrySource | null;
  description: string | null;
  memo?: string | null;
  documentType: string | null;
  documentNumber: string | null;
  vendorName: string | null;
  customerName: string | null;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  currency: string;
  isReversal: boolean;
  requiresApproval: boolean;
  /** Present on detail endpoints and absent on list endpoints. */
  lines?: JournalEntryLine[];
  createdAt: string;
}

export interface JournalEntryLine {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description?: string | null;
  costCenter?: string | null;
  project?: string | null;
  department?: string | null;
}

export interface BankAccount {
  id: string;
  accountName: string;
  accountType: string;
  currency: string;
  currentBalance: number;
  creditLimit: number | null;
  openingBalance: number;
  openingBalanceDate: string | null;
  lastStatementDate: string | null;
  lastReconciledDate: string | null;
  displayOrder: number;
  notes: string | null;
  institution: {
    id: string;
    name: string;
    swiftCode: string | null;
  } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankTransaction {
  id: string;
  financialAccountId: string;
  transactionDate: string | null;
  valueDate: string | null;
  rawDescription: string | null;
  cleanDescription: string | null;
  reference: string | null;
  transactionType: 'credit' | 'debit';
  amount: number;
  balanceAfter: number | null;
  category: string | null;
  payeeName: string | null;
  status: BankTransactionStatus | null;
  matchStatus: BankTransactionMatchStatus | null;
  createdAt: string;
  updatedAt: string;
}

export interface GeneralLedgerEntry {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: string;
  journalEntryId: string | null;
  entryNumber: string | null;
  transactionDate: string | null;
  postingDate: string | null;
  period: string | null;
  debitAmount: number;
  creditAmount: number;
  runningBalance: number;
  description: string | null;
  reference: string | null;
  entryDescription: string | null;
  documentType: string | null;
  documentNumber: string | null;
  vendorName: string | null;
  customerName: string | null;
  isReconciled: boolean;
  createdAt: string | null;
}

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent[];
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WebhookCreateResponse = Webhook & { secret: string };

export type WebhookEvent =
  | '*'
  | 'invoice.created'
  | 'invoice.updated'
  | 'invoice.deleted'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'vendor.created'
  | 'vendor.updated'
  | 'vendor.deleted'
  | 'bill.created'
  | 'bill.updated'
  | 'bill.deleted'
  | 'journal_entry.created'
  | 'journal_entry.updated'
  | 'item.created'
  | 'item.updated'
  | 'item.deleted';

export interface WebhookPayload {
  id: string;
  event: WebhookEvent;
  createdAt: string;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Report types
// ---------------------------------------------------------------------------

export interface PeriodReportParams {
  /** Accounting period in YYYY-MM format. */
  period: string;
}

export interface TrialBalanceParams extends PeriodReportParams {
  balanceType?: 'preliminary' | 'adjusted' | 'final';
}

export interface StatementGroup {
  label: string;
  total: number;
  accounts: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    balance: number;
  }>;
}

export interface TrialBalance {
  period: string;
  asOfDate: string;
  balanceType: 'preliminary' | 'adjusted' | 'final' | string;
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  difference: number;
  accountCount: number;
  lineItems: Array<{
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    normalBalance: string;
    openingBalance: number;
    periodDebit: number;
    periodCredit: number;
    closingBalance: number;
    debitBalance: number;
    creditBalance: number;
    transactionCount: number;
  }>;
}

export interface BalanceSheet {
  period: string;
  currentAssets: StatementGroup;
  nonCurrentAssets: StatementGroup;
  totalAssets: number;
  currentLiabilities: StatementGroup;
  nonCurrentLiabilities: StatementGroup;
  totalLiabilities: number;
  equity: StatementGroup;
  retainedEarnings: number;
  totalEquity: number;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
  difference: number;
  totalAccounts: number;
}

export interface ProfitLoss {
  period: string;
  revenue: StatementGroup;
  costOfSales: StatementGroup;
  grossProfit: number;
  operatingExpenses: StatementGroup;
  otherIncome: StatementGroup;
  otherExpenses: StatementGroup;
  taxExpenses: StatementGroup;
  operatingProfit: number;
  netIncome: number;
  totalAccounts: number;
}
