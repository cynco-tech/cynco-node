import type { CyncoClient } from '../client.js';
import { Page, PagePromise } from '../pagination.js';
import type {
  JournalEntry,
  JournalEntryListParams,
  JournalEntryCreateInput,
  JournalEntryUpdateInput,
  BatchRequest,
  BatchResponse,
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
  list(params?: JournalEntryListParams): PagePromise<JournalEntry> {
    const fetchPage = async (
      p: JournalEntryListParams,
    ): Promise<PaginatedResponse<JournalEntry>> => {
      return this._client.getList<JournalEntry>(
        '/journal-entries',
        p as Record<string, unknown>,
      );
    };

    return new PagePromise(
      fetchPage(params ?? {}).then(
        (response) => new Page(response, fetchPage, params ?? {}),
      ),
    );
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

  /** Execute up to 100 journal entry create operations. */
  async batch(
    data: BatchRequest<JournalEntryCreateInput>,
    options?: RequestOptions,
  ): Promise<BatchResponse<JournalEntry>> {
    const response = await this._client.post<BatchResponse<JournalEntry>>(
      '/journal-entries/batch',
      data,
      options,
    );
    return response.data;
  }
}
