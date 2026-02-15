import { signal, computed } from '@preact/signals';
import { api } from '../api/client.js';

interface User {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  name: string | null;
}

export const user = signal<User | null>(null);
export const authLoading = signal(true);
export const isAdmin = computed(() => user.value?.role === 'ADMIN');
export const isLoggedIn = computed(() => user.value !== null);

export async function fetchMe(): Promise<void> {
  authLoading.value = true;
  try {
    const data = await api.get<{ user: User }>('/auth/me');
    user.value = data.user;
  } catch {
    user.value = null;
  } finally {
    authLoading.value = false;
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    user.value = null;
    window.location.href = '/login';
  }
}
