import { describe, it, expect, vi } from 'vitest';
import Cynco from '../../src/index.js';
import type { Customer, PaginatedResponse, CyncoResponse } from '../../src/types.js';

const mockCustomer: Customer = {
  id: 'cust_123',
  name: 'Acme Corp',
  email: 'billing@acme.com',
  phone: '+60123456789',
  type: 'company',
  taxNumber: 'MY12345678',
  currency: 'MYR',
  billingAddress: {
    line1: '123 Main Street',
    city: 'Kuala Lumpur',
    postalCode: '50000',
    country: 'MY',
  },
  shippingAddress: null,
  notes: null,
  isActive: true,
  outstandingBalance: 5000,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
};

function createMockFetch() {
  return vi.fn() as ReturnType<typeof vi.fn>;
}

function makeCynco(fetch: ReturnType<typeof vi.fn>): InstanceType<typeof Cynco> {
  return new Cynco('cak_test_key', {
    fetch: fetch as unknown as typeof globalThis.fetch,
    maxRetries: 0,
  });
}

function mockResponse<T>(data: T, status = 200): {
  ok: boolean;
  status: number;
  headers: Headers;
  json: () => Promise<CyncoResponse<T>>;
} {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: () => Promise.resolve({ success: true as const, data }),
  };
}

function mockListResponse<T>(
  data: T[],
  total: number,
  offset = 0,
  limit = 20,
): {
  ok: boolean;
  status: number;
  headers: Headers;
  json: () => Promise<PaginatedResponse<T>>;
} {
  return {
    ok: true,
    status: 200,
    headers: new Headers(),
    json: () =>
      Promise.resolve({
        success: true as const,
        data,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + data.length < total,
        },
      }),
  };
}

describe('Customers resource', () => {
  describe('list', () => {
    it('fetches customers with default params', async () => {
      const fetch = createMockFetch();
      fetch.mockResolvedValue(mockListResponse([mockCustomer], 1));
      const cynco = makeCynco(fetch);

      const page = await cynco.customers.list();

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url] = fetch.mock.calls[0]!;
      expect(url).toContain('/customers');
      expect(page.data).toHaveLength(1);
      expect(page.data[0]!.id).toBe('cust_123');
      expect(page.pagination.total).toBe(1);
    });

    it('passes query parameters', async () => {
      const fetch = createMockFetch();
      fetch.mockResolvedValue(mockListResponse([mockCustomer], 1));
      const cynco = makeCynco(fetch);

      await cynco.customers.list({ search: 'Acme', type: 'company', limit: 10 });

      const [url] = fetch.mock.calls[0]!;
      const parsed = new URL(url);
      expect(parsed.searchParams.get('search')).toBe('Acme');
      expect(parsed.searchParams.get('type')).toBe('company');
      expect(parsed.searchParams.get('limit')).toBe('10');
    });

    it('supports auto-pagination', async () => {
      const fetch = createMockFetch();
      fetch
        .mockResolvedValueOnce(
          mockListResponse(
            [{ ...mockCustomer, id: 'cust_1' }],
            3,
            0,
            1,
          ),
        )
        .mockResolvedValueOnce(
          mockListResponse(
            [{ ...mockCustomer, id: 'cust_2' }],
            3,
            1,
            1,
          ),
        )
        .mockResolvedValueOnce(
          mockListResponse(
            [{ ...mockCustomer, id: 'cust_3' }],
            3,
            2,
            1,
          ),
        );

      const cynco = makeCynco(fetch);
      const page = await cynco.customers.list({ limit: 1 });

      const ids: string[] = [];
      for await (const customer of page) {
        ids.push(customer.id);
      }

      expect(ids).toEqual(['cust_1', 'cust_2', 'cust_3']);
      // 1 initial + 2 nextPage calls
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('retrieve', () => {
    it('fetches a single customer', async () => {
      const fetch = createMockFetch();
      fetch.mockResolvedValue(mockResponse(mockCustomer));
      const cynco = makeCynco(fetch);

      const customer = await cynco.customers.retrieve('cust_123');

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url] = fetch.mock.calls[0]!;
      expect(url).toContain('/customers/cust_123');
      expect(customer.id).toBe('cust_123');
      expect(customer.name).toBe('Acme Corp');
    });
  });

  describe('create', () => {
    it('creates a customer', async () => {
      const fetch = createMockFetch();
      fetch.mockResolvedValue(mockResponse(mockCustomer, 201));
      const cynco = makeCynco(fetch);

      const customer = await cynco.customers.create({
        name: 'Acme Corp',
        email: 'billing@acme.com',
        type: 'company',
      });

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = fetch.mock.calls[0]!;
      expect(url).toContain('/customers');
      expect(init.method).toBe('POST');
      const body = JSON.parse(init.body);
      expect(body.name).toBe('Acme Corp');
      expect(customer.id).toBe('cust_123');
    });

    it('sends idempotency key', async () => {
      const fetch = createMockFetch();
      fetch.mockResolvedValue(mockResponse(mockCustomer, 201));
      const cynco = makeCynco(fetch);

      await cynco.customers.create(
        { name: 'Acme Corp' },
        { idempotencyKey: 'idem_abc' },
      );

      const [, init] = fetch.mock.calls[0]!;
      expect(init.headers['Idempotency-Key']).toBe('idem_abc');
    });
  });

  describe('update', () => {
    it('updates a customer', async () => {
      const updated = { ...mockCustomer, name: 'Acme Corp (Updated)' };
      const fetch = createMockFetch();
      fetch.mockResolvedValue(mockResponse(updated));
      const cynco = makeCynco(fetch);

      const customer = await cynco.customers.update('cust_123', {
        name: 'Acme Corp (Updated)',
      });

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = fetch.mock.calls[0]!;
      expect(url).toContain('/customers/cust_123');
      expect(init.method).toBe('PATCH');
      expect(customer.name).toBe('Acme Corp (Updated)');
    });
  });

  describe('delete', () => {
    it('deletes a customer', async () => {
      const fetch = createMockFetch();
      fetch.mockResolvedValue({
        ok: true,
        status: 204,
        headers: new Headers(),
        json: () => Promise.resolve(undefined),
      });
      const cynco = makeCynco(fetch);

      await cynco.customers.delete('cust_123');

      expect(fetch).toHaveBeenCalledTimes(1);
      const [url, init] = fetch.mock.calls[0]!;
      expect(url).toContain('/customers/cust_123');
      expect(init.method).toBe('DELETE');
    });
  });
});

describe('Cynco class', () => {
  it('exposes all resource namespaces', () => {
    const cynco = new Cynco('cak_test_key', {
      fetch: vi.fn() as unknown as typeof globalThis.fetch,
    });

    expect(cynco.invoices).toBeDefined();
    expect(cynco.customers).toBeDefined();
    expect(cynco.vendors).toBeDefined();
    expect(cynco.bills).toBeDefined();
    expect(cynco.items).toBeDefined();
    expect(cynco.accounts).toBeDefined();
    expect(cynco.journalEntries).toBeDefined();
    expect(cynco.bankAccounts).toBeDefined();
    expect(cynco.reports).toBeDefined();
    expect(cynco.webhooks).toBeDefined();
  });

  it('exposes static webhook verifier', () => {
    expect(Cynco.webhooks).toBeDefined();
    expect(typeof Cynco.webhooks.verify).toBe('function');
    expect(typeof Cynco.webhooks.verifyOrThrow).toBe('function');
    expect(typeof Cynco.webhooks.sign).toBe('function');
  });
});
