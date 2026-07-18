import { ResultStatus } from '../enums/ResultStatus';

/** A generic result wrapper for operations that can succeed or fail. */
export interface Result<T = void> {
  status: ResultStatus;
  data?: T;
  error?: ErrorInfo;
}

/** Paginated result for list queries. */
export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Structured error information. */
export interface ErrorInfo {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}
