import type { CyncoClient } from '../client.js';
import type {
  ReportParams,
  BalanceSheetReport,
  ProfitAndLossReport,
  TrialBalanceReport,
} from '../types.js';

export class Reports {
  constructor(private readonly _client: CyncoClient) {}

  /** Generate a balance sheet report. */
  async balanceSheet(
    params: Pick<ReportParams, 'endDate' | 'currency' | 'comparePrevious'>,
  ): Promise<BalanceSheetReport> {
    const response = await this._client.get<BalanceSheetReport>(
      '/reports/balance-sheet',
      { ...params } as unknown as Record<string, unknown>,
    );
    return response.data;
  }

  /** Generate a profit and loss (income statement) report. */
  async profitAndLoss(params: ReportParams): Promise<ProfitAndLossReport> {
    const response = await this._client.get<ProfitAndLossReport>(
      '/reports/profit-and-loss',
      { ...params } as unknown as Record<string, unknown>,
    );
    return response.data;
  }

  /** Generate a trial balance report. */
  async trialBalance(
    params: Pick<ReportParams, 'endDate' | 'currency'>,
  ): Promise<TrialBalanceReport> {
    const response = await this._client.get<TrialBalanceReport>(
      '/reports/trial-balance',
      { ...params } as unknown as Record<string, unknown>,
    );
    return response.data;
  }
}
