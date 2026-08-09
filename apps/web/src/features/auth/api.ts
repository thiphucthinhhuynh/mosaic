import type { PublicUser, SignupInput, LoginInput } from '@mosaic/shared';
import { apiClient, ApiError } from '@/lib/apiClient';

export async function fetchMe(): Promise<PublicUser | null> {
  try {
    return await apiClient<PublicUser>('/api/v1/auth/me');
  } catch (err) {
    // Not being logged in is an expected, common state — not an error to
    // surface to the rest of the app.
    if (err instanceof ApiError && err.status === 401) return null;
    throw err;
  }
}

export function signup(input: SignupInput): Promise<PublicUser> {
  return apiClient<PublicUser>('/api/v1/auth/signup', { method: 'POST', body: input });
}

export function login(input: LoginInput): Promise<PublicUser> {
  return apiClient<PublicUser>('/api/v1/auth/login', { method: 'POST', body: input });
}

export function logout(): Promise<null> {
  return apiClient<null>('/api/v1/auth/logout', { method: 'POST' });
}
