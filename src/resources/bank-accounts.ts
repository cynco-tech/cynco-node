import type { CyncoClient } from '../client.js';
import { Page, PagePromise } from '../pagination.js';
import type {
  BankAccount,
  BankAccountListParams,
  BankAccountCreateInput,
  BankAccountUpdateInput,
  BankTransaction,
  BankTransactionListParams,
  PaginatedResponse,
  RequestOptions,
} from '../types.js';

export class BankAccounts {
  constructor(private readonly _client: CyncoClient) {}

  /**
   * List bank accounts with pagination.
   *
   * ```ts
   * for await (const account of cynco.bankAccounts.list()) {
   *   console.log(`${account.bankName} — ${account.name}`);
   * }
   * ```
   */
  list(params?: BankAccountListParams): PagePromise<BankAccount> {
    const fetchPage = async (
      p: BankAccountListParams,
    ): Promise<PaginatedResponse<BankAccount>> => {
      return this._client.getList<BankAccount>(
        '/bank-accounts',
        p as Record<string, unknown>,
      );
    };

    return new PagePromise(
      fetchPage(params ?? {}).then(
        (response) => new Page(response, fetchPage, params ?? {}),
      ),
    );
  }

  /** Retrieve a single bank account by ID. */
  async retrieve(id: string): Promise<BankAccount> {
    const response = await this._client.get<BankAccount>(
      `/bank-accounts/${id}`,
    );
    return response.data;
  }

  /** Create a new bank account. */
  async create(
    data: BankAccountCreateInput,
    options?: RequestOptions,
  ): Promise<BankAccount> {
    const response = await this._client.post<BankAccount>(
      '/bank-accounts',
      data,
      options,
    );
    return response.data;
  }

  /** Update an existing bank account. */
  async update(
    id: string,
    data: BankAccountUpdateInput,
    options?: RequestOptions,
  ): Promise<BankAccount> {
    const response = await this._client.patch<BankAccount>(
      `/bank-accounts/${id}`,
      data,
      options,
    );
    return response.data;
  }

  /** Delete a bank account. */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this._client.delete(`/bank-accounts/${id}`, options);
  }

  /**
   * List transactions for a specific bank account.
   *
   * ```ts
   * for await (const txn of cynco.bankAccounts.listTransactions('ba_123', { status: 'cleared' })) {
   *   console.log(`${txn.date} ${txn.description} ${txn.amount}`);
   * }
   * ```
   */
  listTransactions(
    bankAccountId: string,
    params?: BankTransactionListParams,
  ): PagePromise<BankTransaction> {
    const fetchPage = async (
      p: BankTransactionListParams,
    ): Promise<PaginatedResponse<BankTransaction>> => {
      return this._client.getList<BankTransaction>(
        `/bank-accounts/${bankAccountId}/transactions`,
        p as Record<string, unknown>,
      );
    };

    return new PagePromise(
      fetchPage(params ?? {}).then(
        (response) => new Page(response, fetchPage, params ?? {}),
      ),
    );
  }
}
