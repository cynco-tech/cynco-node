import type {
  ListParams,
  PaginatedResponse,
  CursorPaginatedResponse,
} from './types.js';

/**
 * A paginated list that doubles as an async iterator for auto-pagination.
 *
 * Standard usage (single page):
 * ```ts
 * const page = await cynco.invoices.list({ limit: 20 });
 * console.log(page.data);           // Invoice[]
 * console.log(page.pagination);     // { total, limit, offset, hasMore }
 * ```
 *
 * Auto-pagination (all pages):
 * ```ts
 * for await (const invoice of cynco.invoices.list({ limit: 50 })) {
 *   console.log(invoice.id);
 * }
 * ```
 */
export class Page<T> implements AsyncIterable<T> {
  readonly data: T[];
  readonly pagination: PaginatedResponse<T>['pagination'];
  readonly links?: PaginatedResponse<T>['links'];
  readonly meta?: PaginatedResponse<T>['meta'];

  private readonly _fetchPage: (
    params: ListParams,
  ) => Promise<PaginatedResponse<T>>;
  private readonly _params: ListParams;

  constructor(
    response: PaginatedResponse<T>,
    fetchPage: (params: ListParams) => Promise<PaginatedResponse<T>>,
    params: ListParams,
  ) {
    this.data = response.data;
    this.pagination = response.pagination;
    this.links = response.links;
    this.meta = response.meta;
    this._fetchPage = fetchPage;
    this._params = params;
  }

  /** Whether there are more pages after this one. */
  get hasMore(): boolean {
    return this.pagination.hasMore;
  }

  /** Fetch the next page. Returns null if there are no more pages. */
  async nextPage(): Promise<Page<T> | null> {
    if (!this.hasMore) {
      return null;
    }

    const nextOffset = this.pagination.offset + this.pagination.limit;
    const nextParams: ListParams = {
      ...this._params,
      offset: nextOffset,
    };

    const response = await this._fetchPage(nextParams);
    return new Page(response, this._fetchPage, nextParams);
  }

  /** Iterate over all items across all pages. */
  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let page: Page<T> | null = this;

    while (page) {
      for (const item of page.data) {
        yield item;
      }
      page = await page.nextPage();
    }
  }
}

/**
 * A cursor-based paginated list with async iteration support.
 */
export class CursorPage<T> implements AsyncIterable<T> {
  readonly data: T[];
  readonly pagination: CursorPaginatedResponse<T>['pagination'];
  readonly links?: CursorPaginatedResponse<T>['links'];
  readonly meta?: CursorPaginatedResponse<T>['meta'];

  private readonly _fetchPage: (
    params: ListParams,
  ) => Promise<CursorPaginatedResponse<T>>;
  private readonly _params: ListParams;

  constructor(
    response: CursorPaginatedResponse<T>,
    fetchPage: (params: ListParams) => Promise<CursorPaginatedResponse<T>>,
    params: ListParams,
  ) {
    this.data = response.data;
    this.pagination = response.pagination;
    this.links = response.links;
    this.meta = response.meta;
    this._fetchPage = fetchPage;
    this._params = params;
  }

  get hasMore(): boolean {
    return this.pagination.hasMore;
  }

  async nextPage(): Promise<CursorPage<T> | null> {
    if (!this.hasMore || !this.pagination.nextCursor) {
      return null;
    }

    const nextParams: ListParams = {
      ...this._params,
      cursor: this.pagination.nextCursor,
    };

    const response = await this._fetchPage(nextParams);
    return new CursorPage(response, this._fetchPage, nextParams);
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let page: CursorPage<T> | null = this;

    while (page) {
      for (const item of page.data) {
        yield item;
      }
      page = await page.nextPage();
    }
  }
}
