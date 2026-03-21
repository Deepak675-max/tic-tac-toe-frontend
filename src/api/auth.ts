import type { AuthPayload } from '../types';
import { apiRequest } from './http';

export async function register(username: string): Promise<AuthPayload> {
  return apiRequest<AuthPayload>(
    '/auth/register',
    {
      method: 'POST',
      body: JSON.stringify({ username }),
    },
    { auth: false },
  );
}

export async function login(username: string): Promise<AuthPayload> {
  return apiRequest<AuthPayload>(
    '/auth/login',
    {
      method: 'POST',
      body: JSON.stringify({ username }),
    },
    { auth: false },
  );
}
