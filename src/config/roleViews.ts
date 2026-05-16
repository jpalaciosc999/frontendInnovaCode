export type AppRole =
  | 'EMPLEADO'
  | 'ANALISTA_NOMINA'
  | 'CONSULTA_AUDITORIA'
  | 'GERENTE_RRHH'
  | 'SUPERVISOR_ASISTENCIA'
  | 'ADMINISTRADOR_NOMINA'
  | 'CONTABILIDAD';

export type AppView = {
  key: string;
  text: string;
  path: string;
  roles: AppRole[];
  pending?: boolean;
};

export const roleLabels: Record<AppRole, string> = {
  EMPLEADO: 'Empleado',
  ANALISTA_NOMINA: 'Analista Nomina',
  CONSULTA_AUDITORIA: 'Consulta Auditoria',
  GERENTE_RRHH: 'Gerente RRHH',
  SUPERVISOR_ASISTENCIA: 'Supervisor Asistencia',
  ADMINISTRADOR_NOMINA: 'Administrador Nomina',
  CONTABILIDAD: 'Contabilidad',
};

export const roleOrder: AppRole[] = [
  'EMPLEADO',
  'ANALISTA_NOMINA',
  'SUPERVISOR_ASISTENCIA',
  'GERENTE_RRHH',
  'CONTABILIDAD',
  'CONSULTA_AUDITORIA',
  'ADMINISTRADOR_NOMINA',
];

export const AUTH_USER_CHANGED_EVENT = 'auth-user-changed';

export const appViews: AppView[] = [
  {
    key: 'marcaje',
    text: 'Marcaje',
    path: '/marcajes',
    roles: ['EMPLEADO', 'SUPERVISOR_ASISTENCIA', 'GERENTE_RRHH'],
  },

  {
    key: 'resumen-marcaje',
    text: 'Resumen de Marcaje',
    path: '/resumen-marcaje',
    roles: ['SUPERVISOR_ASISTENCIA', 'GERENTE_RRHH'],
  },
  {
    key: 'registro-empleados',
    text: 'Registro de Empleados',
    path: '/empleados',
    roles: ['GERENTE_RRHH'],
  },
  {
    key: 'departamentos',
    text: 'Departamentos',
    path: '/departamentos',
    roles: ['GERENTE_RRHH'],
  },
  {
    key: 'puestos',
    text: 'Puestos',
    path: '/puestos',
    roles: ['GERENTE_RRHH'],
  },
  {
    key: 'sucursales',
    text: 'Sucursales',
    path: '/sucursales',
    roles: ['GERENTE_RRHH'],
  },
  {
    key: 'horarios',
    text: 'Horarios',
    path: '/horarios',
    roles: ['SUPERVISOR_ASISTENCIA', 'GERENTE_RRHH'],
  },
  {
    key: 'cuenta-bancaria',
    text: 'Cuenta Bancaria',
    path: '/cuenta-bancaria',
    roles: ['GERENTE_RRHH', 'CONTABILIDAD'],
  },
  {
    key: 'kpis',
    text: 'KPIs',
    path: '/kpis',
    roles: ['GERENTE_RRHH'],
  },
  {
    key: 'kpi-resultado',
    text: 'Resultados KPI',
    path: '/kpi-resultado',
    roles: ['GERENTE_RRHH'],
  },
  {
    key: 'suspensiones-igss',
    text: 'Suspensiones de IGSS',
    path: '/suspensiones-igss',
    roles: ['GERENTE_RRHH'],
  },
  {
    key: 'control-laboral',
    text: 'Control Laboral',
    path: '/control-laboral',
    roles: ['GERENTE_RRHH'],
  },
  {
    key: 'empleado-contrato',
    text: 'Empleado Contrato',
    path: '/empleado-contrato',
    roles: ['GERENTE_RRHH'],
  },
  {
    key: 'tipo-contrato',
    text: 'Tipo Contrato',
    path: '/tipo-contrato',
    roles: ['GERENTE_RRHH'],
  },

  {
    key: 'asignacion-roles',
    text: 'Roles',
    path: '/roles',
    roles: ['ADMINISTRADOR_NOMINA'],
  },
  {
    key: 'asignacion-permisos',
    text: 'Permisos',
    path: '/permisos',
    roles: ['ADMINISTRADOR_NOMINA'],
  },
  {
    key: 'registro-usuarios',
    text: 'Usuarios',
    path: '/usuarios',
    roles: ['ADMINISTRADOR_NOMINA'],
  },
  {
    key: 'roles-permisos',
    text: 'Roles y Permisos',
    path: '/rol-permisos',
    roles: ['ADMINISTRADOR_NOMINA'],
  },
  {
    key: 'bitacora',
    text: 'Bitácora',
    path: '/bitacora',
    roles: ['ADMINISTRADOR_NOMINA', 'CONSULTA_AUDITORIA'],
  },
  {
    key: 'mi-tiendita',
    text: 'Mi Tiendita',
    path: '/mi-tiendita',
    roles: ['EMPLEADO', 'ADMINISTRADOR_NOMINA', 'CONTABILIDAD'],
  },
  {
    key: 'usuario-bitacora',
    text: 'Trazabilidad Usuario-Bitácora',
    path: '/usuario-bitacora',
    roles: ['ADMINISTRADOR_NOMINA', 'CONSULTA_AUDITORIA'],
  },

  {
    key: 'nomina',
    text: 'Nomina',
    path: '/nomina',
    roles: ['ANALISTA_NOMINA', 'ADMINISTRADOR_NOMINA', 'CONTABILIDAD'],
  },
  {
    key: 'nomina-detalle',
    text: 'Nomina Detalle',
    path: '/nomina-detalle',
    roles: ['ANALISTA_NOMINA', 'ADMINISTRADOR_NOMINA', 'CONTABILIDAD'],
  },
  {
    key: 'periodos',
    text: 'Periodos',
    path: '/periodo',
    roles: ['ANALISTA_NOMINA', 'ADMINISTRADOR_NOMINA', 'CONTABILIDAD'],
  },
  {
    key: 'tipo-ingresos',
    text: 'Ingresos',
    path: '/tipo-ingresos',
    roles: ['ANALISTA_NOMINA', 'ADMINISTRADOR_NOMINA', 'CONTABILIDAD'],
  },
  {
    key: 'descuentos',
    text: 'Descuentos',
    path: '/descuentos',
    roles: ['ANALISTA_NOMINA', 'ADMINISTRADOR_NOMINA', 'CONTABILIDAD'],
  },
  {
    key: 'prestamos',
    text: 'Prestamos',
    path: '/prestamos',
    roles: ['ANALISTA_NOMINA', 'ADMINISTRADOR_NOMINA', 'CONTABILIDAD'],
  },
  {
    key: 'prestamo-detalle',
    text: 'Detalle Prestamo',
    path: '/prestamo-detalle',
    roles: ['ANALISTA_NOMINA', 'ADMINISTRADOR_NOMINA', 'CONTABILIDAD'],
  },
  {
    key: 'liquidacion',
    text: 'Liquidacion',
    path: '/liquidacion',
    roles: ['ANALISTA_NOMINA', 'ADMINISTRADOR_NOMINA', 'CONTABILIDAD'],
  },
  {
    key: 'calculadora-igss',
    text: 'Calculadora IGSS',
    path: '/calculadora-igss',
    roles: ['ANALISTA_NOMINA', 'ADMINISTRADOR_NOMINA', 'CONTABILIDAD'],
  },
  {
    key: 'calculadora-isr',
    text: 'Calculadora ISR',
    path: '/calculadora-isr',
    roles: ['ANALISTA_NOMINA', 'ADMINISTRADOR_NOMINA', 'CONTABILIDAD'],
  },
  {
    key: 'generar-csv',
    text: 'Generar CSV Deposito',
    path: '/generar-csv',
    roles: ['ADMINISTRADOR_NOMINA', 'CONTABILIDAD'],
  },

  {
    key: 'aprobacion-nomina',
    text: 'Aprobacion de Nomina',
    path: '/aprobacion-nomina',
    roles: ['ADMINISTRADOR_NOMINA', 'GERENTE_RRHH'],
  },
];

export const legacyViews: AppView[] = [
  {
    key: 'sede',
    text: 'Sede',
    path: '/sede',
    roles: ['GERENTE_RRHH'],
  },
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

  if (normalized === 'ANALISTANOMINA') return 'ANALISTA_NOMINA';

  if (normalized === 'CONSULTAAUDITORIA') return 'CONSULTA_AUDITORIA';

  if (
    normalized === 'GERENTERRHH' ||
    normalized === 'GERENTERH' ||
    normalized === 'GERENTERECURSOSHUMANOS'
  ) {
    return 'GERENTE_RRHH';
  }

  if (normalized === 'SUPERVISORASISTENCIA') {
    return 'SUPERVISOR_ASISTENCIA';
  }

  if (
    normalized === 'ADMINISTRADORNOMINA' ||
    normalized === 'ADMINNOMINA'
  ) {
    return 'ADMINISTRADOR_NOMINA';
  }

  if (
    normalized === 'CONTABILIDAD' ||
    normalized === 'CONTADOR'
  ) {
    return 'CONTABILIDAD';
  }

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
    normalizeRole(record.ROL_DESCRIPCION) ||
    normalizeRole(record.rol_descripcion) ||
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

    return String(
      user.id ??
      user.USU_ID ??
      user.usu_id ??
      user.usuario_id ??
      ''
    );
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

  if (!role) return false;

  if (role === 'ADMINISTRADOR_NOMINA') return true;

  const view = allViews.find((item) => item.path === path);

  return Boolean(view?.roles.includes(role));
}