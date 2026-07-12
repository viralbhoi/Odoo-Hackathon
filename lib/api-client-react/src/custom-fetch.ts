export type CustomFetchOptions = RequestInit & {
  responseType?: "json" | "text" | "blob" | "auto";
};

export type ErrorType<T = unknown> = ApiError<T>;

export type BodyType<T> = T;

export type AuthTokenGetter = () => Promise<string | null> | string | null;

export class ApiError<T = unknown> extends Error {
  readonly status: number;
  readonly data: T | null;
  constructor(status: number, message: string, data: T | null) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export const customFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = localStorage.getItem('transitops_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('transitops_token');
    localStorage.removeItem('transitops_user');
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw Object.assign(new Error(errorData.error || 'Request failed'), { status: response.status, data: errorData });
  }
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) return response.text() as unknown as T;
  return response.json();
};
