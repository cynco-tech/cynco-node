import type { CyncoClient } from '../client.js';
import { Page, PagePromise } from '../pagination.js';
import type {
  Item,
  ItemListParams,
  ItemCreateInput,
  ItemUpdateInput,
  PaginatedResponse,
  RequestOptions,
} from '../types.js';

export class Items {
  constructor(private readonly _client: CyncoClient) {}

  /**
   * List items (products and services) with pagination.
   *
   * ```ts
   * for await (const item of cynco.items.list({ type: 'service' })) {
   *   console.log(item.name);
   * }
   * ```
   */
  list(params?: ItemListParams): PagePromise<Item> {
    const fetchPage = async (
      p: ItemListParams,
    ): Promise<PaginatedResponse<Item>> => {
      return this._client.getList<Item>(
        '/items',
        p as Record<string, unknown>,
      );
    };

    return new PagePromise(
      fetchPage(params ?? {}).then(
        (response) => new Page(response, fetchPage, params ?? {}),
      ),
    );
  }

  /** Retrieve a single item by ID. */
  async retrieve(id: string): Promise<Item> {
    const response = await this._client.get<Item>(`/items/${id}`);
    return response.data;
  }

  /** Create a new item. */
  async create(
    data: ItemCreateInput,
    options?: RequestOptions,
  ): Promise<Item> {
    const response = await this._client.post<Item>('/items', data, options);
    return response.data;
  }

  /** Update an existing item. */
  async update(
    id: string,
    data: ItemUpdateInput,
    options?: RequestOptions,
  ): Promise<Item> {
    const response = await this._client.patch<Item>(
      `/items/${id}`,
      data,
      options,
    );
    return response.data;
  }

  /** Delete an item. Items referenced by invoices or bills cannot be deleted. */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this._client.delete(`/items/${id}`, options);
  }
}
