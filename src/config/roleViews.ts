export type AppRole = 'EMPLEADO' | 'RRHH' | 'ADMIN' | 'CONTABILIDAD' | 'GERENTE' | 'SUPREMO';

export type AppView = {
  key: string;
  text: string;
  path: string;
  roles: AppRole[];
  pending?: boolean;
};

export const roleLabels: Record<AppRole, string> = {
  EMPLEADO: 'Empleado',
  RRHH: 'RRHH',
  ADMIN: 'Admin',
  CONTABILIDAD: 'Contabilidad',
  GERENTE: 'Gerente',
  SUPREMO: 'Supremo',
};

export const navSectionLabels: Record<AppRole, string> = {
  EMPLEADO: 'Mi asistencia',
  RRHH: 'Talento humano',
  ADMIN: 'Administracion',
  CONTABILIDAD: 'Nomina y pagos',
  GERENTE: 'Gerencia',
  SUPREMO: 'Acceso total',
};

export const roleOrder: AppRole[] = [
  'EMPLEADO',
  'RRHH',
  'ADMIN',
  'CONTABILIDAD',
  'GERENTE',
  'SUPREMO',
];

export const AUTH_USER_CHANGED_EVENT = 'auth-user-changed';

export const appViews: AppView[] = [
  { key: 'marcaje', text: 'Registro de marcaje', path: '/marcajes', roles: ['EMPLEADO'] },

  { key: 'resumen-marcaje', text: 'Control de marcajes', path: '/resumen-marcaje', roles: ['RRHH'] },
  { key: 'registro-empleados', text: 'Empleados', path: '/empleados', roles: ['RRHH'] },
  { key: 'departamentos', text: 'Departamentos', path: '/departamentos', roles: ['RRHH'] },
  { key: 'puestos', text: 'Puestos', path: '/puestos', roles: ['RRHH'] },
  { key: 'sucursales', text: 'Sucursales', path: '/sucursales', roles: ['RRHH'] },
  { key: 'horarios', text: 'Horarios', path: '/horarios', roles: ['RRHH'] },
  { key: 'cuenta-bancaria', text: 'Cuentas bancarias', path: '/cuenta-bancaria', roles: ['RRHH'] },
  { key: 'kpis', text: 'Indicadores', path: '/kpis', roles: ['RRHH'] },
  { key: 'kpi-resultado', text: 'Resultados de indicadores', path: '/kpi-resultado', roles: ['RRHH'] },
  { key: 'suspensiones-igss', text: 'Suspensiones IGSS', path: '/suspensiones-igss', roles: ['RRHH'] },
  { key: 'control-laboral', text: 'Permisos y vacaciones', path: '/control-laboral', roles: ['RRHH'] },
  { key: 'empleado-contrato', text: 'Contratos de empleados', path: '/empleado-contrato', roles: ['RRHH'] },
  { key: 'tipo-contrato', text: 'Tipos de contrato', path: '/tipo-contrato', roles: ['RRHH'] },

  { key: 'asignacion-roles', text: 'Gestion de roles', path: '/roles', roles: ['ADMIN'] },
  { key: 'asignacion-permisos', text: 'Gestion de permisos', path: '/permisos', roles: ['ADMIN'] },
  { key: 'registro-usuarios', text: 'Usuarios del sistema', path: '/usuarios', roles: ['ADMIN'] },
  { key: 'roles-permisos', text: 'Roles y permisos', path: '/rol-permisos', roles: ['ADMIN'] },
  { key: 'bitacora', text: 'Bitacora', path: '/bitacora', roles: ['ADMIN'] },
  { key: 'usuario-bitacora', text: 'Trazabilidad de usuarios', path: '/usuario-bitacora', roles: ['ADMIN'] },

  { key: 'nomina-asignaciones', text: 'Asignaciones de nomina', path: '/nomina-asignaciones', roles: ['CONTABILIDAD'] },
  { key: 'nomina', text: 'Gestion de nomina', path: '/nomina', roles: ['CONTABILIDAD'] },
  { key: 'nomina-detalle', text: 'Detalle de nomina', path: '/nomina-detalle', roles: ['CONTABILIDAD'] },
  { key: 'periodos', text: 'Periodos de pago', path: '/periodo', roles: ['CONTABILIDAD'] },
  { key: 'tipo-ingresos', text: 'Tipos de ingreso', path: '/tipo-ingresos', roles: ['CONTABILIDAD'] },
  { key: 'descuentos', text: 'Descuentos', path: '/descuentos', roles: ['CONTABILIDAD'] },
  { key: 'prestamos', text: 'Prestamos', path: '/prestamos', roles: ['CONTABILIDAD'] },
  { key: 'liquidacion', text: 'Liquidaciones', path: '/liquidacion', roles: ['CONTABILIDAD'] },
  { key: 'aprobacion-nomina', text: 'Aprobacion de nomina', path: '/aprobacion-nomina', roles: ['GERENTE'] },
];

export const reportViews: AppView[] = [
  { key: 'reporte-marcajes', text: 'Marcajes', path: '/reporte-marcajes', roles: ['RRHH', 'ADMIN', 'SUPREMO'] },
  { key: 'reporte-vacaciones', text: 'Vacaciones', path: '/reporte-vacaciones', roles: ['RRHH', 'ADMIN', 'SUPREMO'] },
  { key: 'reporte-igss', text: 'IGSS', path: '/reporte-igss', roles: ['ADMIN', 'CONTABILIDAD', 'SUPREMO'] },
  { key: 'reporte-isr', text: 'ISR anual', path: '/reporte-isr', roles: ['ADMIN', 'CONTABILIDAD', 'SUPREMO'] },
  { key: 'reporte-aguinaldo', text: 'Aguinaldo y Bono 14', path: '/reporte-aguinaldo', roles: ['ADMIN', 'CONTABILIDAD', 'RRHH', 'SUPREMO'] },
  { key: 'reporte-descuentos', text: 'Descuentos', path: '/reporte-descuentos', roles: ['ADMIN', 'CONTABILIDAD', 'SUPREMO'] },
  { key: 'reporte-liquidacion', text: 'Liquidaciones', path: '/reporte-liquidacion', roles: ['ADMIN', 'CONTABILIDAD', 'SUPREMO'] },
  { key: 'reporte-kpi', text: 'Indicadores KPI', path: '/reporte-kpi', roles: ['ADMIN', 'RRHH', 'GERENTE', 'SUPREMO'] },
  { key: 'reporte-horas-extra', text: 'Horas extra', path: '/reporte-horas-extra', roles: ['ADMIN', 'GERENTE', 'CONTABILIDAD', 'SUPREMO'] },
  { key: 'dashboard-ejecutivo', text: 'Dashboard ejecutivo', path: '/dashboard-ejecutivo', roles: ['ADMIN', 'GERENTE', 'SUPREMO'] },
];

export const legacyViews: AppView[] = [
  { key: 'sede', text: 'Sede', path: '/sede', roles: ['RRHH'] },
];

export const allViews = [...appViews, ...reportViews, ...legacyViews];

export type ReportItem = {
  text: string;
  path: string;
  key: string;
};

export const reportesPorRol: Record<AppRole, ReportItem[]> = {
  EMPLEADO: [],
  RRHH: reportViews
    .filter((view) => view.roles.includes('RRHH'))
    .map(({ text, path, key }) => ({ text, path, key })),
  ADMIN: reportViews
    .filter((view) => view.roles.includes('ADMIN'))
    .map(({ text, path, key }) => ({ text, path, key })),
  CONTABILIDAD: reportViews
    .filter((view) => view.roles.includes('CONTABILIDAD'))
    .map(({ text, path, key }) => ({ text, path, key })),
  GERENTE: reportViews
    .filter((view) => view.roles.includes('GERENTE'))
    .map(({ text, path, key }) => ({ text, path, key })),
  SUPREMO: reportViews.map(({ text, path, key }) => ({ text, path, key })),
};

export function normalizeRole(value: unknown): AppRole | null {
  if (typeof value !== 'string') return null;

  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '');

  if (normalized === 'EMPLEADO') return 'EMPLEADO';
  if (normalized === 'RRHH' || normalized === 'RH' || normalized === 'RECURSOSHUMANOS') return 'RRHH';
  if (normalized === 'ADMIN' || normalized === 'ADMINISTRADOR') return 'ADMIN';
  if (normalized === 'CONTABILIDAD' || normalized === 'CONTADOR') return 'CONTABILIDAD';
  if (normalized === 'GERENTE' || normalized === 'MANAGER') return 'GERENTE';
  if (normalized === 'SUPREMO' || normalized === 'SUPERADMIN' || normalized === 'ROOT') return 'SUPREMO';

  return null;
}

function readRoleFromObject(value: unknown): AppRole | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  return (
    normalizeRole(record.rol) ||
    normalizeRole(record.role) ||
    normalizeRole(record.ROL_NOMBRE) ||
    normalizeRole(record.rol_nombre) ||
    normalizeRole(record.tipo_usuario) ||
    normalizeRole(record.tipoUsuario)
  );
}

export function notifyAuthUserChanged() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(AUTH_USER_CHANGED_EVENT));
}

export function saveSelectedUserToLocalStorage(user: unknown, roleName: string) {
  if (typeof window === 'undefined') return;

  const role = normalizeRole(roleName);
  window.localStorage.setItem('usuario', JSON.stringify(user));
  window.localStorage.setItem('rol', role ?? roleName);
  notifyAuthUserChanged();
}

export function clearSelectedUserFromLocalStorage() {
  if (typeof window === 'undefined') return;

  window.localStorage.removeItem('usuario');
  window.localStorage.removeItem('rol');
  window.localStorage.removeItem('role');
  window.localStorage.removeItem('userRole');
  window.localStorage.removeItem('tipoUsuario');
  notifyAuthUserChanged();
}

export function getCurrentStoredUserId(): string {
  if (typeof window === 'undefined') return '';

  const raw = window.localStorage.getItem('usuario');
  if (!raw) return '';

  try {
    const user = JSON.parse(raw) as Record<string, unknown>;
    return String(user.id ?? user.USU_ID ?? user.usuario_id ?? '');
  } catch {
    return '';
  }
}

export function getCurrentUserRole(): AppRole | null {
  if (typeof window === 'undefined') return null;

  const directKeys = ['rol', 'role', 'userRole', 'tipoUsuario'];
  for (const key of directKeys) {
    const role = normalizeRole(window.localStorage.getItem(key));
    if (role) return role;
  }

  const objectKeys = ['usuario', 'user', 'authUser', 'currentUser'];
  for (const key of objectKeys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;

    try {
      const role = readRoleFromObject(JSON.parse(raw));
      if (role) return role;
    } catch {
      const role = normalizeRole(raw);
      if (role) return role;
    }
  }

  return null;
}

export function canAccessPath(path: string, role: AppRole | null): boolean {
  if (path === '/') return true;
  if (!role) return true;
  if (role === 'SUPREMO') return true;

  const view = allViews.find((item) => item.path === path);
  return Boolean(view?.roles.includes(role));
}
