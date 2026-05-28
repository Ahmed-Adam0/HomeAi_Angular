export type ApiEnvelope<T> = T | { data: T } | { result: T } | { items: T } | { value: T };

/**
 * Robustly and recursively unwraps standard backend API wrapper layers.
 */
export function unwrap<T>(value: any): T {
  if (value && typeof value === 'object') {
    const keys = ['data', 'result', 'items', 'value'];
    for (const key of keys) {
      if (key in value) {
        return unwrap(value[key]);
      }
    }
  }
  return value as T;
}
