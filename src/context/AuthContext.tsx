import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  lastname: string;
  cedula: string;
  role: 'user' | 'admin' | 'security' | 'news' | 'reports' | 'buses' | 'driver' | 'community';
  verified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (name: string, lastname: string, cedula: string, email: string, password: string) => Promise<boolean>;
  signOut: () => void;
  updateProfile: (updates: Partial<Pick<User, 'name' | 'lastname' | 'email'>> & { password?: string }) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('authUser');
    return saved ? JSON.parse(saved) : null;
  });
  useEffect(() => {
    const onUnauthorized = () => {
      setUser(null);
      localStorage.removeItem('authUser');
      localStorage.removeItem('authToken');
    };
    window.addEventListener('auth:unauthorized', onUnauthorized as any);
    return () => window.removeEventListener('auth:unauthorized', onUnauthorized as any);
  }, []);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (response.ok) {
        // Get user data from backend response
        const data = await response.json();
        if (data.requiresVerification) {
          // Store minimal user info to show a verify-needed screen; do not set auth token
          localStorage.setItem('pendingVerifyEmail', email);
          setUser(null);
          return false;
        }
        if (data.user && data.user.verified === false) {
          localStorage.setItem('pendingVerifyEmail', email);
          setUser(null);
          return false;
        }
        setUser(data.user as User);
        localStorage.setItem('authUser', JSON.stringify(data.user));
        localStorage.setItem('cedula', data.user.cedula);
        if (data.token) localStorage.setItem('authToken', data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const signUp = async (name: string, lastname: string, cedula: string, email: string, password: string): Promise<boolean> => {
    try {
      const payload = { name, lastname, cedula, email, password, role: 'user' };
      console.log('[signUp] Enviando:', payload);
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log('[signUp] Status:', response.status);
      const data = await response.json();
      console.log('[signUp] Response:', data);
      
      if (response.ok) {
        return true;
      }
      
      // Bubble up server-side validation errors
      if (response.status === 409 && data?.duplicate) {
        if (data.duplicate === 'cedula') throw new Error('Esta cédula ya está registrada.');
        if (data.duplicate === 'email') throw new Error('Este email ya está registrado.');
      }
      if (data?.violations) {
        throw new Error(Array.isArray(data.violations) ? data.violations.join('\n') : data.message || 'Error de validación');
      }
      if (data?.missing) {
        throw new Error(`Campos faltantes: ${data.missing.join(', ')}`);
      }
      throw new Error(data?.message || 'Error al registrarse');
    } catch (err) {
      console.error('[signUp] Error:', err);
      throw err;
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('authUser');
    localStorage.removeItem('authToken');
  };

  const updateProfile: AuthContextType['updateProfile'] = async (updates) => {
    if (!user) return false;
    try {
      const res = await fetch(`/api/users/${user.cedula}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) return false;
      const data = await res.json();
      setUser(prev => {
        const merged = { ...(prev as User), ...data.user };
        localStorage.setItem('authUser', JSON.stringify(merged));
       
        return merged;
      });
      return true;
    } catch {
      return false;
    }
  };

  const deleteAccount: AuthContextType['deleteAccount'] = async () => {
    if (!user) return false;
    try {
      // Important: send DELETE with current JWT; signOut only after success
      const res = await fetch(`/api/users/${user.cedula}`, { method: 'DELETE' });
      if (!res.ok) return false;
      // Now, after server confirms deletion, clear local session
      signOut();
      return true;
    } catch {
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      signIn,
      signUp,
      signOut,
      updateProfile,
      deleteAccount
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