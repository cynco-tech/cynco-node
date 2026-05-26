import type { CyncoClient } from '../client.js';
import { Page, PagePromise } from '../pagination.js';
import type {
  BatchRequest,
  BatchResponse,
  Invoice,
  InvoiceListParams,
  InvoiceUpdateInput,
  PaginatedResponse,
  RequestOptions,
} from '../types.js';

export class Invoices {
  constructor(private readonly _client: CyncoClient) {}

  /**
   * List invoices with pagination.
   *
   * Returns a `PagePromise` that can be awaited for a single page or used
   * directly as an async iterator for auto-pagination:
   * ```ts
   * // Single page
   * const page = await cynco.invoices.list({ limit: 20 });
   * console.log(page.data);
   *
   * // Auto-pagination
   * for await (const invoice of cynco.invoices.list({ limit: 50 })) {
   *   console.log(invoice.id);
   * }
   * ```
   */
  list(params?: InvoiceListParams): PagePromise<Invoice> {
    const fetchPage = async (
      p: InvoiceListParams,
    ): Promise<PaginatedResponse<Invoice>> => {
      return this._client.getList<Invoice>('/invoices', p as Record<string, unknown>);
    };

    return new PagePromise(
      fetchPage(params ?? {}).then(
        (response) => new Page(response, fetchPage, params ?? {}),
      ),
    );
  }

  /** Retrieve a single invoice by ID. */
  async retrieve(id: string): Promise<Invoice> {
    const response = await this._client.get<Invoice>(`/invoices/${id}`);
    return response.data;
  }

  /** Update an existing invoice (memo, paymentTerms, dueDate only). */
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

  /** Run batch invoice operations. The v1 API currently supports invoice delete operations. */
  async batch(
    data: BatchRequest<InvoiceUpdateInput>,
    options?: RequestOptions,
  ): Promise<BatchResponse<Invoice>> {
    const response = await this._client.post<BatchResponse<Invoice>>(
      '/invoices/batch',
      data,
      options,
    );
    return response.data;
  }
}
