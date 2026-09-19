export type PageResult<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type PageRequest = {
  page?: number;
  pageSize?: number;
};

export function addPageParams(params: URLSearchParams, request: PageRequest): void {
  if (request.page) params.set("page", String(request.page));
  if (request.pageSize) params.set("page_size", String(request.pageSize));
}
