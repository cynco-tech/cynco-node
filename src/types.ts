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
  limit?: number;
  offset?: number;
  cursor?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface InvoiceListParams extends ListParams {
  status?: InvoiceStatus;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
}

export interface CustomerListParams extends ListParams {
  search?: string;
  type?: 'individual' | 'company';
  isActive?: boolean;
}

export interface VendorListParams extends ListParams {
  search?: string;
  isActive?: boolean;
}

export interface BillListParams extends ListParams {
  status?: BillStatus;
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
  search?: string;
}

export interface ItemListParams extends ListParams {
  search?: string;
  type?: 'product' | 'service';
  isActive?: boolean;
}

export interface AccountListParams extends ListParams {
  search?: string;
  type?: AccountType;
  isActive?: boolean;
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

export interface InvoiceCreateInput {
  customerId: string;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItemInput[];
  currency?: string;
  notes?: string;
  reference?: string;
  taxInclusive?: boolean;
}

export interface InvoiceUpdateInput {
  customerId?: string;
  issueDate?: string;
  dueDate?: string;
  lineItems?: InvoiceLineItemInput[];
  currency?: string;
  notes?: string;
  reference?: string;
  taxInclusive?: boolean;
}

export interface InvoiceLineItemInput {
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  accountId?: string;
}

export interface CustomerCreateInput {
  name: string;
  email?: string;
  phone?: string;
  type?: 'individual' | 'company';
  taxNumber?: string;
  currency?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  notes?: string;
}

export interface CustomerUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  type?: 'individual' | 'company';
  taxNumber?: string;
  currency?: string;
  billingAddress?: Address;
  shippingAddress?: Address;
  notes?: string;
}

export interface VendorCreateInput {
  name: string;
  email?: string;
  phone?: string;
  taxNumber?: string;
  currency?: string;
  address?: Address;
  bankDetails?: BankDetails;
  notes?: string;
}

export interface VendorUpdateInput {
  name?: string;
  email?: string;
  phone?: string;
  taxNumber?: string;
  currency?: string;
  address?: Address;
  bankDetails?: BankDetails;
  notes?: string;
}

export interface BillCreateInput {
  vendorId: string;
  issueDate: string;
  dueDate: string;
  lineItems: BillLineItemInput[];
  currency?: string;
  notes?: string;
  reference?: string;
  taxInclusive?: boolean;
}

export interface BillUpdateInput {
  vendorId?: string;
  issueDate?: string;
  dueDate?: string;
  lineItems?: BillLineItemInput[];
  currency?: string;
  notes?: string;
  reference?: string;
  taxInclusive?: boolean;
}

export interface BillLineItemInput {
  itemId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  accountId?: string;
}

export interface ItemCreateInput {
  name: string;
  type: 'product' | 'service';
  description?: string;
  unitPrice?: number;
  cost?: number;
  taxRate?: number;
  sku?: string;
  unit?: string;
  incomeAccountId?: string;
  expenseAccountId?: string;
}

export interface ItemUpdateInput {
  name?: string;
  type?: 'product' | 'service';
  description?: string;
  unitPrice?: number;
  cost?: number;
  taxRate?: number;
  sku?: string;
  unit?: string;
  incomeAccountId?: string;
  expenseAccountId?: string;
}

export interface AccountCreateInput {
  name: string;
  code: string;
  type: AccountType;
  subType?: string;
  description?: string;
  currency?: string;
  taxRate?: number;
  isActive?: boolean;
}

export interface AccountUpdateInput {
  name?: string;
  code?: string;
  subType?: string;
  description?: string;
  currency?: string;
  taxRate?: number;
  isActive?: boolean;
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
// Resource types
// ---------------------------------------------------------------------------

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer?: Customer;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  amountDue: number;
  currency: string;
  notes: string | null;
  reference: string | null;
  taxInclusive: boolean;
  pdfUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  itemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
  accountId: string | null;
}

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'voided';

export interface Customer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  type: 'individual' | 'company';
  taxNumber: string | null;
  currency: string;
  billingAddress: Address | null;
  shippingAddress: Address | null;
  notes: string | null;
  isActive: boolean;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  taxNumber: string | null;
  currency: string;
  address: Address | null;
  bankDetails: BankDetails | null;
  notes: string | null;
  isActive: boolean;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  vendorId: string;
  vendor?: Vendor;
  status: BillStatus;
  issueDate: string;
  dueDate: string;
  lineItems: BillLineItem[];
  subtotal: number;
  taxTotal: number;
  total: number;
  amountDue: number;
  currency: string;
  notes: string | null;
  reference: string | null;
  taxInclusive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BillLineItem {
  id: string;
  itemId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  amount: number;
  accountId: string | null;
}

export type BillStatus =
  | 'draft'
  | 'received'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'voided';

export interface Item {
  id: string;
  name: string;
  type: 'product' | 'service';
  description: string | null;
  unitPrice: number | null;
  cost: number | null;
  taxRate: number | null;
  sku: string | null;
  unit: string | null;
  incomeAccountId: string | null;
  expenseAccountId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AccountType =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense';

export interface Account {
  id: string;
  name: string;
  code: string;
  type: AccountType;
  subType: string | null;
  description: string | null;
  currency: string;
  taxRate: number | null;
  isActive: boolean;
  balance: number;
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

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftCode?: string;
}
