import type { CyncoClient } from '../client.js';
import { Page, PagePromise } from '../pagination.js';
import type {
  Vendor,
  VendorListParams,
  VendorCreateInput,
  VendorUpdateInput,
  PaginatedResponse,
  RequestOptions,
} from '../types.js';

export class Vendors {
  constructor(private readonly _client: CyncoClient) {}

  /**
   * List vendors with pagination.
   *
   * ```ts
   * for await (const vendor of cynco.vendors.list({ limit: 50 })) {
   *   console.log(vendor.name);
   * }
   * ```
   */
  list(params?: VendorListParams): PagePromise<Vendor> {
    const fetchPage = async (
      p: VendorListParams,
    ): Promise<PaginatedResponse<Vendor>> => {
      return this._client.getList<Vendor>(
        '/vendors',
        p as Record<string, unknown>,
      );
    };

    return new PagePromise(
      fetchPage(params ?? {}).then(
        (response) => new Page(response, fetchPage, params ?? {}),
      ),
    );
  }

  /** Retrieve a single vendor by ID. */
  async retrieve(id: string): Promise<Vendor> {
    const response = await this._client.get<Vendor>(`/vendors/${id}`);
    return response.data;
  }

  /** Create a new vendor. */
  async create(
    data: VendorCreateInput,
    options?: RequestOptions,
  ): Promise<Vendor> {
    const response = await this._client.post<Vendor>(
      '/vendors',
      data,
      options,
    );
    return response.data;
  }

  /** Update an existing vendor. */
  async update(
    id: string,
    data: VendorUpdateInput,
    options?: RequestOptions,
  ): Promise<Vendor> {
    const response = await this._client.patch<Vendor>(
      `/vendors/${id}`,
      data,
      options,
    );
    return response.data;
  }

  /** Delete a vendor. Only vendors with no associated records can be deleted. */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this._client.delete(`/vendors/${id}`, options);
  }
}
