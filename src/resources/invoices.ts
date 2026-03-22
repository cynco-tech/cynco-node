import type { CyncoClient } from '../client.js';
import { Page } from '../pagination.js';
import type {
  Invoice,
  InvoiceListParams,
  InvoiceCreateInput,
  InvoiceUpdateInput,
  PaginatedResponse,
  RequestOptions,
} from '../types.js';

export class Invoices {
  constructor(private readonly _client: CyncoClient) {}

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
  async list(params?: InvoiceListParams): Promise<Page<Invoice>> {
    const fetchPage = async (
      p: InvoiceListParams,
    ): Promise<PaginatedResponse<Invoice>> => {
      return this._client.getList<Invoice>('/invoices', p as Record<string, unknown>);
    };

    const response = await fetchPage(params ?? {});
    return new Page(response, fetchPage, params ?? {});
  }

  /** Retrieve a single invoice by ID. */
  async retrieve(id: string): Promise<Invoice> {
    const response = await this._client.get<Invoice>(`/invoices/${id}`);
    return response.data;
  }

  /** Create a new invoice. */
  async create(
    data: InvoiceCreateInput,
    options?: RequestOptions,
  ): Promise<Invoice> {
    const response = await this._client.post<Invoice>(
      '/invoices',
      data,
      options,
    );
    return response.data;
  }

  /** Update an existing invoice. */
  async update(
    id: string,
    data: InvoiceUpdateInput,
    options?: RequestOptions,
  ): Promise<Invoice> {
    const response = await this._client.patch<Invoice>(
      `/invoices/${id}`,
      data,
      options,
    );
    return response.data;
  }

  /** Delete an invoice. Only draft invoices can be deleted. */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this._client.delete(`/invoices/${id}`, options);
  }

  /** Send an invoice to the customer via email. */
  async send(id: string, options?: RequestOptions): Promise<Invoice> {
    const response = await this._client.post<Invoice>(
      `/invoices/${id}/send`,
      undefined,
      options,
    );
    return response.data;
  }

  /** Mark an invoice as paid. */
  async markPaid(
    id: string,
    data?: { paidDate?: string; paymentMethod?: string },
    options?: RequestOptions,
  ): Promise<Invoice> {
    const response = await this._client.post<Invoice>(
      `/invoices/${id}/mark-paid`,
      data,
      options,
    );
    return response.data;
  }

  /** Void an invoice. */
  async void(id: string, options?: RequestOptions): Promise<Invoice> {
    const response = await this._client.post<Invoice>(
      `/invoices/${id}/void`,
      undefined,
      options,
    );
    return response.data;
  }

  /** Get the PDF download URL for an invoice. */
  async getPdf(id: string): Promise<{ url: string }> {
    const response = await this._client.get<{ url: string }>(
      `/invoices/${id}/pdf`,
    );
    return response.data;
  }
}
