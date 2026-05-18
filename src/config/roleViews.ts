export type AppRole =
  | 'EMPLEADO'
  | 'RRHH'
  | 'ADMIN'
  | 'CONTABILIDAD'
  | 'GERENTE'
  | 'AUDITORIA'
  | 'ANALISTA_NOMINA'
  | 'SUPERVISOR_ASISTENCIA'
  | 'SUPREMO';

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
  AUDITORIA: 'Auditoria',
  ANALISTA_NOMINA: 'Analista de Nomina',
  SUPERVISOR_ASISTENCIA: 'Supervisor de Asistencia',
  SUPREMO: 'Supremo',
};

export const roleOrder: AppRole[] = [
  'EMPLEADO',
  'RRHH',
  'ADMIN',
  'CONTABILIDAD',
  'GERENTE',
  'AUDITORIA',
  'ANALISTA_NOMINA',
  'SUPERVISOR_ASISTENCIA',
  'SUPREMO',
];

export const AUTH_USER_CHANGED_EVENT = 'auth-user-changed';

export const appViews: AppView[] = [
  { key: 'marcaje', text: 'Marcaje', path: '/marcajes', roles: ['EMPLEADO'] },

  { key: 'resumen-marcaje', text: 'Resumen de Marcaje', path: '/resumen-marcaje', roles: ['RRHH', 'SUPERVISOR_ASISTENCIA'] },
  { key: 'reporte-marcajes', text: 'Reporte de Marcajes', path: '/reporte-marcajes', roles: ['RRHH', 'ADMIN', 'AUDITORIA', 'SUPERVISOR_ASISTENCIA'] },
  { key: 'reporte-vacaciones', text: 'Reporte de Vacaciones', path: '/reporte-vacaciones', roles: ['RRHH', 'ADMIN'] },
  { key: 'registro-empleados', text: 'Registro de Empleados', path: '/empleados', roles: ['RRHH'] },
  { key: 'departamentos', text: 'Departamentos', path: '/departamentos', roles: ['RRHH'] },
  { key: 'puestos', text: 'Puestos', path: '/puestos', roles: ['RRHH'] },
  { key: 'sucursales', text: 'Sucursales', path: '/sucursales', roles: ['RRHH'] },
  { key: 'horarios', text: 'Horarios', path: '/horarios', roles: ['RRHH', 'SUPERVISOR_ASISTENCIA'] },
  { key: 'cuenta-bancaria', text: 'Cuenta Bancaria', path: '/cuenta-bancaria', roles: ['RRHH'] },
  { key: 'kpis', text: 'KPIs', path: '/kpis', roles: ['RRHH'] },
  { key: 'kpi-resultado', text: 'Resultados KPI', path: '/kpi-resultado', roles: ['RRHH'] },
  { key: 'suspensiones-igss', text: 'Suspensiones de IGSS', path: '/suspensiones-igss', roles: ['RRHH', 'SUPERVISOR_ASISTENCIA'] },
  { key: 'control-laboral', text: 'Control Laboral', path: '/control-laboral', roles: ['RRHH', 'SUPERVISOR_ASISTENCIA'] },
  { key: 'empleado-contrato', text: 'Empleado Contrato', path: '/empleado-contrato', roles: ['RRHH'] },
  { key: 'tipo-contrato', text: 'Tipo Contrato', path: '/tipo-contrato', roles: ['RRHH'] },

  { key: 'asignacion-roles', text: 'Roles', path: '/roles', roles: ['ADMIN'] },
  { key: 'asignacion-permisos', text: 'Permisos', path: '/permisos', roles: ['ADMIN'] },
  { key: 'registro-usuarios', text: 'Usuarios', path: '/usuarios', roles: ['ADMIN'] },
  { key: 'roles-permisos', text: 'Roles y Permisos', path: '/rol-permisos', roles: ['ADMIN'] },
  { key: 'bitacora', text: 'Bitácora', path: '/bitacora', roles: ['ADMIN', 'AUDITORIA'] },
  { key: 'usuario-bitacora', text: 'Trazabilidad Usuario-Bitácora', path: '/usuario-bitacora', roles: ['ADMIN', 'AUDITORIA'] },

  { key: 'nomina-asignaciones', text: 'Asignaciones Nomina', path: '/nomina-asignaciones', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'nomina', text: 'Nomina', path: '/nomina', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'nomina-detalle', text: 'Nomina Detalle', path: '/nomina-detalle', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'periodos', text: 'Periodos', path: '/periodo', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'tipo-ingresos', text: 'Ingresos', path: '/tipo-ingresos', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'descuentos', text: 'Descuentos', path: '/descuentos', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'prestamos', text: 'Prestamos', path: '/prestamos', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'liquidacion', text: 'Liquidacion', path: '/liquidacion', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'calculadora-igss', text: 'Calculadora IGSS', path: '/calculadora-igss', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'calculadora-isr', text: 'Calculadora ISR', path: '/calculadora-isr', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'generar-csv', text: 'Generar CSV Deposito', path: '/generar-csv', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'reporte-igss', text: 'Reporte IGSS', path: '/reporte-igss', roles: ['ADMIN', 'CONTABILIDAD', 'ANALISTA_NOMINA', 'AUDITORIA'] },
  { key: 'reporte-isr', text: 'Reporte ISR Anual', path: '/reporte-isr', roles: ['ADMIN', 'CONTABILIDAD', 'ANALISTA_NOMINA', 'AUDITORIA'] },
  { key: 'reporte-aguinaldo', text: 'Reporte Aguinaldo/Bono 14', path: '/reporte-aguinaldo', roles: ['ADMIN', 'CONTABILIDAD', 'RRHH', 'ANALISTA_NOMINA', 'AUDITORIA'] },
  { key: 'reporte-descuentos', text: 'Reporte de Descuentos', path: '/reporte-descuentos', roles: ['ADMIN', 'CONTABILIDAD', 'ANALISTA_NOMINA', 'AUDITORIA'] },
  { key: 'reporte-liquidacion', text: 'Reporte de Liquidaciones', path: '/reporte-liquidacion', roles: ['ADMIN', 'CONTABILIDAD', 'ANALISTA_NOMINA', 'AUDITORIA'] },
  { key: 'reporte-kpi', text: 'Reporte KPIs', path: '/reporte-kpi', roles: ['ADMIN', 'RRHH', 'GERENTE', 'AUDITORIA'] },
  { key: 'reporte-horas-extra', text: 'Reporte Horas Extra', path: '/reporte-horas-extra', roles: ['ADMIN', 'GERENTE', 'CONTABILIDAD', 'ANALISTA_NOMINA', 'AUDITORIA', 'SUPERVISOR_ASISTENCIA'] },
  { key: 'dashboard-ejecutivo', text: 'Dashboard Ejecutivo', path: '/dashboard-ejecutivo', roles: ['ADMIN', 'GERENTE', 'AUDITORIA'] },
  { key: 'aprobacion-nomina', text: 'Aprobacion de Nomina', path: '/aprobacion-nomina', roles: ['GERENTE'] },
];

export const legacyViews: AppView[] = [
  { key: 'sede', text: 'Sede', path: '/sede', roles: ['RRHH'] },
];

export const allViews = [...appViews, ...legacyViews];

  export type ReportItem = {
    text: string;
    path: string;
    key: string;
  };

  export const reportesPorRol: Record<AppRole, ReportItem[]> = {
    EMPLEADO: [],
    RRHH: [
      { text: 'Reporte de Marcajes', path: '/reporte-marcajes', key: 'reporte-marcajes' },
      { text: 'Reporte de Vacaciones', path: '/reporte-vacaciones', key: 'reporte-vacaciones' },
      { text: 'Reporte KPIs', path: '/reporte-kpi', key: 'reporte-kpi' },
      { text: 'Reporte Aguinaldo/Bono 14', path: '/reporte-aguinaldo', key: 'reporte-aguinaldo' },
    ],
    ADMIN: [
      { text: 'Reporte de Marcajes', path: '/reporte-marcajes', key: 'reporte-marcajes' },
      { text: 'Reporte IGSS', path: '/reporte-igss', key: 'reporte-igss' },
      { text: 'Reporte ISR Anual', path: '/reporte-isr', key: 'reporte-isr' },
      { text: 'Reporte Aguinaldo/Bono 14', path: '/reporte-aguinaldo', key: 'reporte-aguinaldo' },
      { text: 'Reporte de Descuentos', path: '/reporte-descuentos', key: 'reporte-descuentos' },
      { text: 'Reporte de Liquidaciones', path: '/reporte-liquidacion', key: 'reporte-liquidacion' },
      { text: 'Reporte KPIs', path: '/reporte-kpi', key: 'reporte-kpi' },
      { text: 'Reporte Horas Extra', path: '/reporte-horas-extra', key: 'reporte-horas-extra' },
      { text: 'Dashboard Ejecutivo', path: '/dashboard-ejecutivo', key: 'dashboard-ejecutivo' },
    ],
    CONTABILIDAD: [
      { text: 'Reporte IGSS', path: '/reporte-igss', key: 'reporte-igss' },
      { text: 'Reporte ISR Anual', path: '/reporte-isr', key: 'reporte-isr' },
      { text: 'Reporte Aguinaldo/Bono 14', path: '/reporte-aguinaldo', key: 'reporte-aguinaldo' },
      { text: 'Reporte de Descuentos', path: '/reporte-descuentos', key: 'reporte-descuentos' },
      { text: 'Reporte de Liquidaciones', path: '/reporte-liquidacion', key: 'reporte-liquidacion' },
      { text: 'Reporte Horas Extra', path: '/reporte-horas-extra', key: 'reporte-horas-extra' },
    ],
    GERENTE: [
      { text: 'Dashboard Ejecutivo', path: '/dashboard-ejecutivo', key: 'dashboard-ejecutivo' },
      { text: 'Reporte KPIs', path: '/reporte-kpi', key: 'reporte-kpi' },
      { text: 'Reporte Horas Extra', path: '/reporte-horas-extra', key: 'reporte-horas-extra' },
      { text: 'Aprobacion de Nomina', path: '/aprobacion-nomina', key: 'aprobacion-nomina' },
    ],
    AUDITORIA: [
      { text: 'Reporte de Marcajes', path: '/reporte-marcajes', key: 'reporte-marcajes' },
      { text: 'Reporte IGSS', path: '/reporte-igss', key: 'reporte-igss' },
      { text: 'Reporte ISR Anual', path: '/reporte-isr', key: 'reporte-isr' },
      { text: 'Reporte Aguinaldo/Bono 14', path: '/reporte-aguinaldo', key: 'reporte-aguinaldo' },
      { text: 'Reporte de Descuentos', path: '/reporte-descuentos', key: 'reporte-descuentos' },
      { text: 'Reporte de Liquidaciones', path: '/reporte-liquidacion', key: 'reporte-liquidacion' },
      { text: 'Reporte KPIs', path: '/reporte-kpi', key: 'reporte-kpi' },
      { text: 'Reporte Horas Extra', path: '/reporte-horas-extra', key: 'reporte-horas-extra' },
      { text: 'Dashboard Ejecutivo', path: '/dashboard-ejecutivo', key: 'dashboard-ejecutivo' },
    ],
    ANALISTA_NOMINA: [
      { text: 'Reporte IGSS', path: '/reporte-igss', key: 'reporte-igss' },
      { text: 'Reporte ISR Anual', path: '/reporte-isr', key: 'reporte-isr' },
      { text: 'Reporte Aguinaldo/Bono 14', path: '/reporte-aguinaldo', key: 'reporte-aguinaldo' },
      { text: 'Reporte de Descuentos', path: '/reporte-descuentos', key: 'reporte-descuentos' },
      { text: 'Reporte de Liquidaciones', path: '/reporte-liquidacion', key: 'reporte-liquidacion' },
      { text: 'Reporte Horas Extra', path: '/reporte-horas-extra', key: 'reporte-horas-extra' },
    ],
    SUPERVISOR_ASISTENCIA: [
      { text: 'Reporte de Marcajes', path: '/reporte-marcajes', key: 'reporte-marcajes' },
      { text: 'Reporte Horas Extra', path: '/reporte-horas-extra', key: 'reporte-horas-extra' },
    ],
    SUPREMO: [
      { text: 'Reporte de Marcajes', path: '/reporte-marcajes', key: 'reporte-marcajes' },
      { text: 'Reporte IGSS', path: '/reporte-igss', key: 'reporte-igss' },
      { text: 'Reporte ISR Anual', path: '/reporte-isr', key: 'reporte-isr' },
      { text: 'Reporte Aguinaldo/Bono 14', path: '/reporte-aguinaldo', key: 'reporte-aguinaldo' },
      { text: 'Reporte de Descuentos', path: '/reporte-descuentos', key: 'reporte-descuentos' },
      { text: 'Reporte de Liquidaciones', path: '/reporte-liquidacion', key: 'reporte-liquidacion' },
      { text: 'Reporte KPIs', path: '/reporte-kpi', key: 'reporte-kpi' },
      { text: 'Reporte Horas Extra', path: '/reporte-horas-extra', key: 'reporte-horas-extra' },
      { text: 'Dashboard Ejecutivo', path: '/dashboard-ejecutivo', key: 'dashboard-ejecutivo' },
    ],
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
  if (normalized === 'AUDITORIA' || normalized === 'AUDITOR') return 'AUDITORIA';
  if (normalized === 'ANALISTANOMINA' || normalized === 'ANALISTADENOMINA') return 'ANALISTA_NOMINA';
  if (normalized === 'SUPERVISORASISTENCIA' || normalized === 'SUPERVISORDEASISTENCIA') return 'SUPERVISOR_ASISTENCIA';
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
