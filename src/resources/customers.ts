import type { CyncoClient } from '../client.js';
import { Page, PagePromise } from '../pagination.js';
import type {
  Customer,
  CustomerListParams,
  CustomerCreateInput,
  CustomerUpdateInput,
  PaginatedResponse,
  RequestOptions,
} from '../types.js';

export class Customers {
  constructor(private readonly _client: CyncoClient) {}

  /**
   * List customers with pagination.
   *
   * ```ts
   * for await (const customer of cynco.customers.list({ limit: 50 })) {
   *   console.log(customer.name);
   * }
   * ```
   */
  list(params?: CustomerListParams): PagePromise<Customer> {
    const fetchPage = async (
      p: CustomerListParams,
    ): Promise<PaginatedResponse<Customer>> => {
      return this._client.getList<Customer>(
        '/customers',
        p as Record<string, unknown>,
      );
    };

    return new PagePromise(
      fetchPage(params ?? {}).then(
        (response) => new Page(response, fetchPage, params ?? {}),
      ),
    );
  }

  /** Retrieve a single customer by ID. */
  async retrieve(id: string): Promise<Customer> {
    const response = await this._client.get<Customer>(`/customers/${id}`);
    return response.data;
  }

  /** Create a new customer. */
  async create(
    data: CustomerCreateInput,
    options?: RequestOptions,
  ): Promise<Customer> {
    const response = await this._client.post<Customer>(
      '/customers',
      data,
      options,
    );
    return response.data;
  }

  /** Update an existing customer. */
  async update(
    id: string,
    data: CustomerUpdateInput,
    options?: RequestOptions,
  ): Promise<Customer> {
    const response = await this._client.patch<Customer>(
      `/customers/${id}`,
      data,
      options,
    );
    return response.data;
  }

  /** Delete a customer. Only customers with no associated records can be deleted. */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this._client.delete(`/customers/${id}`, options);
  }
}
