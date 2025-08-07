import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  lastName: string;
  cedula: string;
  role: 'user' | 'admin';
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, lastName: string, cedula: string, email: string, password: string) => Promise<boolean>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - replace with real API call
    if (email === 'admin' && password === 'admin') {
      setUser({
        id: 'admin',
        name: 'Administrador',
        email: 'admin@comet.com',
        lastName: 'Sistema',
        cedula: '000000000',
        role: 'admin'
      });
      return true;
    } else if (email && password) {
      setUser({
        id: '1',
        name: 'Usuario',
        email: email,
        lastName: 'Demo',
        cedula: '123456789',
        role: 'user'
      });
      return true;
    }
    return false;
  };

  const signUp = async (name: string, lastName: string, cedula: string, email: string, password: string): Promise<boolean> => {
    // Mock registration - replace with real API call
    if (name && lastName && cedula && email && password) {
      setUser({
        id: '1',
        name,
        email,
        lastName,
        cedula,
        role: 'user'
      });
      return true;
    }
    return false;
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