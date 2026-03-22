import type { CyncoClient } from '../client.js';
import { Page, PagePromise } from '../pagination.js';
import type {
  Account,
  AccountListParams,
  PaginatedResponse,
} from '../types.js';

export class Accounts {
  constructor(private readonly _client: CyncoClient) {}

  /**
   * List chart of accounts.
   *
   * ```ts
   * const page = await cynco.accounts.list({ account_type: 'revenue' });
   * for (const account of page.data) {
   *   console.log(`${account.accountCode} — ${account.accountName}`);
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
    const response = await this._client.get<Account>(`/accounts?id=${encodeURIComponent(id)}`);
    return response.data;  // accounts uses ?id= since there's no /:id route
  }
}
