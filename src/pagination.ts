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
  readonly success: true = true;
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
  readonly success: true = true;
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

/**
 * A promise that resolves to a `Page<T>` but also implements `AsyncIterable<T>`,
 * so it can be used directly in `for await...of` without an intermediate `await`:
 *
 * ```ts
 * // Both work:
 * const page = await cynco.invoices.list();   // Page<Invoice>
 * for await (const inv of cynco.invoices.list()) { ... }
 * ```
 */
export class PagePromise<T>
  implements PromiseLike<Page<T>>, AsyncIterable<T>
{
  private readonly _promise: Promise<Page<T>>;

  constructor(promise: Promise<Page<T>>) {
    this._promise = promise;
  }

  /** Satisfy PromiseLike so `await` works. */
  then<TResult1 = Page<T>, TResult2 = never>(
    onfulfilled?:
      | ((value: Page<T>) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined,
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onfulfilled, onrejected);
  }

  /** Satisfy Promise-like `catch`. */
  catch<TResult = never>(
    onrejected?:
      | ((reason: unknown) => TResult | PromiseLike<TResult>)
      | null
      | undefined,
  ): Promise<Page<T> | TResult> {
    return this._promise.catch(onrejected);
  }

  /** Satisfy Promise-like `finally`. */
  finally(onfinally?: (() => void) | null | undefined): Promise<Page<T>> {
    return this._promise.finally(onfinally);
  }

  /**
   * Iterate over all items across all pages.
   * Fetches the first page lazily, then auto-paginates.
   */
  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    const page = await this._promise;
    yield* page;
  }
}

/**
 * A promise that resolves to a `CursorPage<T>` but also implements `AsyncIterable<T>`.
 */
export class CursorPagePromise<T>
  implements PromiseLike<CursorPage<T>>, AsyncIterable<T>
{
  private readonly _promise: Promise<CursorPage<T>>;

  constructor(promise: Promise<CursorPage<T>>) {
    this._promise = promise;
  }

  then<TResult1 = CursorPage<T>, TResult2 = never>(
    onfulfilled?:
      | ((value: CursorPage<T>) => TResult1 | PromiseLike<TResult1>)
      | null
      | undefined,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null
      | undefined,
  ): Promise<TResult1 | TResult2> {
    return this._promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?:
      | ((reason: unknown) => TResult | PromiseLike<TResult>)
      | null
      | undefined,
  ): Promise<CursorPage<T> | TResult> {
    return this._promise.catch(onrejected);
  }

  finally(
    onfinally?: (() => void) | null | undefined,
  ): Promise<CursorPage<T>> {
    return this._promise.finally(onfinally);
  }

  async *[Symbol.asyncIterator](): AsyncIterator<T> {
    const page = await this._promise;
    yield* page;
  }
}
