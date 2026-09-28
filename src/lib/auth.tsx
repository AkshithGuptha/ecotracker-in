import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// Types
export type UserRole = 'user' | 'ngo' | 'organizer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  points?: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
  setToken: (token: string) => void;
  clearToken: () => void;
  getUserRole: () => UserRole | null;
  setUserRole: (role: UserRole) => void;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Safe localStorage wrapper
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Error setting localStorage:', error);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = safeLocalStorage.getItem('user');
        const storedToken = safeLocalStorage.getItem('token');
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string, role?: UserRole): Promise<any> => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE || '';
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      if (!data.token) {
        throw new Error('No token received');
      }

      const userRole: UserRole = (data.role || role || 'user') as UserRole;
      const userData = {
        id: data.user?.id || `user-${Math.random().toString(36).substr(2, 9)}`,
        email: data.user?.email || email,
        role: userRole,
        name: data.user?.name || email.split('@')[0]
      };
      
      setUser(userData);
      safeLocalStorage.setItem('user', JSON.stringify(userData));
      safeLocalStorage.setItem('token', data.token);
      
      // Set role in local storage for role-based routing
      safeLocalStorage.setItem('userRole', userData.role);
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error; // Re-throw to be handled by the component
    }
  }, []);

  const logout = useCallback((): void => {
    setUser(null);
    safeLocalStorage.removeItem('user');
    safeLocalStorage.removeItem('token');
  }, []);

  const getToken = useCallback((): string | null => {
    return safeLocalStorage.getItem('token');
  }, []);

  const setToken = useCallback((token: string): void => {
    safeLocalStorage.setItem('token', token);
  }, []);

  const clearToken = useCallback((): void => {
    safeLocalStorage.removeItem('token');
  }, []);

  const getUserRole = useCallback((): UserRole | null => {
    return user?.role || null;
  }, [user]);

  const setUserRole = useCallback((role: UserRole): void => {
    if (user) {
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      safeLocalStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }, [user]);

  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  const hasAnyRole = useCallback((roles: UserRole[]): boolean => {
    return user?.role ? roles.includes(user.role) : false;
  }, [user]);

  const value = {
    user,
    isLoading,
    login,
    logout,
    getToken,
    setToken,
    clearToken,
    getUserRole,
    setUserRole,
    hasRole,
    hasAnyRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading ? children : <div>Loading...</div>}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export getUserRole for direct usage
export const getUserRole = (): UserRole | null => {
  const userData = safeLocalStorage.getItem('user');
  if (!userData) return null;
  try {
    const user = JSON.parse(userData);
    return user?.role || null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Export hasAnyRole for direct usage
export const hasAnyRole = (roles: UserRole[]): boolean => {
  const userRole = getUserRole();
  if (!userRole) return false;
  return roles.includes(userRole);
};

// Export individual functions for direct usage
export const getToken = (): string | null => {
  return safeLocalStorage.getItem('token');
};

export const setToken = (token: string): void => {
  safeLocalStorage.setItem('token', token);
};

export const clearToken = (): void => {
  safeLocalStorage.removeItem('token');
};

export const setUserData = (data: any): void => {
  safeLocalStorage.setItem('userData', JSON.stringify(data));
  // Also ensure a minimal `user` entry exists for role-based routing and guards.
  try {
    const minimalUser = {
      id: data?.id || data?._id || `user-${Math.random().toString(36).substr(2, 9)}`,
      email: data?.email || '',
      role: data?.role || 'user',
      name: data?.name || undefined,
    };
    safeLocalStorage.setItem('user', JSON.stringify(minimalUser));
  } catch (e) {
    console.error('Failed to write minimal user data:', e);
  }
};

export const getUserData = (): any => {
  const data = safeLocalStorage.getItem('userData');
  return data ? JSON.parse(data) : null;
};

export const clearUserData = (): void => {
  safeLocalStorage.removeItem('userData');
};

export const setUserRole = (role: UserRole): void => {
  const userData = safeLocalStorage.getItem('user');
  if (userData) {
    const user = JSON.parse(userData);
    user.role = role;
    safeLocalStorage.setItem('user', JSON.stringify(user));
  } else {
    // If no user exists in storage, create a minimal one so role checks work
    const minimalUser = { id: `user-${Math.random().toString(36).substr(2, 9)}`, email: '', role };
    safeLocalStorage.setItem('user', JSON.stringify(minimalUser));
  }
};

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
    const userData = safeLocalStorage.getItem('user');
    if (userData) {
      safeLocalStorage.removeItem('user');
      safeLocalStorage.removeItem('token');
      // You might want to trigger a logout or redirect here
      window.location.href = '/login';
    }
  }

  return response;
};
