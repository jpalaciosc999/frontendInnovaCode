import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { canAccessPath as permissionCanAccessPath, getTokenPermissionKeys } from '../auth/access';
import {
  canAccessPath as roleCanAccessPath,
  normalizeRole,
  notifyAuthUserChanged,
} from '../config/roleViews';

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

const getUserRole = (user: AuthUser | null) => {
  if (!user) return null;

  const roleByName =
    normalizeRole(user.rol_nombre) ||
    normalizeRole(user.ROL_NOMBRE) ||
    normalizeRole(user.rol);

  if (roleByName) return roleByName;

  const rolId = Number(user.rol_id ?? user.ROL_ID ?? user.rol);

  if (rolId === 4) return 'EMPLEADO';
  if (rolId === 8) return 'ANALISTA_NOMINA';
  if (rolId === 9) return 'CONSULTA_AUDITORIA';
  if (rolId === 10) return 'GERENTE_RRHH';
  if (rolId === 11) return 'SUPERVISOR_ASISTENCIA';
  if (rolId === 12) return 'ADMINISTRADOR_NOMINA';
  if (rolId === 37) return 'CONTABILIDAD';

  return null;
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

    const role = getUserRole(newUser);

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));

    if (role) {
      localStorage.setItem('rol', role);
    }

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
    (path: string) => {
      const role = getUserRole(user);

      if (roleCanAccessPath(path, role)) return true;

      return permissionCanAccessPath(user, path);
    },
    [user]
  );

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