const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100/api/v1';

interface FetchOptions extends RequestInit {
  token?: string;
  tenantId?: string;
}

export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { token, tenantId, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add auth token from localStorage
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  // Add tenant ID
  const tenant = tenantId || (typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null);
  if (tenant) {
    headers['x-tenant-id'] = tenant;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `API error: ${response.status}`);
  }

  return data;
}

// Auth helpers
export const authApi = {
  register: (body: { email: string; password: string; fullName: string; phone?: string }) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  me: () => apiFetch('/auth/me'),

  refreshToken: (refreshToken: string) =>
    apiFetch('/auth/refresh-token', { method: 'POST', body: JSON.stringify({ refreshToken }) }),
};

// Tenants helpers
export const tenantsApi = {
  registerProperty: (body: any) =>
    apiFetch('/tenants/register-property', { method: 'POST', body: JSON.stringify(body) }),

  myProperties: () => apiFetch('/tenants/my-properties'),
};

// Dashboard helpers
export const dashboardApi = {
  get: () => apiFetch('/dashboard'),
};

// Rooms helpers
export const roomsApi = {
  getFloors: () => apiFetch('/rooms/floors'),
  getRoomTypes: () => apiFetch('/rooms/types'),
  getRooms: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/rooms${query}`);
  },
  checkAvailability: (checkIn: string, checkOut: string) =>
    apiFetch(`/rooms/availability?checkIn=${checkIn}&checkOut=${checkOut}`),
};

// Bookings helpers
export const bookingsApi = {
  create: (body: any) => apiFetch('/bookings', { method: 'POST', body: JSON.stringify(body) }),
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/bookings${query}`);
  },
  get: (id: string) => apiFetch(`/bookings/${id}`),
  confirm: (id: string) => apiFetch(`/bookings/${id}/confirm`, { method: 'PATCH' }),
  cancel: (id: string, reason?: string) =>
    apiFetch(`/bookings/${id}/cancel`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

// Public helpers (no auth needed)
export const publicApi = {
  properties: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiFetch(`/public/properties${query}`);
  },
  property: (slug: string) => apiFetch(`/public/properties/${slug}`),
  search: (q: string) => apiFetch(`/public/search?q=${encodeURIComponent(q)}`),
};
