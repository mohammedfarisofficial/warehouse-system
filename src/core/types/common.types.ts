export interface PaginatedResult<T> {
  items: T[];
  nextCursor: number | null;
}

export interface SuccessResult<T = Record<string, unknown>> {
  ok: true;
  data: T;
}

export interface ErrorResult {
  error: string;
  message: string;
}

export type ServiceResult<T = Record<string, unknown>> = SuccessResult<T> | ErrorResult;

export function isErrorResult(result: ServiceResult): result is ErrorResult {
  return 'error' in result;
}
