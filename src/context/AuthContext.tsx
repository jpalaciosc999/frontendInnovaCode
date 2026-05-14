import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { canAccessPath as userCanAccessPath, getTokenPermissionKeys } from '../auth/access';
import { notifyAuthUserChanged } from '../config/roleViews';

interface AuthUser {
  id: number;
  email: string;
  rol: string;
  username?: string;
  nombre_completo?: string;
  correo?: string;
  rol_id?: number;
  rol_nombre?: string;
  ROL_ID?: number;
  ROL_NOMBRE?: string;
  emp_id?: number | null;
  permisos?: unknown[];
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  permissions: string[];
  loadingPermissions: boolean;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  canAccessPath: (path: string) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const clearLegacyRoleState = () => {
  localStorage.removeItem('usuario');
  localStorage.removeItem('rol');
  localStorage.removeItem('role');
  localStorage.removeItem('userRole');
  localStorage.removeItem('tipoUsuario');
  localStorage.removeItem('authUser');
  localStorage.removeItem('currentUser');
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [permissions, setPermissions] = useState<string[]>(() => getTokenPermissionKeys(user));
  const loadingPermissions = false;

  const login = (newToken: string, newUser: AuthUser) => {
    clearLegacyRoleState();
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    notifyAuthUserChanged();
  };

  const logout = () => {
    clearLegacyRoleState();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setPermissions([]);
    notifyAuthUserChanged();
  };

  const canAccessPath = useCallback(
    (path: string) => userCanAccessPath(user, path),
    [user]
  );

  // Verificar expiración del token
  useEffect(() => {
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expMs = payload.exp * 1000;
      if (Date.now() >= expMs) {
        logout();
        return;
      }
      const timeout = setTimeout(logout, expMs - Date.now());
      return () => clearTimeout(timeout);
    } catch {
      logout();
    }
  }, [token]);

  useEffect(() => {
    setPermissions(getTokenPermissionKeys(user));
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        permissions,
        loadingPermissions,
        login,
        logout,
        canAccessPath,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
};
