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
  { key: 'marcaje', text: 'Marcaje', path: '/marcajes', roles: ['EMPLEADO'] },

  { key: 'resumen-marcaje', text: 'Resumen de Marcaje', path: '/resumen-marcaje', roles: ['RRHH'], pending: true },
  { key: 'registro-empleados', text: 'Registro de Empleados', path: '/empleados', roles: ['RRHH'] },
  { key: 'departamentos', text: 'Departamentos', path: '/departamentos', roles: ['RRHH'] },
  { key: 'puestos', text: 'Puestos', path: '/puestos', roles: ['RRHH'] },
  { key: 'sucursales', text: 'Sucursales', path: '/sucursales', roles: ['RRHH'] },
  { key: 'horarios', text: 'Horarios', path: '/horarios', roles: ['RRHH'] },
  { key: 'cuenta-bancaria', text: 'Cuenta Bancaria', path: '/cuenta-bancaria', roles: ['RRHH'] },
  { key: 'kpis', text: 'KPIs', path: '/kpis', roles: ['RRHH'] },
  { key: 'kpi-resultado', text: 'Resultados KPI', path: '/kpi-resultado', roles: ['RRHH'] },
  { key: 'suspensiones-igss', text: 'Suspensiones de IGSS', path: '/suspensiones-igss', roles: ['RRHH'] },
  { key: 'registro-vacaciones', text: 'Registro de Vacaciones', path: '/registro-vacaciones', roles: ['RRHH'], pending: true },
  { key: 'control-laboral', text: 'Control Laboral', path: '/control-laboral', roles: ['RRHH'] },
  { key: 'empleado-contrato', text: 'Empleado Contrato', path: '/empleado-contrato', roles: ['RRHH'] },
  { key: 'tipo-contrato', text: 'Tipo Contrato', path: '/tipo-contrato', roles: ['RRHH'] },

  { key: 'asignacion-roles', text: 'Asignacion de Roles', path: '/roles', roles: ['ADMIN'] },
  { key: 'asignacion-permisos', text: 'Asignacion de Permisos', path: '/permisos', roles: ['ADMIN'] },
  { key: 'registro-usuarios', text: 'Registros de Usuarios', path: '/usuarios', roles: ['ADMIN'] },
  { key: 'roles-permisos', text: 'Roles Permisos', path: '/rol-permisos', roles: ['ADMIN'] },
  { key: 'bitacora', text: 'Bitacora', path: '/bitacora', roles: ['ADMIN'] },
  { key: 'usuario-bitacora', text: 'Usuario Bitacora', path: '/usuario-bitacora', roles: ['ADMIN'] },

  { key: 'nomina', text: 'Nomina', path: '/nomina', roles: ['CONTABILIDAD'] },
  { key: 'nomina-detalle', text: 'Nomina Detalle', path: '/nomina-detalle', roles: ['CONTABILIDAD'] },
  { key: 'periodos', text: 'Periodos', path: '/periodo', roles: ['CONTABILIDAD'] },
  { key: 'tipo-ingresos', text: 'Ingresos', path: '/tipo-ingresos', roles: ['CONTABILIDAD'] },
  { key: 'descuentos', text: 'Descuentos', path: '/descuentos', roles: ['CONTABILIDAD'] },
  { key: 'isr', text: 'ISR', path: '/isr', roles: ['CONTABILIDAD'], pending: true },
  { key: 'irtra', text: 'IRTRA', path: '/irtra', roles: ['CONTABILIDAD'], pending: true },
  { key: 'intecap', text: 'INTECAP', path: '/intecap', roles: ['CONTABILIDAD'], pending: true },
  { key: 'prestamos', text: 'Prestamos', path: '/prestamos', roles: ['CONTABILIDAD'] },
  { key: 'prestamo-detalle', text: 'Detalle Prestamo', path: '/prestamo-detalle', roles: ['CONTABILIDAD'] },
  { key: 'liquidacion', text: 'Liquidacion', path: '/liquidacion', roles: ['CONTABILIDAD'] },
  { key: 'calculadora-igss', text: 'Calculadora IGSS', path: '/calculadora-igss', roles: ['CONTABILIDAD'] },
  { key: 'calculadora-isr', text: 'Calculadora ISR', path: '/calculadora-isr', roles: ['CONTABILIDAD'] },
  { key: 'tipos-descuento', text: 'Tipos Descuento', path: '/tipos-descuento', roles: ['CONTABILIDAD'] },
  { key: 'prestamos-banco', text: 'Prestamos Banco', path: '/prestamos-banco', roles: ['CONTABILIDAD'] },
  { key: 'generar-csv', text: 'Generar CSV Deposito', path: '/generar-csv', roles: ['CONTABILIDAD'] },

  { key: 'aprobacion-nomina', text: 'Aprobacion de Nomina', path: '/aprobacion-nomina', roles: ['GERENTE'], pending: true },
];

export const legacyViews: AppView[] = [
  { key: 'sede', text: 'Sede', path: '/sede', roles: ['RRHH'] },
];

export const allViews = [...appViews, ...legacyViews];

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
