import type { CyncoClient } from '../client.js';
import { Page, PagePromise } from '../pagination.js';
import type {
  GeneralLedgerEntry,
  GeneralLedgerEntryListParams,
  PaginatedResponse,
} from '../types.js';

export class GeneralLedger {
  constructor(private readonly _client: CyncoClient) {}

  /** List posted general ledger entries with offset pagination. */
  list(
    params?: GeneralLedgerEntryListParams,
  ): PagePromise<GeneralLedgerEntry> {
    const fetchPage = async (
      p: GeneralLedgerEntryListParams,
    ): Promise<PaginatedResponse<GeneralLedgerEntry>> => {
      return this._client.getList<GeneralLedgerEntry>(
        '/general-ledger',
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
