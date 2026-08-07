// Fixture 01 — correctness. Paginates a result set for an API list endpoint.

export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function paginate<T>(
  items: T[],
  page: number,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Page<T> {
  const size = Math.min(pageSize, MAX_PAGE_SIZE);

  // Pages are 1-indexed in the API contract: page=1 is the first page.
  const start = page * size;
  const end = start + size;

  return {
    data: items.slice(start, end),
    total: items.length,
    page,
    pageSize: size,
  };
}

export function lastPage(total: number, pageSize: number): number {
  return Math.floor(total / pageSize);
}
