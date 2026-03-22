import type { ValidationDetail, ResponseMeta } from './types.js';

/**
 * Base error class for all Cynco API errors.
 *
 * Contains the HTTP status code, machine-readable error code, and optional
 * field-level validation details.
 */
export class CyncoError extends Error {
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

  constructor(
    message: string,
    options: {
      code: string;
      status: number;
      requestId: string;
      details?: ValidationDetail[];
      meta?: ResponseMeta;
    },
  ) {
    super(message);
    this.name = 'CyncoError';
    this.code = options.code;
    this.status = options.status;
    this.requestId = options.requestId;
    this.details = options.details;
    this.meta = options.meta;

    // Maintains proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 401 Unauthorized — the API key is missing, invalid, or revoked.
 */
export class AuthenticationError extends CyncoError {
  constructor(
    message: string,
    options: {
      code: string;
      status: number;
      requestId: string;
      meta?: ResponseMeta;
    },
  ) {
    super(message, options);
    this.name = 'AuthenticationError';
  }
}

/**
 * 403 Forbidden — the API key lacks permission for this operation.
 */
export class PermissionError extends CyncoError {
  constructor(
    message: string,
    options: {
      code: string;
      status: number;
      requestId: string;
      meta?: ResponseMeta;
    },
  ) {
    super(message, options);
    this.name = 'PermissionError';
  }
}

/**
 * 404 Not Found — the requested resource does not exist.
 */
export class NotFoundError extends CyncoError {
  constructor(
    message: string,
    options: {
      code: string;
      status: number;
      requestId: string;
      meta?: ResponseMeta;
    },
  ) {
    super(message, options);
    this.name = 'NotFoundError';
  }
}

/**
 * 409 Conflict — the request conflicts with current server state
 * (e.g. duplicate idempotency key with different parameters).
 */
export class ConflictError extends CyncoError {
  constructor(
    message: string,
    options: {
      code: string;
      status: number;
      requestId: string;
      meta?: ResponseMeta;
    },
  ) {
    super(message, options);
    this.name = 'ConflictError';
  }
}

/**
 * 422 Unprocessable Entity — request body failed validation.
 */
export class ValidationError extends CyncoError {
  constructor(
    message: string,
    options: {
      code: string;
      status: number;
      requestId: string;
      details?: ValidationDetail[];
      meta?: ResponseMeta;
    },
  ) {
    super(message, options);
    this.name = 'ValidationError';
  }
}

/**
 * 429 Too Many Requests — you have exceeded the rate limit.
 *
 * The SDK automatically retries rate-limited requests with exponential backoff.
 * This error is thrown only after all retries are exhausted.
 */
export class RateLimitError extends CyncoError {
  /** Unix timestamp (seconds) when the rate limit resets. */
  readonly retryAfter: number;

  constructor(
    message: string,
    options: {
      code: string;
      status: number;
      requestId: string;
      retryAfter: number;
      meta?: ResponseMeta;
    },
  ) {
    super(message, options);
    this.name = 'RateLimitError';
    this.retryAfter = options.retryAfter;
  }
}

/**
 * 500+ Internal Server Error — something went wrong on the Cynco side.
 *
 * The SDK automatically retries server errors with exponential backoff.
 * This error is thrown only after all retries are exhausted.
 */
export class InternalError extends CyncoError {
  constructor(
    message: string,
    options: {
      code: string;
      status: number;
      requestId: string;
      meta?: ResponseMeta;
    },
  ) {
    super(message, options);
    this.name = 'InternalError';
  }
}

/**
 * Thrown when a request times out before completing.
 */
export class TimeoutError extends CyncoError {
  constructor(requestId: string, timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`, {
      code: 'timeout',
      status: 0,
      requestId,
    });
    this.name = 'TimeoutError';
  }
}

/**
 * Thrown when the network is unreachable or the connection was refused.
 */
export class ConnectionError extends CyncoError {
  constructor(requestId: string, cause: Error) {
    super(`Connection failed: ${cause.message}`, {
      code: 'connection_error',
      status: 0,
      requestId,
    });
    this.name = 'ConnectionError';
    this.cause = cause;
  }
}
