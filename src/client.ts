import { randomUUID } from 'node:crypto';
import type {
  CyncoClientOptions,
  CyncoResponse,
  PaginatedResponse,
  RequestOptions,
  ErrorResponse,
  RateLimitInfo,
} from './types.js';
import {
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

const DEFAULT_BASE_URL = 'https://app.cynco.io/api/v1';
const DEFAULT_TIMEOUT = 30_000;
const DEFAULT_MAX_RETRIES = 3;

const SDK_VERSION = '0.1.0';
const USER_AGENT = `cynco-node/${SDK_VERSION}`;

/** HTTP methods that are safe to retry on transient failure. */
const RETRYABLE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'DELETE']);

/** Status codes that trigger automatic retry. */
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

/**
 * Low-level HTTP client that handles authentication, retries, rate limiting,
 * and error mapping. Each Cynco instance has exactly one CyncoClient.
 */
export class CyncoClient {
  private readonly _apiKey: string;
  readonly baseUrl: string;
  private readonly _timeout: number;
  private readonly _maxRetries: number;
  private readonly _fetch: typeof globalThis.fetch;

  constructor(apiKey: string, options: CyncoClientOptions = {}) {
    if (!apiKey) {
      throw new Error(
        'An API key is required. Pass it as the first argument: new Cynco("cak_...")',
      );
    }

    if (!apiKey.startsWith('cak_')) {
      throw new Error(
        'Invalid API key format. Cynco API keys start with "cak_".',
      );
    }

    this._apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    this._timeout = options.timeout ?? DEFAULT_TIMEOUT;
    this._maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
    this._fetch = options.fetch ?? globalThis.fetch;
  }

  // ---------------------------------------------------------------------------
  // Public request methods
  // ---------------------------------------------------------------------------

  async get<T>(
    path: string,
    params?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<CyncoResponse<T>> {
    const url = this._buildUrl(path, params);
    return this._request<CyncoResponse<T>>('GET', url, undefined, options);
  }

  async getList<T>(
    path: string,
    params?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<PaginatedResponse<T>> {
    const url = this._buildUrl(path, params);
    return this._request<PaginatedResponse<T>>('GET', url, undefined, options);
  }

  async post<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<CyncoResponse<T>> {
    const url = this._buildUrl(path);
    return this._request<CyncoResponse<T>>('POST', url, body, options);
  }

  async patch<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<CyncoResponse<T>> {
    const url = this._buildUrl(path);
    return this._request<CyncoResponse<T>>('PATCH', url, body, options);
  }

  async put<T>(
    path: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<CyncoResponse<T>> {
    const url = this._buildUrl(path);
    return this._request<CyncoResponse<T>>('PUT', url, body, options);
  }

  async delete<T = void>(
    path: string,
    options?: RequestOptions,
  ): Promise<CyncoResponse<T>> {
    const url = this._buildUrl(path);
    return this._request<CyncoResponse<T>>('DELETE', url, undefined, options);
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private _buildUrl(
    path: string,
    params?: Record<string, unknown>,
  ): string {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private async _request<T>(
    method: string,
    url: string,
    body: unknown | undefined,
    options?: RequestOptions,
    attempt = 0,
  ): Promise<T> {
    const requestId = randomUUID();

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this._apiKey}`,
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
      'X-Request-ID': requestId,
      ...options?.headers,
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this._timeout);

    // Combine user-provided signal with our timeout signal
    const signal = options?.signal
      ? anySignal([options.signal, controller.signal])
      : controller.signal;

    try {
      const response = await this._fetch(url, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
      });

      clearTimeout(timeoutId);

      // Parse rate limit headers for all responses
      const rateLimitInfo = this._parseRateLimitHeaders(response.headers);

      // Successful response
      if (response.ok) {
        // 204 No Content
        if (response.status === 204) {
          return { success: true, data: undefined } as T;
        }

        const json = (await response.json()) as Record<string, unknown>;

        // Ensure success field is always present on success responses
        json['success'] = true;

        // Attach rate limit info to meta if present
        if (rateLimitInfo) {
          json['meta'] = {
            ...(json['meta'] as Record<string, unknown> | undefined),
            requestId,
            rateLimit: rateLimitInfo,
          };
        }

        return json as T;
      }

      // Error response — check if retryable
      if (this._shouldRetry(method, response.status, attempt, options)) {
        const retryDelay = this._getRetryDelay(
          attempt,
          response.status,
          response.headers,
        );
        await sleep(retryDelay);
        return this._request<T>(method, url, body, options, attempt + 1);
      }

      // Non-retryable error — parse and throw
      const errorBody = await this._safeParseJson(response);
      throw this._buildError(response.status, errorBody, requestId, rateLimitInfo);
    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw our own errors
      if (error instanceof CyncoError) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof DOMException && error.name === 'AbortError') {
        // Check if this was user cancellation vs our timeout
        if (options?.signal?.aborted) {
          throw new CyncoError('Request was cancelled', {
            code: 'cancelled',
            status: 0,
            requestId,
          });
        }
        throw new TimeoutError(requestId, this._timeout);
      }

      // Connection/network errors — retry if applicable
      if (this._shouldRetryOnNetworkError(method, attempt, options)) {
        const retryDelay = this._getRetryDelay(attempt, 0, undefined);
        await sleep(retryDelay);
        return this._request<T>(method, url, body, options, attempt + 1);
      }

      throw new ConnectionError(
        requestId,
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }

  private _shouldRetry(
    method: string,
    status: number,
    attempt: number,
    options?: RequestOptions,
  ): boolean {
    if (attempt >= this._maxRetries) return false;
    if (!RETRYABLE_STATUS_CODES.has(status)) return false;

    // Non-idempotent methods only retry if they have an idempotency key
    if (
      !RETRYABLE_METHODS.has(method) &&
      !options?.idempotencyKey
    ) {
      // Exception: 429 is always retryable (request was never processed)
      return status === 429;
    }

    return true;
  }

  private _shouldRetryOnNetworkError(
    method: string,
    attempt: number,
    options?: RequestOptions,
  ): boolean {
    if (attempt >= this._maxRetries) return false;
    return RETRYABLE_METHODS.has(method) || !!options?.idempotencyKey;
  }

  /**
   * Calculate retry delay with exponential backoff and jitter.
   * For 429 responses, uses Retry-After header if present.
   */
  private _getRetryDelay(
    attempt: number,
    status: number,
    headers: Headers | undefined,
  ): number {
    // Respect Retry-After header for rate limits
    if (status === 429 && headers) {
      const retryAfter = headers.get('Retry-After');
      if (retryAfter) {
        const seconds = parseInt(retryAfter, 10);
        if (!Number.isNaN(seconds)) {
          return seconds * 1000;
        }
      }
    }

    // Exponential backoff with jitter: base * 2^attempt + random jitter
    const baseDelay = 500; // 500ms
    const exponentialDelay = baseDelay * Math.pow(2, attempt);
    const jitter = Math.random() * baseDelay;
    return Math.min(exponentialDelay + jitter, 30_000); // cap at 30s
  }

  private _parseRateLimitHeaders(
    headers: Headers,
  ): RateLimitInfo | undefined {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');

    if (!limit || !remaining || !reset) return undefined;

    return {
      limit: parseInt(limit, 10),
      remaining: parseInt(remaining, 10),
      reset: parseInt(reset, 10),
    };
  }

  private async _safeParseJson(
    response: Response,
  ): Promise<ErrorResponse | null> {
    try {
      return (await response.json()) as ErrorResponse;
    } catch {
      return null;
    }
  }

  private _buildError(
    status: number,
    body: ErrorResponse | null,
    requestId: string,
    rateLimitInfo?: RateLimitInfo,
  ): CyncoError {
    const code = body?.error?.code ?? 'unknown_error';
    const message =
      body?.error?.message ?? `Request failed with status ${status}`;
    const details = body?.error?.details;
    const meta = { ...body?.meta, requestId, rateLimit: rateLimitInfo };

    switch (status) {
      case 401:
        return new AuthenticationError(message, {
          code,
          status,
          requestId,
          meta,
        });
      case 403:
        return new PermissionError(message, {
          code,
          status,
          requestId,
          meta,
        });
      case 404:
        return new NotFoundError(message, {
          code,
          status,
          requestId,
          meta,
        });
      case 409:
        return new ConflictError(message, {
          code,
          status,
          requestId,
          meta,
        });
      case 422:
        return new ValidationError(message, {
          code,
          status,
          requestId,
          details,
          meta,
        });
      case 429:
        return new RateLimitError(message, {
          code,
          status,
          requestId,
          retryAfter: rateLimitInfo?.reset ?? 0,
          meta,
        });
      default:
        if (status >= 500) {
          return new InternalError(message, {
            code,
            status,
            requestId,
            meta,
          });
        }
        return new CyncoError(message, {
          code,
          status,
          requestId,
          details,
          meta,
        });
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create an AbortSignal that triggers when ANY of the provided signals abort.
 */
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      return controller.signal;
    }
    signal.addEventListener(
      'abort',
      () => controller.abort(signal.reason),
      { once: true },
    );
  }

  return controller.signal;
}
