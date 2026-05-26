import type { CyncoClient } from '../client.js';
import { CursorPage, CursorPagePromise, Page, PagePromise } from '../pagination.js';
import type {
  BankTransaction,
  BankTransactionListParams,
  CursorPaginatedResponse,
  PaginatedResponse,
  RequestOptions,
} from '../types.js';

export class BankTransactions {
  constructor(private readonly _client: CyncoClient) {}

  /**
   * List bank transactions with offset pagination.
   *
   * Pass a `cursor` parameter to use cursor pagination instead.
   */
  list(params?: BankTransactionListParams): PagePromise<BankTransaction> {
    const fetchPage = async (
      p: BankTransactionListParams,
    ): Promise<PaginatedResponse<BankTransaction>> => {
      return this._client.getList<BankTransaction>(
        '/bank-transactions',
        p as Record<string, unknown>,
      );
    };

    return new PagePromise(
      fetchPage(params ?? {}).then(
        (response) => new Page(response, fetchPage, params ?? {}),
      ),
    );
  }

  /** List bank transactions using cursor pagination. */
  listCursor(
    params?: BankTransactionListParams,
    options?: RequestOptions,
  ): CursorPagePromise<BankTransaction> {
    const fetchPage = async (
      p: BankTransactionListParams,
    ): Promise<CursorPaginatedResponse<BankTransaction>> => {
      return this._client.getCursorList<BankTransaction>(
        '/bank-transactions',
        p as Record<string, unknown>,
        options,
      );
    };

    return new CursorPagePromise(
      fetchPage(params ?? {}).then(
        (response) => new CursorPage(response, fetchPage, params ?? {}),
      ),
    );
  }

  /** Retrieve a single bank transaction by ID. */
  async retrieve(
    id: string,
    options?: RequestOptions,
  ): Promise<BankTransaction> {
    const response = await this._client.get<BankTransaction>(
      '/bank-transactions',
      { id },
      options,
    );
    return response.data;
  }
}
