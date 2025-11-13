"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

interface LoginCredentials {
  email: string;
  password: string;
  secretCode?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user and token from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
          secret_code: credentials.secretCode || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Login failed');
      }

      const data = await response.json();
      const { access_token } = data;

      // Fetch user info with the token
      const userResponse = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userData = await userResponse.json();

      // Store in state and localStorage
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));

      // Role-based redirect
      if (userData.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (userData.role === 'manager') {
        router.push('/manager/dashboard');
      } else {
        router.push('/user/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function requireAuth<P extends object>(Component: React.ComponentType<P>) {
  return function ProtectedRoute(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/login');
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    return <Component {...props} />;
  };
}

export function requireRole<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: string[]
) {
  return function RoleProtectedRoute(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!user) {
          router.push('/login');
        } else if (!allowedRoles.includes(user.role)) {
          // Redirect to appropriate dashboard based on role
          if (user.role === 'admin') {
            router.push('/admin/dashboard');
          } else if (user.role === 'manager') {
            router.push('/manager/dashboard');
          } else {
            router.push('/user/dashboard');
          }
        }
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      );
    }

    if (!user || !allowedRoles.includes(user.role)) {
      return null;
    }

    return <Component {...props} />;
  };
}
