interface WebhookVerifyOptions {
    /** Override the tolerance window in seconds. Defaults to 300 (5 minutes). */
    tolerance?: number;
}
/**
 * Utilities for verifying Cynco webhook signatures.
 *
 * All methods are static — no instantiation required.
 *
 * ```ts
 * import Cynco from 'cynco';
 *
 * const isValid = Cynco.webhooks.verify(
 *   rawBody,
 *   signature,
 *   timestamp,
 *   webhookSecret,
 * );
 * ```
 */
declare const webhookVerifier: {
    /**
     * Verify a webhook signature.
     *
     * @param payload   - The raw request body as a string.
     * @param signature - The value of the `X-Webhook-Signature` header.
     * @param timestamp - The value of the `X-Webhook-Timestamp` header.
     * @param secret    - Your webhook signing secret.
     * @param options   - Optional configuration.
     * @returns `true` if the signature is valid and the timestamp is within tolerance.
     */
    verify(payload: string, signature: string, timestamp: string, secret: string, options?: WebhookVerifyOptions): boolean;
    /**
     * Verify a webhook signature, throwing an error if invalid.
     *
     * @throws {Error} If the signature is invalid or the timestamp is stale.
     */
    verifyOrThrow(payload: string, signature: string, timestamp: string, secret: string, options?: WebhookVerifyOptions): void;
    /**
     * Generate a signature for testing purposes.
     *
     * @param payload   - The request body.
     * @param secret    - The webhook secret.
     * @param timestamp - Unix timestamp in seconds (defaults to now).
     * @returns An object with the signature and timestamp strings.
     */
    sign(payload: string, secret: string, timestamp?: number): {
        signature: string;
        timestamp: string;
    };
};

interface CyncoClientOptions {
    /** Base URL for the Cynco API. Defaults to https://app.cynco.io/api/v1 */
    baseUrl?: string;
    /** Request timeout in milliseconds. Defaults to 30000 (30s). */
    timeout?: number;
    /** Maximum number of automatic retries on transient failures. Defaults to 3. */
    maxRetries?: number;
    /** Custom fetch implementation. Defaults to the global fetch. */
    fetch?: typeof globalThis.fetch;
}
interface RequestOptions {
    /** Idempotency key for safe retries on mutating requests. */
    idempotencyKey?: string;
    /** AbortSignal for request cancellation. */
    signal?: AbortSignal;
    /** Additional headers to merge into the request. */
    headers?: Record<string, string>;
}
interface CyncoResponse<T> {
    success: true;
    data: T;
    meta?: ResponseMeta;
}
interface PaginatedResponse<T> {
    success: true;
    data: T[];
    pagination: OffsetPagination;
    links?: PaginationLinks;
    meta?: ResponseMeta;
}
interface CursorPaginatedResponse<T> {
    success: true;
    data: T[];
    pagination: CursorPagination;
    links?: PaginationLinks;
    meta?: ResponseMeta;
}
interface OffsetPagination {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
}
interface CursorPagination {
    limit: number;
    hasMore: boolean;
    nextCursor: string | null;
}
interface PaginationLinks {
    self?: string;
    next?: string;
    prev?: string;
    first?: string;
    last?: string;
}
interface ResponseMeta {
    requestId?: string;
    rateLimit?: RateLimitInfo;
    apiVersion?: string;
}
interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
}
interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: ValidationDetail[];
    };
    meta?: ResponseMeta;
}
interface ValidationDetail {
    field: string;
    message: string;
}
interface ListParams {
    limit?: number;
    offset?: number;
    cursor?: string;
    sort?: string;
    order?: 'asc' | 'desc';
}
interface InvoiceListParams extends ListParams {
    status?: InvoiceStatus;
    customerId?: string;
    dateFrom?: string;
    dateTo?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    search?: string;
}
interface CustomerListParams extends ListParams {
    search?: string;
    type?: 'individual' | 'company';
    isActive?: boolean;
}
interface VendorListParams extends ListParams {
    search?: string;
    isActive?: boolean;
}
interface BillListParams extends ListParams {
    status?: BillStatus;
    vendorId?: string;
    dateFrom?: string;
    dateTo?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    search?: string;
}
interface ItemListParams extends ListParams {
    search?: string;
    type?: 'product' | 'service';
    isActive?: boolean;
}
interface AccountListParams extends ListParams {
    search?: string;
    type?: AccountType;
    isActive?: boolean;
}
interface JournalEntryListParams extends ListParams {
    dateFrom?: string;
    dateTo?: string;
    status?: 'draft' | 'posted' | 'voided';
    search?: string;
}
interface BankAccountListParams extends ListParams {
    search?: string;
    isActive?: boolean;
}
interface BankTransactionListParams extends ListParams {
    bankAccountId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: 'pending' | 'cleared' | 'reconciled';
    type?: 'credit' | 'debit';
    search?: string;
}
interface WebhookListParams extends ListParams {
    isActive?: boolean;
}
interface InvoiceCreateInput {
    customerId: string;
    issueDate: string;
    dueDate: string;
    lineItems: InvoiceLineItemInput[];
    currency?: string;
    notes?: string;
    reference?: string;
    taxInclusive?: boolean;
}
interface InvoiceUpdateInput {
    customerId?: string;
    issueDate?: string;
    dueDate?: string;
    lineItems?: InvoiceLineItemInput[];
    currency?: string;
    notes?: string;
    reference?: string;
    taxInclusive?: boolean;
}
interface InvoiceLineItemInput {
    itemId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    accountId?: string;
}
interface CustomerCreateInput {
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
interface CustomerUpdateInput {
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
interface VendorCreateInput {
    name: string;
    email?: string;
    phone?: string;
    taxNumber?: string;
    currency?: string;
    address?: Address;
    bankDetails?: BankDetails;
    notes?: string;
}
interface VendorUpdateInput {
    name?: string;
    email?: string;
    phone?: string;
    taxNumber?: string;
    currency?: string;
    address?: Address;
    bankDetails?: BankDetails;
    notes?: string;
}
interface BillCreateInput {
    vendorId: string;
    issueDate: string;
    dueDate: string;
    lineItems: BillLineItemInput[];
    currency?: string;
    notes?: string;
    reference?: string;
    taxInclusive?: boolean;
}
interface BillUpdateInput {
    vendorId?: string;
    issueDate?: string;
    dueDate?: string;
    lineItems?: BillLineItemInput[];
    currency?: string;
    notes?: string;
    reference?: string;
    taxInclusive?: boolean;
}
interface BillLineItemInput {
    itemId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate?: number;
    accountId?: string;
}
interface ItemCreateInput {
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
interface ItemUpdateInput {
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
interface AccountCreateInput {
    name: string;
    code: string;
    type: AccountType;
    subType?: string;
    description?: string;
    currency?: string;
    taxRate?: number;
    isActive?: boolean;
}
interface AccountUpdateInput {
    name?: string;
    code?: string;
    subType?: string;
    description?: string;
    currency?: string;
    taxRate?: number;
    isActive?: boolean;
}
interface JournalEntryCreateInput {
    date: string;
    reference?: string;
    description?: string;
    lines: JournalEntryLineInput[];
}
interface JournalEntryUpdateInput {
    date?: string;
    reference?: string;
    description?: string;
    lines?: JournalEntryLineInput[];
}
interface JournalEntryLineInput {
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
}
interface BankAccountCreateInput {
    name: string;
    accountNumber: string;
    bankName: string;
    currency?: string;
    accountId?: string;
    routingNumber?: string;
    swiftCode?: string;
}
interface BankAccountUpdateInput {
    name?: string;
    bankName?: string;
    currency?: string;
    accountId?: string;
    routingNumber?: string;
    swiftCode?: string;
}
interface WebhookCreateInput {
    url: string;
    events: WebhookEvent[];
    secret?: string;
    description?: string;
}
interface WebhookUpdateInput {
    url?: string;
    events?: WebhookEvent[];
    secret?: string;
    description?: string;
    isActive?: boolean;
}
interface Invoice {
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
interface InvoiceLineItem {
    id: string;
    itemId: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    amount: number;
    accountId: string | null;
}
type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'voided';
interface Customer {
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
interface Vendor {
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
interface Bill {
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
interface BillLineItem {
    id: string;
    itemId: string | null;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    amount: number;
    accountId: string | null;
}
type BillStatus = 'draft' | 'received' | 'partially_paid' | 'paid' | 'overdue' | 'voided';
interface Item {
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
type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
interface Account {
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
interface JournalEntry {
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
interface JournalEntryLine {
    id: string;
    accountId: string;
    account?: Account;
    debit: number;
    credit: number;
    description: string | null;
}
interface BankAccount {
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
interface BankTransaction {
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
interface Webhook {
    id: string;
    url: string;
    events: WebhookEvent[];
    secret: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
type WebhookEvent = 'invoice.created' | 'invoice.updated' | 'invoice.sent' | 'invoice.paid' | 'invoice.voided' | 'invoice.overdue' | 'customer.created' | 'customer.updated' | 'customer.deleted' | 'vendor.created' | 'vendor.updated' | 'vendor.deleted' | 'bill.created' | 'bill.updated' | 'bill.paid' | 'bill.voided' | 'payment.received' | 'payment.sent' | 'bank_transaction.created' | 'bank_transaction.reconciled';
interface WebhookPayload {
    id: string;
    event: WebhookEvent;
    createdAt: string;
    data: Record<string, unknown>;
}
interface ReportParams {
    startDate: string;
    endDate: string;
    currency?: string;
    comparePrevious?: boolean;
}
interface BalanceSheetReport {
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
interface ProfitAndLossReport {
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
interface TrialBalanceReport {
    reportType: 'trial_balance';
    asOf: string;
    currency: string;
    accounts: TrialBalanceRow[];
    totalDebits: number;
    totalCredits: number;
}
interface TrialBalanceRow {
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: AccountType;
    debit: number;
    credit: number;
}
interface ReportSection {
    label: string;
    rows: ReportRow[];
    total: number;
}
interface ReportRow {
    accountId: string;
    accountCode: string;
    accountName: string;
    amount: number;
    previousAmount?: number;
}
interface Address {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
}
interface BankDetails {
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    swiftCode?: string;
}

/**
 * Low-level HTTP client that handles authentication, retries, rate limiting,
 * and error mapping. Each Cynco instance has exactly one CyncoClient.
 */
declare class CyncoClient {
    private readonly _apiKey;
    readonly baseUrl: string;
    private readonly _timeout;
    private readonly _maxRetries;
    private readonly _fetch;
    constructor(apiKey: string, options?: CyncoClientOptions);
    get<T>(path: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<CyncoResponse<T>>;
    getList<T>(path: string, params?: Record<string, unknown>, options?: RequestOptions): Promise<PaginatedResponse<T>>;
    post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<CyncoResponse<T>>;
    patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<CyncoResponse<T>>;
    put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<CyncoResponse<T>>;
    delete<T = void>(path: string, options?: RequestOptions): Promise<CyncoResponse<T>>;
    private _buildUrl;
    private _request;
    private _shouldRetry;
    private _shouldRetryOnNetworkError;
    /**
     * Calculate retry delay with exponential backoff and jitter.
     * For 429 responses, uses Retry-After header if present.
     */
    private _getRetryDelay;
    private _parseRateLimitHeaders;
    private _safeParseJson;
    private _buildError;
}

/**
 * A paginated list that doubles as an async iterator for auto-pagination.
 *
 * Standard usage (single page):
 * ```ts
 * const page = await cynco.invoices.list({ limit: 20 });
 * console.log(page.data);           // Invoice[]
 * console.log(page.pagination);     // { total, limit, offset, hasMore }
 * ```
 *
 * Auto-pagination (all pages):
 * ```ts
 * for await (const invoice of cynco.invoices.list({ limit: 50 })) {
 *   console.log(invoice.id);
 * }
 * ```
 */
declare class Page<T> implements AsyncIterable<T> {
    readonly data: T[];
    readonly pagination: PaginatedResponse<T>['pagination'];
    readonly links?: PaginatedResponse<T>['links'];
    readonly meta?: PaginatedResponse<T>['meta'];
    private readonly _fetchPage;
    private readonly _params;
    constructor(response: PaginatedResponse<T>, fetchPage: (params: ListParams) => Promise<PaginatedResponse<T>>, params: ListParams);
    /** Whether there are more pages after this one. */
    get hasMore(): boolean;
    /** Fetch the next page. Returns null if there are no more pages. */
    nextPage(): Promise<Page<T> | null>;
    /** Iterate over all items across all pages. */
    [Symbol.asyncIterator](): AsyncIterator<T>;
}
/**
 * A cursor-based paginated list with async iteration support.
 */
declare class CursorPage<T> implements AsyncIterable<T> {
    readonly data: T[];
    readonly pagination: CursorPaginatedResponse<T>['pagination'];
    readonly links?: CursorPaginatedResponse<T>['links'];
    readonly meta?: CursorPaginatedResponse<T>['meta'];
    private readonly _fetchPage;
    private readonly _params;
    constructor(response: CursorPaginatedResponse<T>, fetchPage: (params: ListParams) => Promise<CursorPaginatedResponse<T>>, params: ListParams);
    get hasMore(): boolean;
    nextPage(): Promise<CursorPage<T> | null>;
    [Symbol.asyncIterator](): AsyncIterator<T>;
}

declare class Invoices {
    private readonly _client;
    constructor(_client: CyncoClient);
    /**
     * List invoices with pagination.
     *
     * Returns a `Page` that can be used as an async iterator for auto-pagination:
     * ```ts
     * for await (const invoice of cynco.invoices.list({ limit: 50 })) {
     *   console.log(invoice.id);
     * }
     * ```
     */
    list(params?: InvoiceListParams): Promise<Page<Invoice>>;
    /** Retrieve a single invoice by ID. */
    retrieve(id: string): Promise<Invoice>;
    /** Create a new invoice. */
    create(data: InvoiceCreateInput, options?: RequestOptions): Promise<Invoice>;
    /** Update an existing invoice. */
    update(id: string, data: InvoiceUpdateInput, options?: RequestOptions): Promise<Invoice>;
    /** Delete an invoice. Only draft invoices can be deleted. */
    delete(id: string, options?: RequestOptions): Promise<void>;
    /** Send an invoice to the customer via email. */
    send(id: string, options?: RequestOptions): Promise<Invoice>;
    /** Mark an invoice as paid. */
    markPaid(id: string, data?: {
        paidDate?: string;
        paymentMethod?: string;
    }, options?: RequestOptions): Promise<Invoice>;
    /** Void an invoice. */
    void(id: string, options?: RequestOptions): Promise<Invoice>;
    /** Get the PDF download URL for an invoice. */
    getPdf(id: string): Promise<{
        url: string;
    }>;
}

declare class Customers {
    private readonly _client;
    constructor(_client: CyncoClient);
    /**
     * List customers with pagination.
     *
     * ```ts
     * for await (const customer of cynco.customers.list({ limit: 50 })) {
     *   console.log(customer.name);
     * }
     * ```
     */
    list(params?: CustomerListParams): Promise<Page<Customer>>;
    /** Retrieve a single customer by ID. */
    retrieve(id: string): Promise<Customer>;
    /** Create a new customer. */
    create(data: CustomerCreateInput, options?: RequestOptions): Promise<Customer>;
    /** Update an existing customer. */
    update(id: string, data: CustomerUpdateInput, options?: RequestOptions): Promise<Customer>;
    /** Delete a customer. Only customers with no associated records can be deleted. */
    delete(id: string, options?: RequestOptions): Promise<void>;
}

declare class Vendors {
    private readonly _client;
    constructor(_client: CyncoClient);
    /**
     * List vendors with pagination.
     *
     * ```ts
     * for await (const vendor of cynco.vendors.list({ limit: 50 })) {
     *   console.log(vendor.name);
     * }
     * ```
     */
    list(params?: VendorListParams): Promise<Page<Vendor>>;
    /** Retrieve a single vendor by ID. */
    retrieve(id: string): Promise<Vendor>;
    /** Create a new vendor. */
    create(data: VendorCreateInput, options?: RequestOptions): Promise<Vendor>;
    /** Update an existing vendor. */
    update(id: string, data: VendorUpdateInput, options?: RequestOptions): Promise<Vendor>;
    /** Delete a vendor. Only vendors with no associated records can be deleted. */
    delete(id: string, options?: RequestOptions): Promise<void>;
}

declare class Bills {
    private readonly _client;
    constructor(_client: CyncoClient);
    /**
     * List bills with pagination.
     *
     * ```ts
     * for await (const bill of cynco.bills.list({ limit: 50 })) {
     *   console.log(bill.billNumber);
     * }
     * ```
     */
    list(params?: BillListParams): Promise<Page<Bill>>;
    /** Retrieve a single bill by ID. */
    retrieve(id: string): Promise<Bill>;
    /** Create a new bill. */
    create(data: BillCreateInput, options?: RequestOptions): Promise<Bill>;
    /** Update an existing bill. */
    update(id: string, data: BillUpdateInput, options?: RequestOptions): Promise<Bill>;
    /** Delete a bill. Only draft bills can be deleted. */
    delete(id: string, options?: RequestOptions): Promise<void>;
    /** Mark a bill as paid. */
    markPaid(id: string, data?: {
        paidDate?: string;
        paymentMethod?: string;
    }, options?: RequestOptions): Promise<Bill>;
    /** Void a bill. */
    void(id: string, options?: RequestOptions): Promise<Bill>;
}

declare class Items {
    private readonly _client;
    constructor(_client: CyncoClient);
    /**
     * List items (products and services) with pagination.
     *
     * ```ts
     * for await (const item of cynco.items.list({ type: 'service' })) {
     *   console.log(item.name);
     * }
     * ```
     */
    list(params?: ItemListParams): Promise<Page<Item>>;
    /** Retrieve a single item by ID. */
    retrieve(id: string): Promise<Item>;
    /** Create a new item. */
    create(data: ItemCreateInput, options?: RequestOptions): Promise<Item>;
    /** Update an existing item. */
    update(id: string, data: ItemUpdateInput, options?: RequestOptions): Promise<Item>;
    /** Delete an item. Items referenced by invoices or bills cannot be deleted. */
    delete(id: string, options?: RequestOptions): Promise<void>;
}

declare class Accounts {
    private readonly _client;
    constructor(_client: CyncoClient);
    /**
     * List chart of accounts with pagination.
     *
     * ```ts
     * for await (const account of cynco.accounts.list({ type: 'revenue' })) {
     *   console.log(`${account.code} — ${account.name}`);
     * }
     * ```
     */
    list(params?: AccountListParams): Promise<Page<Account>>;
    /** Retrieve a single account by ID. */
    retrieve(id: string): Promise<Account>;
    /** Create a new account. */
    create(data: AccountCreateInput, options?: RequestOptions): Promise<Account>;
    /** Update an existing account. */
    update(id: string, data: AccountUpdateInput, options?: RequestOptions): Promise<Account>;
    /** Delete an account. Only unused accounts can be deleted. */
    delete(id: string, options?: RequestOptions): Promise<void>;
}

declare class JournalEntries {
    private readonly _client;
    constructor(_client: CyncoClient);
    /**
     * List journal entries with pagination.
     *
     * ```ts
     * for await (const entry of cynco.journalEntries.list({ status: 'posted' })) {
     *   console.log(entry.entryNumber);
     * }
     * ```
     */
    list(params?: JournalEntryListParams): Promise<Page<JournalEntry>>;
    /** Retrieve a single journal entry by ID. */
    retrieve(id: string): Promise<JournalEntry>;
    /** Create a new journal entry. */
    create(data: JournalEntryCreateInput, options?: RequestOptions): Promise<JournalEntry>;
    /** Update a draft journal entry. */
    update(id: string, data: JournalEntryUpdateInput, options?: RequestOptions): Promise<JournalEntry>;
    /** Delete a draft journal entry. */
    delete(id: string, options?: RequestOptions): Promise<void>;
    /** Post a draft journal entry to the ledger. */
    post(id: string, options?: RequestOptions): Promise<JournalEntry>;
    /** Void a posted journal entry. */
    void(id: string, options?: RequestOptions): Promise<JournalEntry>;
}

declare class BankAccounts {
    private readonly _client;
    constructor(_client: CyncoClient);
    /**
     * List bank accounts with pagination.
     *
     * ```ts
     * for await (const account of cynco.bankAccounts.list()) {
     *   console.log(`${account.bankName} — ${account.name}`);
     * }
     * ```
     */
    list(params?: BankAccountListParams): Promise<Page<BankAccount>>;
    /** Retrieve a single bank account by ID. */
    retrieve(id: string): Promise<BankAccount>;
    /** Create a new bank account. */
    create(data: BankAccountCreateInput, options?: RequestOptions): Promise<BankAccount>;
    /** Update an existing bank account. */
    update(id: string, data: BankAccountUpdateInput, options?: RequestOptions): Promise<BankAccount>;
    /** Delete a bank account. */
    delete(id: string, options?: RequestOptions): Promise<void>;
    /**
     * List transactions for a specific bank account.
     *
     * ```ts
     * for await (const txn of cynco.bankAccounts.listTransactions('ba_123', { status: 'cleared' })) {
     *   console.log(`${txn.date} ${txn.description} ${txn.amount}`);
     * }
     * ```
     */
    listTransactions(bankAccountId: string, params?: BankTransactionListParams): Promise<Page<BankTransaction>>;
}

declare class Reports {
    private readonly _client;
    constructor(_client: CyncoClient);
    /** Generate a balance sheet report. */
    balanceSheet(params: Pick<ReportParams, 'endDate' | 'currency' | 'comparePrevious'>): Promise<BalanceSheetReport>;
    /** Generate a profit and loss (income statement) report. */
    profitAndLoss(params: ReportParams): Promise<ProfitAndLossReport>;
    /** Generate a trial balance report. */
    trialBalance(params: Pick<ReportParams, 'endDate' | 'currency'>): Promise<TrialBalanceReport>;
}

declare class Webhooks {
    private readonly _client;
    constructor(_client: CyncoClient);
    /**
     * List webhook endpoints with pagination.
     *
     * ```ts
     * for await (const webhook of cynco.webhooks.list()) {
     *   console.log(`${webhook.url} — ${webhook.events.join(', ')}`);
     * }
     * ```
     */
    list(params?: WebhookListParams): Promise<Page<Webhook>>;
    /** Retrieve a single webhook endpoint by ID. */
    retrieve(id: string): Promise<Webhook>;
    /** Create a new webhook endpoint. */
    create(data: WebhookCreateInput, options?: RequestOptions): Promise<Webhook>;
    /** Update an existing webhook endpoint. */
    update(id: string, data: WebhookUpdateInput, options?: RequestOptions): Promise<Webhook>;
    /** Delete a webhook endpoint. */
    delete(id: string, options?: RequestOptions): Promise<void>;
    /** Rotate the signing secret for a webhook endpoint. Returns the new secret. */
    rotateSecret(id: string): Promise<{
        secret: string;
    }>;
}

/**
 * Base error class for all Cynco API errors.
 *
 * Contains the HTTP status code, machine-readable error code, and optional
 * field-level validation details.
 */
declare class CyncoError extends Error {
    /** Machine-readable error code from the API (e.g. "validation_error"). */
    readonly code: string;
    /** HTTP status code returned by the API. */
    readonly status: number;
    /** Unique request identifier for support troubleshooting. */
    readonly requestId: string;
    /** Field-level validation details, present on 422 responses. */
    readonly details?: ValidationDetail[];
    /** Raw response metadata from the API. */
    readonly meta?: ResponseMeta;
    constructor(message: string, options: {
        code: string;
        status: number;
        requestId: string;
        details?: ValidationDetail[];
        meta?: ResponseMeta;
    });
}
/**
 * 401 Unauthorized — the API key is missing, invalid, or revoked.
 */
declare class AuthenticationError extends CyncoError {
    constructor(message: string, options: {
        code: string;
        status: number;
        requestId: string;
        meta?: ResponseMeta;
    });
}
/**
 * 403 Forbidden — the API key lacks permission for this operation.
 */
declare class PermissionError extends CyncoError {
    constructor(message: string, options: {
        code: string;
        status: number;
        requestId: string;
        meta?: ResponseMeta;
    });
}
/**
 * 404 Not Found — the requested resource does not exist.
 */
declare class NotFoundError extends CyncoError {
    constructor(message: string, options: {
        code: string;
        status: number;
        requestId: string;
        meta?: ResponseMeta;
    });
}
/**
 * 409 Conflict — the request conflicts with current server state
 * (e.g. duplicate idempotency key with different parameters).
 */
declare class ConflictError extends CyncoError {
    constructor(message: string, options: {
        code: string;
        status: number;
        requestId: string;
        meta?: ResponseMeta;
    });
}
/**
 * 422 Unprocessable Entity — request body failed validation.
 */
declare class ValidationError extends CyncoError {
    constructor(message: string, options: {
        code: string;
        status: number;
        requestId: string;
        details?: ValidationDetail[];
        meta?: ResponseMeta;
    });
}
/**
 * 429 Too Many Requests — you have exceeded the rate limit.
 *
 * The SDK automatically retries rate-limited requests with exponential backoff.
 * This error is thrown only after all retries are exhausted.
 */
declare class RateLimitError extends CyncoError {
    /** Unix timestamp (seconds) when the rate limit resets. */
    readonly retryAfter: number;
    constructor(message: string, options: {
        code: string;
        status: number;
        requestId: string;
        retryAfter: number;
        meta?: ResponseMeta;
    });
}
/**
 * 500+ Internal Server Error — something went wrong on the Cynco side.
 *
 * The SDK automatically retries server errors with exponential backoff.
 * This error is thrown only after all retries are exhausted.
 */
declare class InternalError extends CyncoError {
    constructor(message: string, options: {
        code: string;
        status: number;
        requestId: string;
        meta?: ResponseMeta;
    });
}
/**
 * Thrown when a request times out before completing.
 */
declare class TimeoutError extends CyncoError {
    constructor(requestId: string, timeoutMs: number);
}
/**
 * Thrown when the network is unreachable or the connection was refused.
 */
declare class ConnectionError extends CyncoError {
    constructor(requestId: string, cause: Error);
}

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
declare class Cynco {
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
    static readonly webhooks: {
        verify(payload: string, signature: string, timestamp: string, secret: string, options?: WebhookVerifyOptions): boolean;
        verifyOrThrow(payload: string, signature: string, timestamp: string, secret: string, options?: WebhookVerifyOptions): void;
        sign(payload: string, secret: string, timestamp?: number): {
            signature: string;
            timestamp: string;
        };
    };
    private readonly _client;
    /**
     * Create a new Cynco client instance.
     *
     * @param apiKey  - Your Cynco API key (starts with `cak_`).
     * @param options - Optional client configuration.
     */
    constructor(apiKey: string, options?: CyncoClientOptions);
}

export { type Account, type AccountCreateInput, type AccountListParams, type AccountType, type AccountUpdateInput, Accounts, type Address, AuthenticationError, type BalanceSheetReport, type BankAccount, type BankAccountCreateInput, type BankAccountListParams, type BankAccountUpdateInput, BankAccounts, type BankDetails, type BankTransaction, type BankTransactionListParams, type Bill, type BillCreateInput, type BillLineItem, type BillLineItemInput, type BillListParams, type BillStatus, type BillUpdateInput, Bills, ConflictError, ConnectionError, CursorPage, type CursorPaginatedResponse, type CursorPagination, type Customer, type CustomerCreateInput, type CustomerListParams, type CustomerUpdateInput, Customers, Cynco, CyncoClient, type CyncoClientOptions, CyncoError, type CyncoResponse, type ErrorResponse, InternalError, type Invoice, type InvoiceCreateInput, type InvoiceLineItem, type InvoiceLineItemInput, type InvoiceListParams, type InvoiceStatus, type InvoiceUpdateInput, Invoices, type Item, type ItemCreateInput, type ItemListParams, type ItemUpdateInput, Items, JournalEntries, type JournalEntry, type JournalEntryCreateInput, type JournalEntryLine, type JournalEntryLineInput, type JournalEntryListParams, type JournalEntryUpdateInput, type ListParams, NotFoundError, type OffsetPagination, Page, type PaginatedResponse, type PaginationLinks, PermissionError, type ProfitAndLossReport, RateLimitError, type RateLimitInfo, type ReportParams, type ReportRow, type ReportSection, Reports, type RequestOptions, type ResponseMeta, TimeoutError, type TrialBalanceReport, type TrialBalanceRow, type ValidationDetail, ValidationError, type Vendor, type VendorCreateInput, type VendorListParams, type VendorUpdateInput, Vendors, type Webhook, type WebhookCreateInput, type WebhookEvent, type WebhookListParams, type WebhookPayload, type WebhookUpdateInput, Webhooks, Cynco as default, webhookVerifier };
