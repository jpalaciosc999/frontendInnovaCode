export type Pagination = {
  limit?: number;
  offset?: number;
  count?: number;
};

export type PaginatedResult<T> = {
  rows: T[];
  pagination?: Pagination;
};

export const readPaginatedRows = <T>(payload: unknown): PaginatedResult<T> => {
  if (Array.isArray(payload)) return { rows: payload as T[] };
  if (!payload || typeof payload !== 'object') return { rows: [] };

  const record = payload as Record<string, unknown>;
  const pagination =
    record.pagination && typeof record.pagination === 'object'
      ? (record.pagination as Pagination)
      : undefined;

  return {
    rows: Array.isArray(record.data) ? (record.data as T[]) : [],
    pagination,
  };
};
