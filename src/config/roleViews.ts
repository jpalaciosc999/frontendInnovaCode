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
  RRHH: 'Gerente RRHH',
  ADMIN: 'Admin Nomina',
  CONTABILIDAD: 'Contabilidad',
  GERENTE: 'Gerente RRHH',
  AUDITORIA: 'Consulta Auditoria',
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
  { key: 'reportes', text: 'Reportes', path: '/reportes', roles: ['RRHH', 'ADMIN', 'CONTABILIDAD', 'GERENTE', 'AUDITORIA', 'ANALISTA_NOMINA', 'SUPREMO'] },

  { key: 'resumen-marcaje', text: 'Resumen de Marcaje', path: '/resumen-marcaje', roles: ['ADMIN', 'RRHH', 'GERENTE', 'SUPERVISOR_ASISTENCIA'] },
  { key: 'reporte-marcajes', text: 'Reporte de Marcajes', path: '/reporte-marcajes', roles: ['RRHH', 'ADMIN', 'AUDITORIA', 'GERENTE'] },
  { key: 'reporte-vacaciones', text: 'Reporte de Vacaciones', path: '/reporte-vacaciones', roles: ['RRHH', 'ADMIN', 'GERENTE', 'AUDITORIA'] },
  { key: 'registro-empleados', text: 'Registro de Empleados', path: '/empleados', roles: ['ADMIN', 'RRHH', 'GERENTE', 'ANALISTA_NOMINA'] },
  { key: 'departamentos', text: 'Departamentos', path: '/departamentos', roles: ['ADMIN', 'RRHH', 'GERENTE', 'ANALISTA_NOMINA'] },
  { key: 'puestos', text: 'Puestos', path: '/puestos', roles: ['ADMIN', 'RRHH', 'GERENTE', 'ANALISTA_NOMINA'] },
  { key: 'sucursales', text: 'Sucursales', path: '/sucursales', roles: ['ADMIN', 'RRHH', 'GERENTE'] },
  { key: 'horarios', text: 'Horarios', path: '/horarios', roles: ['ADMIN', 'RRHH', 'GERENTE', 'ANALISTA_NOMINA', 'SUPERVISOR_ASISTENCIA', 'EMPLEADO'] },
  { key: 'cuenta-bancaria', text: 'Cuenta Bancaria', path: '/cuenta-bancaria', roles: ['ADMIN', 'RRHH', 'GERENTE', 'ANALISTA_NOMINA'] },
  { key: 'kpis', text: 'KPIs', path: '/kpis', roles: ['ADMIN', 'RRHH', 'GERENTE'] },
  { key: 'kpi-resultado', text: 'Resultados KPI', path: '/kpi-resultado', roles: ['ADMIN', 'RRHH', 'GERENTE', 'EMPLEADO'] },
  { key: 'suspensiones-igss', text: 'Suspensiones de IGSS', path: '/suspensiones-igss', roles: ['ADMIN', 'RRHH', 'GERENTE', 'ANALISTA_NOMINA', 'SUPERVISOR_ASISTENCIA'] },
  { key: 'control-laboral', text: 'Control Laboral', path: '/control-laboral', roles: ['ADMIN', 'RRHH', 'GERENTE', 'ANALISTA_NOMINA', 'SUPERVISOR_ASISTENCIA'] },
  { key: 'empleado-contrato', text: 'Empleado Contrato', path: '/empleado-contrato', roles: ['ADMIN', 'RRHH', 'GERENTE', 'ANALISTA_NOMINA'] },
  { key: 'tipo-contrato', text: 'Tipo Contrato', path: '/tipo-contrato', roles: ['ADMIN', 'RRHH', 'GERENTE', 'ANALISTA_NOMINA'] },

  { key: 'asignacion-roles', text: 'Roles', path: '/roles', roles: ['ADMIN'] },
  { key: 'asignacion-permisos', text: 'Permisos', path: '/permisos', roles: ['ADMIN'] },
  { key: 'registro-usuarios', text: 'Usuarios', path: '/usuarios', roles: ['ADMIN'] },
  { key: 'roles-permisos', text: 'Roles y Permisos', path: '/rol-permisos', roles: ['ADMIN'] },
  { key: 'bitacora', text: 'Bitácora', path: '/bitacora', roles: ['ADMIN', 'AUDITORIA'] },
  { key: 'usuario-bitacora', text: 'Trazabilidad Usuario-Bitácora', path: '/usuario-bitacora', roles: ['ADMIN', 'AUDITORIA'] },

  { key: 'nomina-asignaciones', text: 'Asignaciones Nomina', path: '/nomina-asignaciones', roles: ['ADMIN', 'RRHH', 'GERENTE', 'CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'nomina', text: 'Nomina', path: '/nomina', roles: ['ADMIN', 'RRHH', 'GERENTE', 'CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'nomina-detalle', text: 'Nomina Detalle', path: '/nomina-detalle', roles: ['ADMIN', 'RRHH', 'GERENTE', 'CONTABILIDAD', 'ANALISTA_NOMINA', 'EMPLEADO'] },
  { key: 'periodos', text: 'Periodos', path: '/periodo', roles: ['ADMIN', 'RRHH', 'GERENTE', 'ANALISTA_NOMINA'] },
  { key: 'tipo-ingresos', text: 'Ingresos', path: '/tipo-ingresos', roles: ['ADMIN', 'RRHH', 'GERENTE', 'CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'descuentos', text: 'Descuentos', path: '/descuentos', roles: ['ADMIN', 'RRHH', 'GERENTE', 'CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'prestamos', text: 'Prestamos', path: '/prestamos', roles: ['ADMIN', 'RRHH', 'GERENTE', 'CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'liquidacion', text: 'Liquidacion', path: '/liquidacion', roles: ['ADMIN', 'RRHH', 'GERENTE', 'CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'calculadora-igss', text: 'Calculadora IGSS', path: '/calculadora-igss', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'calculadora-isr', text: 'Calculadora ISR', path: '/calculadora-isr', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'generar-csv', text: 'Generar CSV Deposito', path: '/generar-csv', roles: ['CONTABILIDAD', 'ANALISTA_NOMINA'] },
  { key: 'reporte-igss', text: 'Reporte IGSS', path: '/reporte-igss', roles: ['ADMIN', 'RRHH', 'GERENTE', 'CONTABILIDAD', 'ANALISTA_NOMINA', 'AUDITORIA'] },
  { key: 'reporte-isr', text: 'Reporte ISR Anual', path: '/reporte-isr', roles: ['ADMIN', 'RRHH', 'GERENTE', 'CONTABILIDAD', 'ANALISTA_NOMINA', 'AUDITORIA'] },
  { key: 'reporte-aguinaldo', text: 'Reporte Aguinaldo/Bono 14', path: '/reporte-aguinaldo', roles: ['ADMIN', 'CONTABILIDAD', 'RRHH', 'GERENTE', 'ANALISTA_NOMINA', 'AUDITORIA'] },
  { key: 'reporte-descuentos', text: 'Reporte de Descuentos', path: '/reporte-descuentos', roles: ['ADMIN', 'RRHH', 'GERENTE', 'CONTABILIDAD', 'ANALISTA_NOMINA', 'AUDITORIA'] },
  { key: 'reporte-liquidacion', text: 'Reporte de Liquidaciones', path: '/reporte-liquidacion', roles: ['ADMIN', 'RRHH', 'GERENTE', 'CONTABILIDAD', 'ANALISTA_NOMINA', 'AUDITORIA'] },
  { key: 'reporte-kpi', text: 'Reporte KPIs', path: '/reporte-kpi', roles: ['ADMIN', 'RRHH', 'GERENTE', 'AUDITORIA'] },
  { key: 'reporte-horas-extra', text: 'Reporte Horas Extra', path: '/reporte-horas-extra', roles: ['ADMIN', 'RRHH', 'GERENTE', 'CONTABILIDAD', 'ANALISTA_NOMINA', 'AUDITORIA'] },
  { key: 'dashboard-ejecutivo', text: 'Dashboard Ejecutivo', path: '/dashboard-ejecutivo', roles: ['ADMIN', 'RRHH', 'GERENTE', 'AUDITORIA'] },
  { key: 'aprobacion-nomina', text: 'Aprobacion de Nomina', path: '/aprobacion-nomina', roles: ['ADMIN', 'RRHH', 'GERENTE'] },
];

export const legacyViews: AppView[] = [
  { key: 'sede', text: 'Sede', path: '/sede', roles: ['ADMIN', 'RRHH', 'GERENTE'] },
];

export const allViews = [...appViews, ...legacyViews];

  export type ReportItem = {
    text: string;
    path: string;
    key: string;
  };

  const allReportItems: ReportItem[] = [
    { text: 'Reporte de Marcajes', path: '/reporte-marcajes', key: 'reporte-marcajes' },
    { text: 'Reporte IGSS', path: '/reporte-igss', key: 'reporte-igss' },
    { text: 'Reporte ISR Anual', path: '/reporte-isr', key: 'reporte-isr' },
    { text: 'Reporte Aguinaldo/Bono 14', path: '/reporte-aguinaldo', key: 'reporte-aguinaldo' },
    { text: 'Reporte de Vacaciones', path: '/reporte-vacaciones', key: 'reporte-vacaciones' },
    { text: 'Reporte de Descuentos', path: '/reporte-descuentos', key: 'reporte-descuentos' },
    { text: 'Reporte de Liquidaciones', path: '/reporte-liquidacion', key: 'reporte-liquidacion' },
    { text: 'Reporte KPIs', path: '/reporte-kpi', key: 'reporte-kpi' },
    { text: 'Reporte Horas Extra', path: '/reporte-horas-extra', key: 'reporte-horas-extra' },
    { text: 'Dashboard Ejecutivo', path: '/dashboard-ejecutivo', key: 'dashboard-ejecutivo' },
  ];

  const payrollReportItems: ReportItem[] = allReportItems.filter((reporte) =>
    [
      'reporte-igss',
      'reporte-isr',
      'reporte-aguinaldo',
      'reporte-descuentos',
      'reporte-liquidacion',
      'reporte-horas-extra',
    ].includes(reporte.key)
  );

  export const reportesPorRol: Record<AppRole, ReportItem[]> = {
    EMPLEADO: [],
    RRHH: allReportItems,
    ADMIN: allReportItems,
    CONTABILIDAD: payrollReportItems,
    GERENTE: allReportItems,
    AUDITORIA: allReportItems,
    ANALISTA_NOMINA: payrollReportItems,
    SUPERVISOR_ASISTENCIA: [],
    SUPREMO: allReportItems,
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
  if (normalized === 'ADMIN' || normalized === 'ADMINISTRADOR' || normalized === 'ADMINISTRADORNOMINA' || normalized === 'N1') return 'ADMIN';
  if (normalized === 'CONTABILIDAD' || normalized === 'CONTADOR' || normalized === 'N40') return 'CONTABILIDAD';
  if (normalized === 'GERENTE' || normalized === 'MANAGER' || normalized === 'GERENTERRHH' || normalized === 'N10') return 'GERENTE';
  if (normalized === 'AUDITORIA' || normalized === 'AUDITOR' || normalized === 'CONSULTAAUDITORIA' || normalized === 'CONSULTAAUDIT') return 'AUDITORIA';
  if (normalized === 'ANALISTANOMINA' || normalized === 'ANALISTADENOMINA' || normalized === 'N20') return 'ANALISTA_NOMINA';
  if (normalized === 'SUPERVISORASISTENCIA' || normalized === 'SUPERVISORDEASISTENCIA' || normalized === 'SUPASISTENCIA' || normalized === 'N30') return 'SUPERVISOR_ASISTENCIA';
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

  const objectKeys = ['user', 'usuario', 'authUser', 'currentUser'];
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
  if (role === 'ADMIN' || role === 'SUPREMO') return true;

  const view = allViews.find((item) => item.path === path);
  return Boolean(view?.roles.includes(role));
}
