'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var crypto = require('crypto');

// src/client.ts

// src/errors.ts
var CyncoError = class extends Error {
  /** Machine-readable error code from the API (e.g. "validation_error"). */
  code;
  /** HTTP status code returned by the API. */
  status;
  /** Unique request identifier for support troubleshooting. */
  requestId;
  /** Field-level validation details, present on 422 responses. */
  details;
  /** Raw response metadata from the API. */
  meta;
  constructor(message, options) {
    super(message);
    this.name = "CyncoError";
    this.code = options.code;
    this.status = options.status;
    this.requestId = options.requestId;
    this.details = options.details;
    this.meta = options.meta;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
};
var AuthenticationError = class extends CyncoError {
  constructor(message, options) {
    super(message, options);
    this.name = "AuthenticationError";
  }
};
var PermissionError = class extends CyncoError {
  constructor(message, options) {
    super(message, options);
    this.name = "PermissionError";
  }
};
var NotFoundError = class extends CyncoError {
  constructor(message, options) {
    super(message, options);
    this.name = "NotFoundError";
  }
};
var ConflictError = class extends CyncoError {
  constructor(message, options) {
    super(message, options);
    this.name = "ConflictError";
  }
};
var ValidationError = class extends CyncoError {
  constructor(message, options) {
    super(message, options);
    this.name = "ValidationError";
  }
};
var RateLimitError = class extends CyncoError {
  /** Unix timestamp (seconds) when the rate limit resets. */
  retryAfter;
  constructor(message, options) {
    super(message, options);
    this.name = "RateLimitError";
    this.retryAfter = options.retryAfter;
  }
};
var InternalError = class extends CyncoError {
  constructor(message, options) {
    super(message, options);
    this.name = "InternalError";
  }
};
var TimeoutError = class extends CyncoError {
  constructor(requestId, timeoutMs) {
    super(`Request timed out after ${timeoutMs}ms`, {
      code: "timeout",
      status: 0,
      requestId
    });
    this.name = "TimeoutError";
  }
};
var ConnectionError = class extends CyncoError {
  constructor(requestId, cause) {
    super(`Connection failed: ${cause.message}`, {
      code: "connection_error",
      status: 0,
      requestId
    });
    this.name = "ConnectionError";
    this.cause = cause;
  }
};

// src/client.ts
var DEFAULT_BASE_URL = "https://app.cynco.io/api/v1";
var DEFAULT_TIMEOUT = 3e4;
var DEFAULT_MAX_RETRIES = 3;
var SDK_VERSION = "0.1.0";
var USER_AGENT = `cynco-node/${SDK_VERSION}`;
var RETRYABLE_METHODS = /* @__PURE__ */ new Set(["GET", "HEAD", "OPTIONS", "DELETE"]);
var RETRYABLE_STATUS_CODES = /* @__PURE__ */ new Set([408, 429, 500, 502, 503, 504]);
var CyncoClient = class {
  _apiKey;
  baseUrl;
  _timeout;
  _maxRetries;
  _fetch;
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error(
        'An API key is required. Pass it as the first argument: new Cynco("cak_...")'
      );
    }
    if (!apiKey.startsWith("cak_")) {
      throw new Error(
        'Invalid API key format. Cynco API keys start with "cak_".'
      );
    }
    this._apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
    this._timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this._maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this._fetch = options.fetch ?? globalThis.fetch;
  }
  // ---------------------------------------------------------------------------
  // Public request methods
  // ---------------------------------------------------------------------------
  async get(path, params, options) {
    const url = this._buildUrl(path, params);
    return this._request("GET", url, void 0, options);
  }
  async getList(path, params, options) {
    const url = this._buildUrl(path, params);
    return this._request("GET", url, void 0, options);
  }
  async post(path, body, options) {
    const url = this._buildUrl(path);
    return this._request("POST", url, body, options);
  }
  async patch(path, body, options) {
    const url = this._buildUrl(path);
    return this._request("PATCH", url, body, options);
  }
  async put(path, body, options) {
    const url = this._buildUrl(path);
    return this._request("PUT", url, body, options);
  }
  async delete(path, options) {
    const url = this._buildUrl(path);
    return this._request("DELETE", url, void 0, options);
  }
  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------
  _buildUrl(path, params) {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== void 0 && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url.toString();
  }
  async _request(method, url, body, options, attempt = 0) {
    const requestId = crypto.randomUUID();
    const headers = {
      "Authorization": `Bearer ${this._apiKey}`,
      "User-Agent": USER_AGENT,
      "Accept": "application/json",
      "X-Request-ID": requestId,
      ...options?.headers
    };
    if (body !== void 0) {
      headers["Content-Type"] = "application/json";
    }
    if (options?.idempotencyKey) {
      headers["Idempotency-Key"] = options.idempotencyKey;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this._timeout);
    const signal = options?.signal ? anySignal([options.signal, controller.signal]) : controller.signal;
    try {
      const response = await this._fetch(url, {
        method,
        headers,
        body: body !== void 0 ? JSON.stringify(body) : void 0,
        signal
      });
      clearTimeout(timeoutId);
      const rateLimitInfo = this._parseRateLimitHeaders(response.headers);
      if (response.ok) {
        if (response.status === 204) {
          return { success: true, data: void 0 };
        }
        const json = await response.json();
        if (rateLimitInfo && typeof json === "object" && json !== null) {
          const withMeta = json;
          withMeta["meta"] = {
            ...withMeta["meta"],
            requestId,
            rateLimit: rateLimitInfo
          };
        }
        return json;
      }
      if (this._shouldRetry(method, response.status, attempt, options)) {
        const retryDelay = this._getRetryDelay(
          attempt,
          response.status,
          response.headers
        );
        await sleep(retryDelay);
        return this._request(method, url, body, options, attempt + 1);
      }
      const errorBody = await this._safeParseJson(response);
      throw this._buildError(response.status, errorBody, requestId, rateLimitInfo);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof CyncoError) {
        throw error;
      }
      if (error instanceof DOMException && error.name === "AbortError") {
        if (options?.signal?.aborted) {
          throw new CyncoError("Request was cancelled", {
            code: "cancelled",
            status: 0,
            requestId
          });
        }
        throw new TimeoutError(requestId, this._timeout);
      }
      if (this._shouldRetryOnNetworkError(method, attempt, options)) {
        const retryDelay = this._getRetryDelay(attempt, 0, void 0);
        await sleep(retryDelay);
        return this._request(method, url, body, options, attempt + 1);
      }
      throw new ConnectionError(
        requestId,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
  _shouldRetry(method, status, attempt, options) {
    if (attempt >= this._maxRetries) return false;
    if (!RETRYABLE_STATUS_CODES.has(status)) return false;
    if (!RETRYABLE_METHODS.has(method) && !options?.idempotencyKey) {
      return status === 429;
    }
    return true;
  }
  _shouldRetryOnNetworkError(method, attempt, options) {
    if (attempt >= this._maxRetries) return false;
    return RETRYABLE_METHODS.has(method) || !!options?.idempotencyKey;
  }
  /**
   * Calculate retry delay with exponential backoff and jitter.
   * For 429 responses, uses Retry-After header if present.
   */
  _getRetryDelay(attempt, status, headers) {
    if (status === 429 && headers) {
      const retryAfter = headers.get("Retry-After");
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!Number.isNaN(seconds)) {
          return seconds * 1e3;
        }
      }
    }
    const baseDelay = 500;
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * baseDelay;
    return Math.min(exponentialDelay + jitter, 3e4);
  }
  _parseRateLimitHeaders(headers) {
    const limit = headers.get("X-RateLimit-Limit");
    const remaining = headers.get("X-RateLimit-Remaining");
    const reset = headers.get("X-RateLimit-Reset");
    if (!limit || !remaining || !reset) return void 0;
    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10)
    };
  }
  async _safeParseJson(response) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  _buildError(status, body, requestId, rateLimitInfo) {
    const code = body?.error?.code ?? "unknown_error";
    const message = body?.error?.message ?? `Request failed with status ${status}`;
    const details = body?.error?.details;
    const meta = { ...body?.meta, requestId, rateLimit: rateLimitInfo };
    switch (status) {
      case 401:
        return new AuthenticationError(message, {
          code,
          status,
          requestId,
          meta
        });
      case 403:
        return new PermissionError(message, {
          code,
          status,
          requestId,
          meta
        });
      case 404:
        return new NotFoundError(message, {
          code,
          status,
          requestId,
          meta
        });
      case 409:
        return new ConflictError(message, {
          code,
          status,
          requestId,
          meta
        });
      case 422:
        return new ValidationError(message, {
          code,
          status,
          requestId,
          details,
          meta
        });
      case 429:
        return new RateLimitError(message, {
          code,
          status,
          requestId,
          retryAfter: rateLimitInfo?.reset ?? 0,
          meta
        });
      default:
        if (status >= 500) {
          return new InternalError(message, {
            code,
            status,
            requestId,
            meta
          });
        }
        return new CyncoError(message, {
          code,
          status,
          requestId,
          details,
          meta
        });
    }
  }
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function anySignal(signals) {
  const controller = new AbortController();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener(
      "abort",
      () => controller.abort(signal.reason),
      { once: true }
    );
  }
  return controller.signal;
}
var TIMESTAMP_TOLERANCE_SECONDS = 300;
var webhookVerifier = {
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
  verify(payload, signature, timestamp, secret, options) {
    const tolerance = options?.tolerance ?? TIMESTAMP_TOLERANCE_SECONDS;
    const ts = parseInt(timestamp, 10);
    if (Number.isNaN(ts)) {
      return false;
    }
    const now = Math.floor(Date.now() / 1e3);
    if (Math.abs(now - ts) > tolerance) {
      return false;
    }
    const signedContent = `${timestamp}.${payload}`;
    const expectedSignature = crypto.createHmac("sha256", secret).update(signedContent).digest("hex");
    const sigBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  },
  /**
   * Verify a webhook signature, throwing an error if invalid.
   *
   * @throws {Error} If the signature is invalid or the timestamp is stale.
   */
  verifyOrThrow(payload, signature, timestamp, secret, options) {
    const tolerance = options?.tolerance ?? TIMESTAMP_TOLERANCE_SECONDS;
    const ts = parseInt(timestamp, 10);
    if (Number.isNaN(ts)) {
      throw new Error("Invalid webhook timestamp");
    }
    const now = Math.floor(Date.now() / 1e3);
    if (Math.abs(now - ts) > tolerance) {
      throw new Error(
        `Webhook timestamp is too old (${Math.abs(now - ts)}s > ${tolerance}s tolerance)`
      );
    }
    const signedContent = `${timestamp}.${payload}`;
    const expectedSignature = crypto.createHmac("sha256", secret).update(signedContent).digest("hex");
    const sigBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      throw new Error("Invalid webhook signature");
    }
  },
  /**
   * Generate a signature for testing purposes.
   *
   * @param payload   - The request body.
   * @param secret    - The webhook secret.
   * @param timestamp - Unix timestamp in seconds (defaults to now).
   * @returns An object with the signature and timestamp strings.
   */
  sign(payload, secret, timestamp) {
    const ts = timestamp ?? Math.floor(Date.now() / 1e3);
    const signedContent = `${ts}.${payload}`;
    const signature = crypto.createHmac("sha256", secret).update(signedContent).digest("hex");
    return { signature, timestamp: String(ts) };
  }
};

// src/pagination.ts
var Page = class _Page {
  data;
  pagination;
  links;
  meta;
  _fetchPage;
  _params;
  constructor(response, fetchPage, params) {
    this.data = response.data;
    this.pagination = response.pagination;
    this.links = response.links;
    this.meta = response.meta;
    this._fetchPage = fetchPage;
    this._params = params;
  }
  /** Whether there are more pages after this one. */
  get hasMore() {
    return this.pagination.hasMore;
  }
  /** Fetch the next page. Returns null if there are no more pages. */
  async nextPage() {
    if (!this.hasMore) {
      return null;
    }
    const nextOffset = this.pagination.offset + this.pagination.limit;
    const nextParams = {
      ...this._params,
      offset: nextOffset
    };
    const response = await this._fetchPage(nextParams);
    return new _Page(response, this._fetchPage, nextParams);
  }
  /** Iterate over all items across all pages. */
  async *[Symbol.asyncIterator]() {
    let page = this;
    while (page) {
      for (const item of page.data) {
        yield item;
      }
      page = await page.nextPage();
    }
  }
};
var CursorPage = class _CursorPage {
  data;
  pagination;
  links;
  meta;
  _fetchPage;
  _params;
  constructor(response, fetchPage, params) {
    this.data = response.data;
    this.pagination = response.pagination;
    this.links = response.links;
    this.meta = response.meta;
    this._fetchPage = fetchPage;
    this._params = params;
  }
  get hasMore() {
    return this.pagination.hasMore;
  }
  async nextPage() {
    if (!this.hasMore || !this.pagination.nextCursor) {
      return null;
    }
    const nextParams = {
      ...this._params,
      cursor: this.pagination.nextCursor
    };
    const response = await this._fetchPage(nextParams);
    return new _CursorPage(response, this._fetchPage, nextParams);
  }
  async *[Symbol.asyncIterator]() {
    let page = this;
    while (page) {
      for (const item of page.data) {
        yield item;
      }
      page = await page.nextPage();
    }
  }
};

// src/resources/invoices.ts
var Invoices = class {
  constructor(_client) {
    this._client = _client;
  }
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
  async list(params) {
    const fetchPage = async (p) => {
      return this._client.getList("/invoices", p);
    };
    const response = await fetchPage(params ?? {});
    return new Page(response, fetchPage, params ?? {});
  }
  /** Retrieve a single invoice by ID. */
  async retrieve(id) {
    const response = await this._client.get(`/invoices/${id}`);
    return response.data;
  }
  /** Create a new invoice. */
  async create(data, options) {
    const response = await this._client.post(
      "/invoices",
      data,
      options
    );
    return response.data;
  }
  /** Update an existing invoice. */
  async update(id, data, options) {
    const response = await this._client.patch(
      `/invoices/${id}`,
      data,
      options
    );
    return response.data;
  }
  /** Delete an invoice. Only draft invoices can be deleted. */
  async delete(id, options) {
    await this._client.delete(`/invoices/${id}`, options);
  }
  /** Send an invoice to the customer via email. */
  async send(id, options) {
    const response = await this._client.post(
      `/invoices/${id}/send`,
      void 0,
      options
    );
    return response.data;
  }
  /** Mark an invoice as paid. */
  async markPaid(id, data, options) {
    const response = await this._client.post(
      `/invoices/${id}/mark-paid`,
      data,
      options
    );
    return response.data;
  }
  /** Void an invoice. */
  async void(id, options) {
    const response = await this._client.post(
      `/invoices/${id}/void`,
      void 0,
      options
    );
    return response.data;
  }
  /** Get the PDF download URL for an invoice. */
  async getPdf(id) {
    const response = await this._client.get(
      `/invoices/${id}/pdf`
    );
    return response.data;
  }
};

// src/resources/customers.ts
var Customers = class {
  constructor(_client) {
    this._client = _client;
  }
  /**
   * List customers with pagination.
   *
   * ```ts
   * for await (const customer of cynco.customers.list({ limit: 50 })) {
   *   console.log(customer.name);
   * }
   * ```
   */
  async list(params) {
    const fetchPage = async (p) => {
      return this._client.getList(
        "/customers",
        p
      );
    };
    const response = await fetchPage(params ?? {});
    return new Page(response, fetchPage, params ?? {});
  }
  /** Retrieve a single customer by ID. */
  async retrieve(id) {
    const response = await this._client.get(`/customers/${id}`);
    return response.data;
  }
  /** Create a new customer. */
  async create(data, options) {
    const response = await this._client.post(
      "/customers",
      data,
      options
    );
    return response.data;
  }
  /** Update an existing customer. */
  async update(id, data, options) {
    const response = await this._client.patch(
      `/customers/${id}`,
      data,
      options
    );
    return response.data;
  }
  /** Delete a customer. Only customers with no associated records can be deleted. */
  async delete(id, options) {
    await this._client.delete(`/customers/${id}`, options);
  }
};

// src/resources/vendors.ts
var Vendors = class {
  constructor(_client) {
    this._client = _client;
  }
  /**
   * List vendors with pagination.
   *
   * ```ts
   * for await (const vendor of cynco.vendors.list({ limit: 50 })) {
   *   console.log(vendor.name);
   * }
   * ```
   */
  async list(params) {
    const fetchPage = async (p) => {
      return this._client.getList(
        "/vendors",
        p
      );
    };
    const response = await fetchPage(params ?? {});
    return new Page(response, fetchPage, params ?? {});
  }
  /** Retrieve a single vendor by ID. */
  async retrieve(id) {
    const response = await this._client.get(`/vendors/${id}`);
    return response.data;
  }
  /** Create a new vendor. */
  async create(data, options) {
    const response = await this._client.post(
      "/vendors",
      data,
      options
    );
    return response.data;
  }
  /** Update an existing vendor. */
  async update(id, data, options) {
    const response = await this._client.patch(
      `/vendors/${id}`,
      data,
      options
    );
    return response.data;
  }
  /** Delete a vendor. Only vendors with no associated records can be deleted. */
  async delete(id, options) {
    await this._client.delete(`/vendors/${id}`, options);
  }
};

// src/resources/bills.ts
var Bills = class {
  constructor(_client) {
    this._client = _client;
  }
  /**
   * List bills with pagination.
   *
   * ```ts
   * for await (const bill of cynco.bills.list({ limit: 50 })) {
   *   console.log(bill.billNumber);
   * }
   * ```
   */
  async list(params) {
    const fetchPage = async (p) => {
      return this._client.getList(
        "/bills",
        p
      );
    };
    const response = await fetchPage(params ?? {});
    return new Page(response, fetchPage, params ?? {});
  }
  /** Retrieve a single bill by ID. */
  async retrieve(id) {
    const response = await this._client.get(`/bills/${id}`);
    return response.data;
  }
  /** Create a new bill. */
  async create(data, options) {
    const response = await this._client.post("/bills", data, options);
    return response.data;
  }
  /** Update an existing bill. */
  async update(id, data, options) {
    const response = await this._client.patch(
      `/bills/${id}`,
      data,
      options
    );
    return response.data;
  }
  /** Delete a bill. Only draft bills can be deleted. */
  async delete(id, options) {
    await this._client.delete(`/bills/${id}`, options);
  }
  /** Mark a bill as paid. */
  async markPaid(id, data, options) {
    const response = await this._client.post(
      `/bills/${id}/mark-paid`,
      data,
      options
    );
    return response.data;
  }
  /** Void a bill. */
  async void(id, options) {
    const response = await this._client.post(
      `/bills/${id}/void`,
      void 0,
      options
    );
    return response.data;
  }
};

// src/resources/items.ts
var Items = class {
  constructor(_client) {
    this._client = _client;
  }
  /**
   * List items (products and services) with pagination.
   *
   * ```ts
   * for await (const item of cynco.items.list({ type: 'service' })) {
   *   console.log(item.name);
   * }
   * ```
   */
  async list(params) {
    const fetchPage = async (p) => {
      return this._client.getList(
        "/items",
        p
      );
    };
    const response = await fetchPage(params ?? {});
    return new Page(response, fetchPage, params ?? {});
  }
  /** Retrieve a single item by ID. */
  async retrieve(id) {
    const response = await this._client.get(`/items/${id}`);
    return response.data;
  }
  /** Create a new item. */
  async create(data, options) {
    const response = await this._client.post("/items", data, options);
    return response.data;
  }
  /** Update an existing item. */
  async update(id, data, options) {
    const response = await this._client.patch(
      `/items/${id}`,
      data,
      options
    );
    return response.data;
  }
  /** Delete an item. Items referenced by invoices or bills cannot be deleted. */
  async delete(id, options) {
    await this._client.delete(`/items/${id}`, options);
  }
};

// src/resources/accounts.ts
var Accounts = class {
  constructor(_client) {
    this._client = _client;
  }
  /**
   * List chart of accounts with pagination.
   *
   * ```ts
   * for await (const account of cynco.accounts.list({ type: 'revenue' })) {
   *   console.log(`${account.code} — ${account.name}`);
   * }
   * ```
   */
  async list(params) {
    const fetchPage = async (p) => {
      return this._client.getList(
        "/accounts",
        p
      );
    };
    const response = await fetchPage(params ?? {});
    return new Page(response, fetchPage, params ?? {});
  }
  /** Retrieve a single account by ID. */
  async retrieve(id) {
    const response = await this._client.get(`/accounts/${id}`);
    return response.data;
  }
  /** Create a new account. */
  async create(data, options) {
    const response = await this._client.post(
      "/accounts",
      data,
      options
    );
    return response.data;
  }
  /** Update an existing account. */
  async update(id, data, options) {
    const response = await this._client.patch(
      `/accounts/${id}`,
      data,
      options
    );
    return response.data;
  }
  /** Delete an account. Only unused accounts can be deleted. */
  async delete(id, options) {
    await this._client.delete(`/accounts/${id}`, options);
  }
};

// src/resources/journal-entries.ts
var JournalEntries = class {
  constructor(_client) {
    this._client = _client;
  }
  /**
   * List journal entries with pagination.
   *
   * ```ts
   * for await (const entry of cynco.journalEntries.list({ status: 'posted' })) {
   *   console.log(entry.entryNumber);
   * }
   * ```
   */
  async list(params) {
    const fetchPage = async (p) => {
      return this._client.getList(
        "/journal-entries",
        p
      );
    };
    const response = await fetchPage(params ?? {});
    return new Page(response, fetchPage, params ?? {});
  }
  /** Retrieve a single journal entry by ID. */
  async retrieve(id) {
    const response = await this._client.get(
      `/journal-entries/${id}`
    );
    return response.data;
  }
  /** Create a new journal entry. */
  async create(data, options) {
    const response = await this._client.post(
      "/journal-entries",
      data,
      options
    );
    return response.data;
  }
  /** Update a draft journal entry. */
  async update(id, data, options) {
    const response = await this._client.patch(
      `/journal-entries/${id}`,
      data,
      options
    );
    return response.data;
  }
  /** Delete a draft journal entry. */
  async delete(id, options) {
    await this._client.delete(`/journal-entries/${id}`, options);
  }
  /** Post a draft journal entry to the ledger. */
  async post(id, options) {
    const response = await this._client.post(
      `/journal-entries/${id}/post`,
      void 0,
      options
    );
    return response.data;
  }
  /** Void a posted journal entry. */
  async void(id, options) {
    const response = await this._client.post(
      `/journal-entries/${id}/void`,
      void 0,
      options
    );
    return response.data;
  }
};

// src/resources/bank-accounts.ts
var BankAccounts = class {
  constructor(_client) {
    this._client = _client;
  }
  /**
   * List bank accounts with pagination.
   *
   * ```ts
   * for await (const account of cynco.bankAccounts.list()) {
   *   console.log(`${account.bankName} — ${account.name}`);
   * }
   * ```
   */
  async list(params) {
    const fetchPage = async (p) => {
      return this._client.getList(
        "/bank-accounts",
        p
      );
    };
    const response = await fetchPage(params ?? {});
    return new Page(response, fetchPage, params ?? {});
  }
  /** Retrieve a single bank account by ID. */
  async retrieve(id) {
    const response = await this._client.get(
      `/bank-accounts/${id}`
    );
    return response.data;
  }
  /** Create a new bank account. */
  async create(data, options) {
    const response = await this._client.post(
      "/bank-accounts",
      data,
      options
    );
    return response.data;
  }
  /** Update an existing bank account. */
  async update(id, data, options) {
    const response = await this._client.patch(
      `/bank-accounts/${id}`,
      data,
      options
    );
    return response.data;
  }
  /** Delete a bank account. */
  async delete(id, options) {
    await this._client.delete(`/bank-accounts/${id}`, options);
  }
  /**
   * List transactions for a specific bank account.
   *
   * ```ts
   * for await (const txn of cynco.bankAccounts.listTransactions('ba_123', { status: 'cleared' })) {
   *   console.log(`${txn.date} ${txn.description} ${txn.amount}`);
   * }
   * ```
   */
  async listTransactions(bankAccountId, params) {
    const fetchPage = async (p) => {
      return this._client.getList(
        `/bank-accounts/${bankAccountId}/transactions`,
        p
      );
    };
    const response = await fetchPage(params ?? {});
    return new Page(response, fetchPage, params ?? {});
  }
};

// src/resources/reports.ts
var Reports = class {
  constructor(_client) {
    this._client = _client;
  }
  /** Generate a balance sheet report. */
  async balanceSheet(params) {
    const response = await this._client.get(
      "/reports/balance-sheet",
      { ...params }
    );
    return response.data;
  }
  /** Generate a profit and loss (income statement) report. */
  async profitAndLoss(params) {
    const response = await this._client.get(
      "/reports/profit-and-loss",
      { ...params }
    );
    return response.data;
  }
  /** Generate a trial balance report. */
  async trialBalance(params) {
    const response = await this._client.get(
      "/reports/trial-balance",
      { ...params }
    );
    return response.data;
  }
};

// src/resources/webhooks.ts
var Webhooks = class {
  constructor(_client) {
    this._client = _client;
  }
  /**
   * List webhook endpoints with pagination.
   *
   * ```ts
   * for await (const webhook of cynco.webhooks.list()) {
   *   console.log(`${webhook.url} — ${webhook.events.join(', ')}`);
   * }
   * ```
   */
  async list(params) {
    const fetchPage = async (p) => {
      return this._client.getList(
        "/webhooks",
        p
      );
    };
    const response = await fetchPage(params ?? {});
    return new Page(response, fetchPage, params ?? {});
  }
  /** Retrieve a single webhook endpoint by ID. */
  async retrieve(id) {
    const response = await this._client.get(`/webhooks/${id}`);
    return response.data;
  }
  /** Create a new webhook endpoint. */
  async create(data, options) {
    const response = await this._client.post(
      "/webhooks",
      data,
      options
    );
    return response.data;
  }
  /** Update an existing webhook endpoint. */
  async update(id, data, options) {
    const response = await this._client.patch(
      `/webhooks/${id}`,
      data,
      options
    );
    return response.data;
  }
  /** Delete a webhook endpoint. */
  async delete(id, options) {
    await this._client.delete(`/webhooks/${id}`, options);
  }
  /** Rotate the signing secret for a webhook endpoint. Returns the new secret. */
  async rotateSecret(id) {
    const response = await this._client.post(
      `/webhooks/${id}/rotate-secret`
    );
    return response.data;
  }
};

// src/index.ts
var Cynco = class {
  /** Invoices resource. */
  invoices;
  /** Customers resource. */
  customers;
  /** Vendors resource. */
  vendors;
  /** Bills resource. */
  bills;
  /** Items (products & services) resource. */
  items;
  /** Chart of accounts resource. */
  accounts;
  /** Journal entries resource. */
  journalEntries;
  /** Bank accounts resource. */
  bankAccounts;
  /** Financial reports resource. */
  reports;
  /** Webhook endpoints resource. */
  webhooks;
  /**
   * Static webhook signature verification utilities.
   *
   * ```ts
   * const valid = Cynco.webhooks.verify(payload, signature, timestamp, secret);
   * ```
   */
  static webhooks = webhookVerifier;
  _client;
  /**
   * Create a new Cynco client instance.
   *
   * @param apiKey  - Your Cynco API key (starts with `cak_`).
   * @param options - Optional client configuration.
   */
  constructor(apiKey, options) {
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
};
var index_default = Cynco;

exports.Accounts = Accounts;
exports.AuthenticationError = AuthenticationError;
exports.BankAccounts = BankAccounts;
exports.Bills = Bills;
exports.ConflictError = ConflictError;
exports.ConnectionError = ConnectionError;
exports.CursorPage = CursorPage;
exports.Customers = Customers;
exports.Cynco = Cynco;
exports.CyncoClient = CyncoClient;
exports.CyncoError = CyncoError;
exports.InternalError = InternalError;
exports.Invoices = Invoices;
exports.Items = Items;
exports.JournalEntries = JournalEntries;
exports.NotFoundError = NotFoundError;
exports.Page = Page;
exports.PermissionError = PermissionError;
exports.RateLimitError = RateLimitError;
exports.Reports = Reports;
exports.TimeoutError = TimeoutError;
exports.ValidationError = ValidationError;
exports.Vendors = Vendors;
exports.Webhooks = Webhooks;
exports.default = index_default;
exports.webhookVerifier = webhookVerifier;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map