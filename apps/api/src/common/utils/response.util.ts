export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export function ok<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return { data, ...(meta !== undefined ? { meta } : {}) };
}
