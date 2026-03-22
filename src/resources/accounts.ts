import type { CyncoClient } from '../client.js';
import { Page, PagePromise } from '../pagination.js';
import type {
  Account,
  AccountListParams,
  AccountCreateInput,
  AccountUpdateInput,
  PaginatedResponse,
  RequestOptions,
} from '../types.js';

export class Accounts {
  constructor(private readonly _client: CyncoClient) {}

  /**
   * List chart of accounts with pagination.
   *
   * ```ts
   * for await (const account of cynco.accounts.list({ type: 'revenue' })) {
   *   console.log(`${account.code} — ${account.name}`);
   * }
   * ```
   */
  list(params?: AccountListParams): PagePromise<Account> {
    const fetchPage = async (
      p: AccountListParams,
    ): Promise<PaginatedResponse<Account>> => {
      return this._client.getList<Account>(
        '/accounts',
        p as Record<string, unknown>,
      );
    };

    return new PagePromise(
      fetchPage(params ?? {}).then(
        (response) => new Page(response, fetchPage, params ?? {}),
      ),
    );
  }

  /** Retrieve a single account by ID. */
  async retrieve(id: string): Promise<Account> {
    const response = await this._client.get<Account>(`/accounts/${id}`);
    return response.data;
  }

  /** Create a new account. */
  async create(
    data: AccountCreateInput,
    options?: RequestOptions,
  ): Promise<Account> {
    const response = await this._client.post<Account>(
      '/accounts',
      data,
      options,
    );
    return response.data;
  }

  /** Update an existing account. */
  async update(
    id: string,
    data: AccountUpdateInput,
    options?: RequestOptions,
  ): Promise<Account> {
    const response = await this._client.patch<Account>(
      `/accounts/${id}`,
      data,
      options,
    );
    return response.data;
  }

  /** Delete an account. Only unused accounts can be deleted. */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this._client.delete(`/accounts/${id}`, options);
  }
}
