import type { CyncoClient } from '../client.js';
import type {
  BankAccount,
  BankAccountListParams,
  RequestOptions,
} from '../types.js';

export class BankAccounts {
  constructor(private readonly _client: CyncoClient) {}

  /**
   * List active bank accounts for the tenant.
   *
   * The API returns all active accounts in a single response because tenants
   * typically have a small number of financial accounts.
   */
  async list(
    params?: BankAccountListParams,
    options?: RequestOptions,
  ): Promise<BankAccount[]> {
    const response = await this._client.get<BankAccount[]>(
      '/bank-accounts',
      params as Record<string, unknown>,
      options,
    );
    return response.data;
  }

  /** Retrieve a single bank account by ID. */
  async retrieve(id: string, options?: RequestOptions): Promise<BankAccount> {
    const response = await this._client.get<BankAccount>(
      '/bank-accounts',
      { id },
      options,
    );
    return response.data;
  }
}
