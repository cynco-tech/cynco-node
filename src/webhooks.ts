import { createHmac, timingSafeEqual } from 'node:crypto';

/** Maximum age in seconds for a webhook timestamp before it is rejected. */
const TIMESTAMP_TOLERANCE_SECONDS = 300; // 5 minutes

export interface WebhookVerifyOptions {
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
export const webhookVerifier = {
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
  verify(
    payload: string,
    signature: string,
    timestamp: string,
    secret: string,
    options?: WebhookVerifyOptions,
  ): boolean {
    const tolerance =
      options?.tolerance ?? TIMESTAMP_TOLERANCE_SECONDS;

    // Validate timestamp freshness
    const ts = parseInt(timestamp, 10);
    if (Number.isNaN(ts)) {
      return false;
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > tolerance) {
      return false;
    }

    // Compute expected signature: HMAC-SHA256(secret, timestamp.payload)
    const signedContent = `${timestamp}.${payload}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(signedContent)
      .digest('hex');

    // Constant-time comparison
    const sigBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (sigBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return timingSafeEqual(sigBuffer, expectedBuffer);
  },

  /**
   * Verify a webhook signature, throwing an error if invalid.
   *
   * @throws {Error} If the signature is invalid or the timestamp is stale.
   */
  verifyOrThrow(
    payload: string,
    signature: string,
    timestamp: string,
    secret: string,
    options?: WebhookVerifyOptions,
  ): void {
    const tolerance =
      options?.tolerance ?? TIMESTAMP_TOLERANCE_SECONDS;

    const ts = parseInt(timestamp, 10);
    if (Number.isNaN(ts)) {
      throw new Error('Invalid webhook timestamp');
    }

    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - ts) > tolerance) {
      throw new Error(
        `Webhook timestamp is too old (${Math.abs(now - ts)}s > ${tolerance}s tolerance)`,
      );
    }

    const signedContent = `${timestamp}.${payload}`;
    const expectedSignature = createHmac('sha256', secret)
      .update(signedContent)
      .digest('hex');

    const sigBuffer = Buffer.from(signature, 'utf8');
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      throw new Error('Invalid webhook signature');
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
  sign(
    payload: string,
    secret: string,
    timestamp?: number,
  ): { signature: string; timestamp: string } {
    const ts = timestamp ?? Math.floor(Date.now() / 1000);
    const signedContent = `${ts}.${payload}`;
    const signature = createHmac('sha256', secret)
      .update(signedContent)
      .digest('hex');

    return { signature, timestamp: String(ts) };
  },
};
