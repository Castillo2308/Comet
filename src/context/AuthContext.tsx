import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  lastname: string;
  cedula: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, lastname: string, cedula: string, email: string, password: string) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - replace with real API call
    if (email === 'admin@1' && password === 'admin') {
      setUser({
        id: 'admin',
        name: 'Administrador',
        email: 'admin@comet.com',
        lastname: 'Sistema',
        cedula: '000000000',
        role: 'admin'
      });
      return true;
    } else if (email && password) {
      setUser({
        id: '1',
        name: 'Usuario',
        email: email,
        lastname: 'Demo',
        cedula: '123456789',
        role: 'user'
      });
      return true;
    }
    return false;
  };

  const signUp = async (name: string, lastname: string, cedula: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, lastname, cedula, email, password })
      });
      if (response.ok) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const signOut = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      signIn,
      signUp,
      signOut
    }}>
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