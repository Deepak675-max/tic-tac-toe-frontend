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

function errorMessageFromBody(
  json: unknown,
  fallback: string,
): string {
  if (!json || typeof json !== 'object') return fallback;
  const o = json as Record<string, unknown>;
  if (o.success === false && o.message !== undefined) {
    const m = o.message;
    return Array.isArray(m) ? m.join(', ') : String(m);
  }
  if (typeof o.message === 'string') return o.message;
  if (Array.isArray(o.message)) return o.message.join(', ');
  if (typeof o.error === 'string') return o.error;
  return fallback;
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
  const raw = await res.text();
  const trimmed = raw.trim();

  if (!trimmed) {
    if (!res.ok) {
      throw new Error(res.statusText || `Request failed (${res.status})`);
    }
    return undefined as T;
  }

  let json: unknown;
  try {
    json = JSON.parse(trimmed);
  } catch {
    if (!res.ok) {
      throw new Error(trimmed.slice(0, 200) || res.statusText);
    }
    throw new Error('Server returned invalid JSON');
  }

  if (!res.ok || (json as ApiError).success === false) {
    throw new Error(
      errorMessageFromBody(json, res.statusText || 'Request failed'),
    );
  }

  const envelope = json as ApiSuccess<T>;
  if (envelope.success === true && 'data' in envelope) {
    return envelope.data;
  }

  return json as T;
}
