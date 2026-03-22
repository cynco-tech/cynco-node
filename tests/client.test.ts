import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CyncoClient } from '../src/client.js';
import {
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  InternalError,
  CyncoError,
  ConnectionError,
} from '../src/errors.js';

function mockFetch(
  status: number,
  body: unknown,
  headers?: Record<string, string>,
): typeof globalThis.fetch {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({
      'content-type': 'application/json',
      ...headers,
    }),
    json: () => Promise.resolve(body),
  });
}

describe('CyncoClient', () => {
  describe('constructor', () => {
    it('throws when no API key is provided', () => {
      expect(() => new CyncoClient('')).toThrow('An API key is required');
    });

    it('throws when API key has wrong prefix', () => {
      expect(() => new CyncoClient('sk_bad_key')).toThrow(
        'Invalid API key format',
      );
    });

    it('creates client with valid key', () => {
      const client = new CyncoClient('cak_test_key');
      expect(client.baseUrl).toBe('https://app.cynco.io/api/v1');
    });

    it('respects custom base URL', () => {
      const client = new CyncoClient('cak_test_key', {
        baseUrl: 'https://custom.example.com/api',
      });
      expect(client.baseUrl).toBe('https://custom.example.com/api');
    });

    it('strips trailing slashes from base URL', () => {
      const client = new CyncoClient('cak_test_key', {
        baseUrl: 'https://example.com/api///',
      });
      expect(client.baseUrl).toBe('https://example.com/api');
    });
  });

  describe('GET requests', () => {
    it('sends correct headers', async () => {
      const fetch = mockFetch(200, {
        success: true,
        data: { id: '1' },
      });
      const client = new CyncoClient('cak_test_key', { fetch });

      await client.get('/invoices/1');

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      expect(url).toBe('https://app.cynco.io/api/v1/invoices/1');
      expect(init.method).toBe('GET');
      expect(init.headers['Authorization']).toBe('Bearer cak_test_key');
      expect(init.headers['Accept']).toBe('application/json');
      expect(init.headers['User-Agent']).toMatch(/^cynco-node\//);
      expect(init.headers['X-Request-ID']).toBeDefined();
    });

    it('appends query parameters', async () => {
      const fetch = mockFetch(200, {
        success: true,
        data: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
      });
      const client = new CyncoClient('cak_test_key', { fetch });

      await client.getList('/invoices', {
        limit: 20,
        offset: 0,
        status: 'paid',
      });

      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const parsed = new URL(url);
      expect(parsed.searchParams.get('limit')).toBe('20');
      expect(parsed.searchParams.get('offset')).toBe('0');
      expect(parsed.searchParams.get('status')).toBe('paid');
    });

    it('omits undefined and null params', async () => {
      const fetch = mockFetch(200, {
        success: true,
        data: [],
        pagination: { total: 0, limit: 20, offset: 0, hasMore: false },
      });
      const client = new CyncoClient('cak_test_key', { fetch });

      await client.getList('/invoices', {
        limit: 20,
        status: undefined,
        search: null,
      });

      const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      const parsed = new URL(url);
      expect(parsed.searchParams.has('status')).toBe(false);
      expect(parsed.searchParams.has('search')).toBe(false);
    });

    it('returns parsed response with rate limit metadata', async () => {
      const fetch = mockFetch(
        200,
        { success: true, data: { id: '1' } },
        {
          'X-RateLimit-Limit': '120',
          'X-RateLimit-Remaining': '119',
          'X-RateLimit-Reset': '1700000000',
        },
      );
      const client = new CyncoClient('cak_test_key', { fetch });

      const result = await client.get<{ id: string }>('/invoices/1');

      expect(result.success).toBe(true);
      expect(result.data.id).toBe('1');
      expect(result.meta?.rateLimit).toEqual({
        limit: 120,
        remaining: 119,
        reset: 1700000000,
      });
    });
  });

  describe('POST requests', () => {
    it('sends JSON body', async () => {
      const fetch = mockFetch(201, {
        success: true,
        data: { id: '1', name: 'Acme' },
      });
      const client = new CyncoClient('cak_test_key', { fetch });

      await client.post('/customers', { name: 'Acme' });

      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      expect(init.method).toBe('POST');
      expect(init.headers['Content-Type']).toBe('application/json');
      expect(init.body).toBe(JSON.stringify({ name: 'Acme' }));
    });

    it('sends idempotency key header', async () => {
      const fetch = mockFetch(201, {
        success: true,
        data: { id: '1' },
      });
      const client = new CyncoClient('cak_test_key', { fetch });

      await client.post('/customers', { name: 'Acme' }, {
        idempotencyKey: 'idem_123',
      });

      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      expect(init.headers['Idempotency-Key']).toBe('idem_123');
    });
  });

  describe('error handling', () => {
    it('throws AuthenticationError on 401', async () => {
      const fetch = mockFetch(401, {
        success: false,
        error: { code: 'unauthorized', message: 'Invalid API key' },
      });
      const client = new CyncoClient('cak_test_key', {
        fetch,
        maxRetries: 0,
      });

      await expect(client.get('/invoices')).rejects.toThrow(
        AuthenticationError,
      );
    });

    it('throws NotFoundError on 404', async () => {
      const fetch = mockFetch(404, {
        success: false,
        error: { code: 'not_found', message: 'Invoice not found' },
      });
      const client = new CyncoClient('cak_test_key', {
        fetch,
        maxRetries: 0,
      });

      await expect(client.get('/invoices/nonexistent')).rejects.toThrow(
        NotFoundError,
      );
    });

    it('throws ValidationError on 422 with details', async () => {
      const fetch = mockFetch(422, {
        success: false,
        error: {
          code: 'validation_error',
          message: 'Validation failed',
          details: [{ field: 'name', message: 'is required' }],
        },
      });
      const client = new CyncoClient('cak_test_key', {
        fetch,
        maxRetries: 0,
      });

      try {
        await client.post('/customers', {});
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const ve = error as ValidationError;
        expect(ve.status).toBe(422);
        expect(ve.code).toBe('validation_error');
        expect(ve.details).toHaveLength(1);
        expect(ve.details![0]!.field).toBe('name');
      }
    });

    it('throws InternalError on 500', async () => {
      const fetch = mockFetch(500, {
        success: false,
        error: { code: 'internal_error', message: 'Something went wrong' },
      });
      const client = new CyncoClient('cak_test_key', {
        fetch,
        maxRetries: 0,
      });

      await expect(client.get('/invoices')).rejects.toThrow(InternalError);
    });

    it('preserves requestId on error', async () => {
      const fetch = mockFetch(400, {
        success: false,
        error: { code: 'bad_request', message: 'Bad request' },
      });
      const client = new CyncoClient('cak_test_key', {
        fetch,
        maxRetries: 0,
      });

      try {
        await client.get('/invoices');
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(CyncoError);
        expect((error as CyncoError).requestId).toBeDefined();
        expect((error as CyncoError).requestId.length).toBeGreaterThan(0);
      }
    });
  });

  describe('retries', () => {
    it('retries GET requests on 500', async () => {
      const fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers(),
          json: () =>
            Promise.resolve({
              success: false,
              error: { code: 'internal_error', message: 'Server error' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers(),
          json: () =>
            Promise.resolve({ success: true, data: { id: '1' } }),
        });

      const client = new CyncoClient('cak_test_key', {
        fetch,
        maxRetries: 2,
      });

      const result = await client.get<{ id: string }>('/invoices/1');
      expect(result.data.id).toBe('1');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('retries on 429 even for POST without idempotency key', async () => {
      const fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          headers: new Headers({ 'Retry-After': '0' }),
          json: () =>
            Promise.resolve({
              success: false,
              error: { code: 'rate_limit', message: 'Too many requests' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: new Headers(),
          json: () =>
            Promise.resolve({
              success: true,
              data: { id: '1', name: 'Acme' },
            }),
        });

      const client = new CyncoClient('cak_test_key', {
        fetch,
        maxRetries: 2,
      });

      const result = await client.post<{ id: string; name: string }>(
        '/customers',
        { name: 'Acme' },
      );
      expect(result.data.name).toBe('Acme');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('does not retry POST on 500 without idempotency key', async () => {
      const fetch = mockFetch(500, {
        success: false,
        error: { code: 'internal_error', message: 'Server error' },
      });

      const client = new CyncoClient('cak_test_key', {
        fetch,
        maxRetries: 3,
      });

      await expect(
        client.post('/customers', { name: 'Acme' }),
      ).rejects.toThrow(InternalError);
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('retries POST on 500 with idempotency key', async () => {
      const fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          headers: new Headers(),
          json: () =>
            Promise.resolve({
              success: false,
              error: { code: 'internal_error', message: 'Server error' },
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 201,
          headers: new Headers(),
          json: () =>
            Promise.resolve({
              success: true,
              data: { id: '1', name: 'Acme' },
            }),
        });

      const client = new CyncoClient('cak_test_key', {
        fetch,
        maxRetries: 2,
      });

      const result = await client.post<{ id: string; name: string }>(
        '/customers',
        { name: 'Acme' },
        { idempotencyKey: 'idem_123' },
      );
      expect(result.data.name).toBe('Acme');
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it('gives up after max retries', async () => {
      const fetch = mockFetch(500, {
        success: false,
        error: { code: 'internal_error', message: 'Server error' },
      });

      const client = new CyncoClient('cak_test_key', {
        fetch,
        maxRetries: 2,
      });

      await expect(client.get('/invoices')).rejects.toThrow(InternalError);
      // 1 original + 2 retries = 3 calls
      expect(fetch).toHaveBeenCalledTimes(3);
    });

    it('throws ConnectionError on network failure (no retries left)', async () => {
      const fetch = vi.fn().mockRejectedValue(new Error('fetch failed'));

      const client = new CyncoClient('cak_test_key', {
        fetch,
        maxRetries: 0,
      });

      await expect(client.get('/invoices')).rejects.toThrow(ConnectionError);
    });
  });

  describe('DELETE requests', () => {
    it('sends DELETE method', async () => {
      const fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: () => Promise.resolve(undefined),
      });
      const client = new CyncoClient('cak_test_key', { fetch });

      await client.delete('/invoices/1');

      const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]!;
      expect(init.method).toBe('DELETE');
    });
  });
});
