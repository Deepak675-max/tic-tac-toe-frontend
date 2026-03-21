import { API_URL } from '../config';

type ApiSuccess<T> = { success: true; data: T; timestamp: string };
type ApiError = {
  success: false;
  statusCode: number;
  message: string | string[];
  timestamp: string;
};

function getToken(): string | null {
  return localStorage.getItem('token');
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = { auth: true },
): Promise<T> {
  const headers = new Headers(init.headers);
  if (
    init.body !== undefined &&
    !(init.body instanceof FormData) &&
    !headers.has('Content-Type')
  ) {
    headers.set('Content-Type', 'application/json');
  }
  if (options.auth !== false) {
    const token = getToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  const json = (await res.json()) as ApiSuccess<T> | ApiError;

  if (!res.ok || json.success === false) {
    const err = json as ApiError;
    const msg = Array.isArray(err.message)
      ? err.message.join(', ')
      : err.message;
    throw new Error(msg || res.statusText);
  }

  return (json as ApiSuccess<T>).data;
}
