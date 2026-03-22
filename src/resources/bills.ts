import type { CyncoClient } from '../client.js';
import { Page } from '../pagination.js';
import type {
  Bill,
  BillListParams,
  BillCreateInput,
  BillUpdateInput,
  PaginatedResponse,
  RequestOptions,
} from '../types.js';

export class Bills {
  constructor(private readonly _client: CyncoClient) {}

  /**
   * List bills with pagination.
   *
   * ```ts
   * for await (const bill of cynco.bills.list({ limit: 50 })) {
   *   console.log(bill.billNumber);
   * }
   * ```
   */
  async list(params?: BillListParams): Promise<Page<Bill>> {
    const fetchPage = async (
      p: BillListParams,
    ): Promise<PaginatedResponse<Bill>> => {
      return this._client.getList<Bill>(
        '/bills',
        p as Record<string, unknown>,
      );
    };

    const response = await fetchPage(params ?? {});
    return new Page(response, fetchPage, params ?? {});
  }

  /** Retrieve a single bill by ID. */
  async retrieve(id: string): Promise<Bill> {
    const response = await this._client.get<Bill>(`/bills/${id}`);
    return response.data;
  }

  /** Create a new bill. */
  async create(
    data: BillCreateInput,
    options?: RequestOptions,
  ): Promise<Bill> {
    const response = await this._client.post<Bill>('/bills', data, options);
    return response.data;
  }

  /** Update an existing bill. */
  async update(
    id: string,
    data: BillUpdateInput,
    options?: RequestOptions,
  ): Promise<Bill> {
    const response = await this._client.patch<Bill>(
      `/bills/${id}`,
      data,
      options,
    );
    return response.data;
  }

  /** Delete a bill. Only draft bills can be deleted. */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this._client.delete(`/bills/${id}`, options);
  }

  /** Mark a bill as paid. */
  async markPaid(
    id: string,
    data?: { paidDate?: string; paymentMethod?: string },
    options?: RequestOptions,
  ): Promise<Bill> {
    const response = await this._client.post<Bill>(
      `/bills/${id}/mark-paid`,
      data,
      options,
    );
    return response.data;
  }

  /** Void a bill. */
  async void(id: string, options?: RequestOptions): Promise<Bill> {
    const response = await this._client.post<Bill>(
      `/bills/${id}/void`,
      undefined,
      options,
    );
    return response.data;
  }
}
