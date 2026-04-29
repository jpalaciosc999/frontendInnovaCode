import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { ALL_PERMISSIONS, canAccessPath as userCanAccessPath, toAccessKey } from '../auth/access';
import { obtenerPermisos } from '../services/permisos.service';
import { obtenerRolPermisos } from '../services/rolPermisos.service';
import { obtenerRoles } from '../services/roles.service';

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

const readValue = <T extends Record<string, unknown>>(item: T, keys: string[]) => {
  for (const key of keys) {
    const value = item[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return undefined;
};

const getUserRoleId = (authUser: AuthUser) =>
  readValue(authUser as unknown as Record<string, unknown>, ['rol_id', 'ROL_ID']);

const getUserRoleName = (authUser: AuthUser) =>
  String(
    readValue(authUser as unknown as Record<string, unknown>, [
      'rol_nombre',
      'ROL_NOMBRE',
      'rol',
      'role',
    ]) ?? ''
  );

const defaultPermissionsByRole: Record<string, string[]> = {
  empleado: ['marcajes'],
  rrhh: [
    'marcajes',
    'resumenmarcaje',
    'empleados',
    'departamentos',
    'puestos',
    'sede',
    'horarios',
    'cuentabancaria',
    'kpis',
    'suspensionesigss',
    'registrovacaciones',
  ],
  admin: ['roles', 'permisos', 'usuarios', 'rolpermisos'],
  administrador: ['roles', 'permisos', 'usuarios', 'rolpermisos'],
  contabilidad: [
    'nomina',
    'nominadetalle',
    'periodo',
    'isr',
    'irtra',
    'intecap',
    'prestamos',
    'calculadoraigss',
    'calculadoraisr',
  ],
  gerente: ['aprobacionnomina'],
};

const isNumericRoleKey = (roleKey: string) => /^\d+$/.test(roleKey);

const isFullAccessRole = (authUser: AuthUser, resolvedRoleName = '') => {
  const roleName = toAccessKey(getUserRoleName(authUser));
  const roleId = String(getUserRoleId(authUser) ?? '');

  return roleName === 'supremo' || toAccessKey(resolvedRoleName) === 'supremo' || roleId === '1';
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setPermissions([]);
  };

  const canAccessPath = useCallback(
    (path: string) => userCanAccessPath(permissions, path),
    [permissions]
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
    if (!token || !user) {
      setPermissions([]);
      setLoadingPermissions(false);
      return;
    }

    const roleId = String(getUserRoleId(user) ?? user.rol);
    const roleName = toAccessKey(getUserRoleName(user));

    if (isFullAccessRole(user)) {
      setPermissions([ALL_PERMISSIONS]);
      setLoadingPermissions(false);
      return;
    }

    let active = true;

    const loadPermissions = async () => {
      try {
        setLoadingPermissions(true);
        const [rolePermissionsResult, allPermissionsResult, rolesResult] = await Promise.allSettled([
          obtenerRolPermisos(),
          obtenerPermisos(),
          obtenerRoles(),
        ]);

        if (!active) return;

        const rolePermissions =
          rolePermissionsResult.status === 'fulfilled' ? rolePermissionsResult.value : [];
        const allPermissions =
          allPermissionsResult.status === 'fulfilled' ? allPermissionsResult.value : [];
        const roles = rolesResult.status === 'fulfilled' ? rolesResult.value : [];

        const resolvedRoleName = String(
          roles.find((role) => String(role.ROL_ID) === roleId)?.ROL_NOMBRE ?? ''
        );
        const resolvedRoleKey = toAccessKey(resolvedRoleName);
        const effectiveRoleName = !roleName || isNumericRoleKey(roleName) ? resolvedRoleKey : roleName;

        if (isFullAccessRole(user, resolvedRoleName)) {
          setPermissions([ALL_PERMISSIONS]);
          return;
        }

        const allowedPermissionIds = new Set(
          rolePermissions
            .filter((item) => {
              const itemRoleId = readValue(item as unknown as Record<string, unknown>, [
                'ROL_ID',
                'rol_id',
              ]);
              return String(itemRoleId) === roleId;
            })
            .map((item) =>
              String(
                readValue(item as unknown as Record<string, unknown>, [
                  'PER_ID',
                  'per_id',
                  'PERMISOS_ID',
                  'permisos_id',
                ])
              )
            )
        );

        const allowedKeys = allPermissions
          .filter((permission) => {
            const permissionId = readValue(permission as unknown as Record<string, unknown>, [
              'PERMISOS_ID',
              'permisos_id',
              'PER_ID',
              'per_id',
            ]);
            return allowedPermissionIds.has(String(permissionId));
          })
          .flatMap((permission) => {
            const moduleName = readValue(permission as unknown as Record<string, unknown>, [
              'PER_MODULO',
              'per_modulo',
            ]);
            const permissionName = readValue(permission as unknown as Record<string, unknown>, [
              'PER_NOMBRE_PERMISO',
              'per_nombre_permiso',
            ]);

            return [toAccessKey(String(moduleName || '')), toAccessKey(String(permissionName || ''))];
          })
          .filter(Boolean);

        const defaultRolePermissions = defaultPermissionsByRole[effectiveRoleName] ?? [];
        setPermissions(Array.from(new Set([...allowedKeys, ...defaultRolePermissions])));
      } catch {
        if (active) setPermissions(defaultPermissionsByRole[roleName] ?? []);
      } finally {
        if (active) setLoadingPermissions(false);
      }
    };

    loadPermissions();

    return () => {
      active = false;
    };
  }, [token, user]);

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
