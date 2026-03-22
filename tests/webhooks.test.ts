import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { webhookVerifier } from '../src/webhooks.js';

describe('webhookVerifier', () => {
  const secret = 'whsec_test_secret_key_1234567890';
  const payload = JSON.stringify({
    id: 'evt_123',
    event: 'invoice.paid',
    data: { invoiceId: 'inv_456' },
  });

  describe('sign', () => {
    it('produces a signature and timestamp', () => {
      const result = webhookVerifier.sign(payload, secret, 1700000000);

      expect(result.signature).toBeDefined();
      expect(result.signature.length).toBe(64); // SHA-256 hex
      expect(result.timestamp).toBe('1700000000');
    });

    it('produces deterministic signatures', () => {
      const a = webhookVerifier.sign(payload, secret, 1700000000);
      const b = webhookVerifier.sign(payload, secret, 1700000000);

      expect(a.signature).toBe(b.signature);
    });

    it('produces different signatures for different payloads', () => {
      const a = webhookVerifier.sign('payload_a', secret, 1700000000);
      const b = webhookVerifier.sign('payload_b', secret, 1700000000);

      expect(a.signature).not.toBe(b.signature);
    });

    it('produces different signatures for different secrets', () => {
      const a = webhookVerifier.sign(payload, 'secret_a', 1700000000);
      const b = webhookVerifier.sign(payload, 'secret_b', 1700000000);

      expect(a.signature).not.toBe(b.signature);
    });

    it('produces different signatures for different timestamps', () => {
      const a = webhookVerifier.sign(payload, secret, 1700000000);
      const b = webhookVerifier.sign(payload, secret, 1700000001);

      expect(a.signature).not.toBe(b.signature);
    });
  });

  describe('verify', () => {
    let now: number;

    beforeEach(() => {
      now = Math.floor(Date.now() / 1000);
      vi.useFakeTimers();
      vi.setSystemTime(now * 1000);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns true for valid signature', () => {
      const { signature, timestamp } = webhookVerifier.sign(
        payload,
        secret,
        now,
      );

      const result = webhookVerifier.verify(
        payload,
        signature,
        timestamp,
        secret,
      );

      expect(result).toBe(true);
    });

    it('returns false for wrong signature', () => {
      const result = webhookVerifier.verify(
        payload,
        'deadbeef'.repeat(8),
        String(now),
        secret,
      );

      expect(result).toBe(false);
    });

    it('returns false for wrong secret', () => {
      const { signature, timestamp } = webhookVerifier.sign(
        payload,
        secret,
        now,
      );

      const result = webhookVerifier.verify(
        payload,
        signature,
        timestamp,
        'wrong_secret',
      );

      expect(result).toBe(false);
    });

    it('returns false for tampered payload', () => {
      const { signature, timestamp } = webhookVerifier.sign(
        payload,
        secret,
        now,
      );

      const result = webhookVerifier.verify(
        '{"tampered": true}',
        signature,
        timestamp,
        secret,
      );

      expect(result).toBe(false);
    });

    it('returns false for stale timestamp', () => {
      const staleTs = now - 600; // 10 minutes ago
      const { signature, timestamp } = webhookVerifier.sign(
        payload,
        secret,
        staleTs,
      );

      const result = webhookVerifier.verify(
        payload,
        signature,
        timestamp,
        secret,
      );

      expect(result).toBe(false);
    });

    it('returns true for timestamp within tolerance', () => {
      const recentTs = now - 120; // 2 minutes ago (within 5-min default)
      const { signature, timestamp } = webhookVerifier.sign(
        payload,
        secret,
        recentTs,
      );

      const result = webhookVerifier.verify(
        payload,
        signature,
        timestamp,
        secret,
      );

      expect(result).toBe(true);
    });

    it('respects custom tolerance', () => {
      const ts = now - 10; // 10 seconds ago
      const { signature, timestamp } = webhookVerifier.sign(
        payload,
        secret,
        ts,
      );

      // Should fail with 5-second tolerance
      const resultStrict = webhookVerifier.verify(
        payload,
        signature,
        timestamp,
        secret,
        { tolerance: 5 },
      );
      expect(resultStrict).toBe(false);

      // Should pass with 30-second tolerance
      const resultLenient = webhookVerifier.verify(
        payload,
        signature,
        timestamp,
        secret,
        { tolerance: 30 },
      );
      expect(resultLenient).toBe(true);
    });

    it('returns false for non-numeric timestamp', () => {
      const result = webhookVerifier.verify(
        payload,
        'some_signature',
        'not_a_number',
        secret,
      );

      expect(result).toBe(false);
    });
  });

  describe('verifyOrThrow', () => {
    let now: number;

    beforeEach(() => {
      now = Math.floor(Date.now() / 1000);
      vi.useFakeTimers();
      vi.setSystemTime(now * 1000);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('does not throw for valid signature', () => {
      const { signature, timestamp } = webhookVerifier.sign(
        payload,
        secret,
        now,
      );

      expect(() =>
        webhookVerifier.verifyOrThrow(payload, signature, timestamp, secret),
      ).not.toThrow();
    });

    it('throws for invalid signature', () => {
      expect(() =>
        webhookVerifier.verifyOrThrow(
          payload,
          'invalid',
          String(now),
          secret,
        ),
      ).toThrow('Invalid webhook signature');
    });

    it('throws for stale timestamp', () => {
      const staleTs = now - 600;
      const { signature, timestamp } = webhookVerifier.sign(
        payload,
        secret,
        staleTs,
      );

      expect(() =>
        webhookVerifier.verifyOrThrow(payload, signature, timestamp, secret),
      ).toThrow('Webhook timestamp is too old');
    });

    it('throws for non-numeric timestamp', () => {
      expect(() =>
        webhookVerifier.verifyOrThrow(payload, 'sig', 'bad', secret),
      ).toThrow('Invalid webhook timestamp');
    });
  });
});
