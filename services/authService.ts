import { retryAsync } from '../utils/retry';

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  access_token?: string;
  user?: User;
}

export const register = async (
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const response = await retryAsync(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return res;
      },
      { maxRetries: 2, initialDelayMs: 1000, maxDelayMs: 5000 }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return await response.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration error';
    if (message.includes('Failed to fetch') || message.includes('fetch')) {
      throw new Error('Cannot connect to backend server. Is it running?');
    }
    throw new Error(message);
  }
};

export const login = async (
  username: string,
  password: string
): Promise<AuthResponse & { access_token: string }> => {
  try {
    const response = await retryAsync(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return res;
      },
      { maxRetries: 2, initialDelayMs: 1000, maxDelayMs: 5000 }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    if (!data.access_token) {
      throw new Error('No access token received');
    }

    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login error';
    if (message.includes('Failed to fetch') || message.includes('fetch')) {
      throw new Error('Cannot connect to backend server. Is it running?');
    }
    throw new Error(message);
  }
};

export const logout = async (token: string): Promise<void> => {
  try {
    await fetch(`${API_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.warn('Logout API call failed:', error);
  }
};

export const getCurrentUser = async (token: string): Promise<User> => {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch user');
  }
};
