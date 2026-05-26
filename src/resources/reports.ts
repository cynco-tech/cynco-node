import type { CyncoClient } from '../client.js';
import type {
  BalanceSheet,
  PeriodReportParams,
  ProfitLoss,
  TrialBalance,
  TrialBalanceParams,
} from '../types.js';

export class Reports {
  constructor(private readonly _client: CyncoClient) {}

  /** Generate a balance sheet report. */
  async balanceSheet(
    params: PeriodReportParams,
  ): Promise<BalanceSheet> {
    const response = await this._client.get<BalanceSheet>(
      '/reports/balance-sheet',
      { ...params } as unknown as Record<string, unknown>,
    );
    return response.data;
  }

  /** Generate a profit and loss (income statement) report. */
  async profitLoss(params: PeriodReportParams): Promise<ProfitLoss> {
    const response = await this._client.get<ProfitLoss>(
      '/reports/profit-loss',
      { ...params } as unknown as Record<string, unknown>,
    );
    return response.data;
  }

  /** Alias for `profitLoss`. */
  async profitAndLoss(params: PeriodReportParams): Promise<ProfitLoss> {
    return this.profitLoss(params);
  }

  /** Generate a trial balance report. */
  async trialBalance(params: TrialBalanceParams): Promise<TrialBalance> {
    const response = await this._client.get<TrialBalance>(
      '/reports/trial-balance',
      { ...params } as unknown as Record<string, unknown>,
    );
    return response.data;
  }
}
