import { describe, it, expect, vi } from 'vitest';
import { Page, CursorPage, PagePromise } from '../src/pagination.js';
import type { PaginatedResponse, CursorPaginatedResponse } from '../src/types.js';

describe('Page', () => {
  function makePage(
    data: number[],
    offset: number,
    total: number,
    limit: number,
    fetchPage: (params: Record<string, unknown>) => Promise<PaginatedResponse<number>>,
  ): Page<number> {
    const response: PaginatedResponse<number> = {
      success: true,
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + data.length < total,
      },
    };
    return new Page(response, fetchPage, { limit, offset });
  }

  it('exposes data and pagination', () => {
    const fetchPage = vi.fn();
    const page = makePage([1, 2, 3], 0, 10, 3, fetchPage);

    expect(page.data).toEqual([1, 2, 3]);
    expect(page.pagination.total).toBe(10);
    expect(page.pagination.limit).toBe(3);
    expect(page.pagination.offset).toBe(0);
    expect(page.hasMore).toBe(true);
  });

  it('returns null for nextPage when no more pages', async () => {
    const fetchPage = vi.fn();
    const page = makePage([1, 2, 3], 0, 3, 3, fetchPage);

    expect(page.hasMore).toBe(false);
    const next = await page.nextPage();
    expect(next).toBeNull();
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it('fetches next page with correct offset', async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      success: true,
      data: [4, 5, 6],
      pagination: { total: 10, limit: 3, offset: 3, hasMore: true },
    });

    const page = makePage([1, 2, 3], 0, 10, 3, fetchPage);
    const next = await page.nextPage();

    expect(fetchPage).toHaveBeenCalledWith({ limit: 3, offset: 3 });
    expect(next).not.toBeNull();
    expect(next!.data).toEqual([4, 5, 6]);
  });

  it('supports async iteration across all pages', async () => {
    let callCount = 0;
    const fetchPage = vi.fn().mockImplementation((params: Record<string, unknown>) => {
      callCount++;
      const offset = (params.offset as number) ?? 0;

      if (offset === 0) {
        return Promise.resolve({
          success: true,
          data: [1, 2, 3],
          pagination: { total: 9, limit: 3, offset: 0, hasMore: true },
        });
      } else if (offset === 3) {
        return Promise.resolve({
          success: true,
          data: [4, 5, 6],
          pagination: { total: 9, limit: 3, offset: 3, hasMore: true },
        });
      } else {
        return Promise.resolve({
          success: true,
          data: [7, 8, 9],
          pagination: { total: 9, limit: 3, offset: 6, hasMore: false },
        });
      }
    });

    // Create first page manually
    const firstResponse = await fetchPage({ limit: 3, offset: 0 });
    const page = new Page(firstResponse, fetchPage, { limit: 3, offset: 0 });

    const allItems: number[] = [];
    for await (const item of page) {
      allItems.push(item);
    }

    expect(allItems).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('handles single-page result in async iteration', async () => {
    const fetchPage = vi.fn();
    const page = makePage([1, 2], 0, 2, 10, fetchPage);

    const allItems: number[] = [];
    for await (const item of page) {
      allItems.push(item);
    }

    expect(allItems).toEqual([1, 2]);
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it('handles empty page', async () => {
    const fetchPage = vi.fn();
    const page = makePage([], 0, 0, 10, fetchPage);

    const allItems: number[] = [];
    for await (const item of page) {
      allItems.push(item);
    }

    expect(allItems).toEqual([]);
  });

  it('exposes success field', () => {
    const fetchPage = vi.fn();
    const page = makePage([1, 2, 3], 0, 10, 3, fetchPage);

    expect(page.success).toBe(true);
  });
});

describe('CursorPage', () => {
  it('iterates over cursor-paginated results', async () => {
    const fetchPage = vi.fn().mockImplementation((params: Record<string, unknown>) => {
      const cursor = params.cursor as string | undefined;

      if (!cursor) {
        return Promise.resolve({
          success: true,
          data: ['a', 'b'],
          pagination: { limit: 2, hasMore: true, nextCursor: 'cur_2' },
        });
      } else if (cursor === 'cur_2') {
        return Promise.resolve({
          success: true,
          data: ['c', 'd'],
          pagination: { limit: 2, hasMore: true, nextCursor: 'cur_3' },
        });
      } else {
        return Promise.resolve({
          success: true,
          data: ['e'],
          pagination: { limit: 2, hasMore: false, nextCursor: null },
        });
      }
    });

    const firstResponse: CursorPaginatedResponse<string> = await fetchPage({
      limit: 2,
    });
    const page = new CursorPage(firstResponse, fetchPage, { limit: 2 });

    const allItems: string[] = [];
    for await (const item of page) {
      allItems.push(item);
    }

    expect(allItems).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('exposes success field', async () => {
    const fetchPage = vi.fn().mockResolvedValue({
      success: true,
      data: ['a'],
      pagination: { limit: 2, hasMore: false, nextCursor: null },
    });

    const firstResponse: CursorPaginatedResponse<string> = await fetchPage({
      limit: 2,
    });
    const page = new CursorPage(firstResponse, fetchPage, { limit: 2 });

    expect(page.success).toBe(true);
  });
});

describe('PagePromise', () => {
  function makePagePromise(
    pages: number[][],
    limit: number,
  ): PagePromise<number> {
    const total = pages.reduce((sum, p) => sum + p.length, 0);
    let callIdx = 0;

    const fetchPage = vi.fn().mockImplementation(() => {
      const data = pages[callIdx] ?? [];
      const offset = pages.slice(0, callIdx).reduce((s, p) => s + p.length, 0);
      callIdx++;
      return Promise.resolve({
        success: true,
        data,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + data.length < total,
        },
      } satisfies PaginatedResponse<number>);
    });

    return new PagePromise(
      fetchPage({ limit, offset: 0 }).then(
        (response: PaginatedResponse<number>) =>
          new Page(response, fetchPage, { limit, offset: 0 }),
      ),
    );
  }

  it('resolves to a Page when awaited', async () => {
    const pp = makePagePromise([[1, 2, 3]], 10);
    const page = await pp;

    expect(page).toBeInstanceOf(Page);
    expect(page.data).toEqual([1, 2, 3]);
    expect(page.pagination.total).toBe(3);
    expect(page.success).toBe(true);
  });

  it('supports for-await-of without intermediate await', async () => {
    const pp = makePagePromise([[1, 2], [3, 4], [5]], 2);

    const allItems: number[] = [];
    for await (const item of pp) {
      allItems.push(item);
    }

    expect(allItems).toEqual([1, 2, 3, 4, 5]);
  });

  it('supports .then() chaining', async () => {
    const pp = makePagePromise([[10, 20]], 10);
    const data = await pp.then((page) => page.data);

    expect(data).toEqual([10, 20]);
  });

  it('supports .catch() on errors', async () => {
    const failingPromise = new PagePromise<number>(
      Promise.reject(new Error('network error')),
    );

    const error = await failingPromise.catch((e: Error) => e);
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('network error');
  });

  it('handles empty results', async () => {
    const pp = makePagePromise([[]], 10);

    const allItems: number[] = [];
    for await (const item of pp) {
      allItems.push(item);
    }

    expect(allItems).toEqual([]);
  });
});
