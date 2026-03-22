import type { CyncoClient } from '../client.js';
import { Page } from '../pagination.js';
import type {
  JournalEntry,
  JournalEntryListParams,
  JournalEntryCreateInput,
  JournalEntryUpdateInput,
  PaginatedResponse,
  RequestOptions,
} from '../types.js';

export class JournalEntries {
  constructor(private readonly _client: CyncoClient) {}

  /**
   * List journal entries with pagination.
   *
   * ```ts
   * for await (const entry of cynco.journalEntries.list({ status: 'posted' })) {
   *   console.log(entry.entryNumber);
   * }
   * ```
   */
  async list(params?: JournalEntryListParams): Promise<Page<JournalEntry>> {
    const fetchPage = async (
      p: JournalEntryListParams,
    ): Promise<PaginatedResponse<JournalEntry>> => {
      return this._client.getList<JournalEntry>(
        '/journal-entries',
        p as Record<string, unknown>,
      );
    };

    const response = await fetchPage(params ?? {});
    return new Page(response, fetchPage, params ?? {});
  }

  /** Retrieve a single journal entry by ID. */
  async retrieve(id: string): Promise<JournalEntry> {
    const response = await this._client.get<JournalEntry>(
      `/journal-entries/${id}`,
    );
    return response.data;
  }

  /** Create a new journal entry. */
  async create(
    data: JournalEntryCreateInput,
    options?: RequestOptions,
  ): Promise<JournalEntry> {
    const response = await this._client.post<JournalEntry>(
      '/journal-entries',
      data,
      options,
    );
    return response.data;
  }

  /** Update a draft journal entry. */
  async update(
    id: string,
    data: JournalEntryUpdateInput,
    options?: RequestOptions,
  ): Promise<JournalEntry> {
    const response = await this._client.patch<JournalEntry>(
      `/journal-entries/${id}`,
      data,
      options,
    );
    return response.data;
  }

  /** Delete a draft journal entry. */
  async delete(id: string, options?: RequestOptions): Promise<void> {
    await this._client.delete(`/journal-entries/${id}`, options);
  }

  /** Post a draft journal entry to the ledger. */
  async post(id: string, options?: RequestOptions): Promise<JournalEntry> {
    const response = await this._client.post<JournalEntry>(
      `/journal-entries/${id}/post`,
      undefined,
      options,
    );
    return response.data;
  }

  /** Void a posted journal entry. */
  async void(id: string, options?: RequestOptions): Promise<JournalEntry> {
    const response = await this._client.post<JournalEntry>(
      `/journal-entries/${id}/void`,
      undefined,
      options,
    );
    return response.data;
  }
}
