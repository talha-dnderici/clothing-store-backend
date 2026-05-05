import React, { createContext, useContext, useState, ReactNode } from 'react';

type User = {
  id?: string;
  name: string;
  email: string;
  role?: string;
};

type AuthContextType = {
  user: User | null;
  login: (user: User, token?: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function readStoredUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawUser = window.localStorage.getItem('authUser');
    const token = window.localStorage.getItem('token');

    if (!rawUser || !token) {
      return null;
    }

    return JSON.parse(rawUser) as User;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());

  const login = (nextUser: User, token?: string) => {
    setUser(nextUser);

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('authUser', JSON.stringify(nextUser));
      if (token) {
        window.localStorage.setItem('token', token);
      }
    }
  };

  const logout = () => {
    setUser(null);

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('authUser');
      window.localStorage.removeItem('token');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
