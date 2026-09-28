import { getToken } from './auth';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const authFetch = async (url: string, options: FetchOptions = {}): Promise<Response> => {
  const token = getToken();
  
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  // Ensure JSON content type for requests with a body
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies if needed
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    // Clear auth state on unauthorized
    const userData = localStorage.getItem('user');
    if (userData) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      // You might want to trigger a logout or redirect here
      window.location.href = '/login';
    }
  }

  return response;
};
