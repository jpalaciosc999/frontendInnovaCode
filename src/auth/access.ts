export const ALL_PERMISSIONS = '*';

export type PermissionRequirement = {
  modulo: string;
  permiso: string;
};

export type AuthUserWithPermissions = {
  rol?: unknown;
  role?: unknown;
  rol_nombre?: unknown;
  ROL_NOMBRE?: unknown;
  permisos?: unknown[];
};

export function normalizePermiso(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

const normalizeCompact = (value: unknown) =>
  normalizePermiso(String(value ?? '')).replace(/[^a-z0-9]+/g, '');

export const toAccessKey = normalizeCompact;

export const permisosVista = {
  admin: [
    { modulo: 'ADMIN', permiso: 'Gestionar usuarios' },
    { modulo: 'ADMIN', permiso: 'Gestionar roles' },
    { modulo: 'ADMIN', permiso: 'Gestionar permisos' },
    { modulo: 'ADMIN', permiso: 'Ver bitacora' },
  ],
  usuarios: [{ modulo: 'ADMIN', permiso: 'Gestionar usuarios' }],
  roles: [{ modulo: 'ADMIN', permiso: 'Gestionar roles' }],
  permisos: [{ modulo: 'ADMIN', permiso: 'Gestionar permisos' }],
  bitacora: [{ modulo: 'ADMIN', permiso: 'Ver bitacora' }],
  usuarioBitacora: [
    { modulo: 'AUDITORIA', permiso: 'Ver usuario bitacora' },
    { modulo: 'ADMIN', permiso: 'Ver bitacora' },
  ],
  empleados: [
    { modulo: 'EMPLEADOS', permiso: 'Gestionar empleados' },
    { modulo: 'EMPLEADOS', permiso: 'Consultar empleados' },
  ],
  contratos: [{ modulo: 'CONTRATOS', permiso: 'Gestionar contratos' }],
  horarios: [{ modulo: 'ASISTENCIA', permiso: 'Gestionar horarios' }],
  marcajes: [{ modulo: 'ASISTENCIA', permiso: 'Validar marcajes' }],
  suspensionesIgss: [{ modulo: 'ASISTENCIA', permiso: 'Gestionar suspensiones IGSS' }],
  nominas: [
    { modulo: 'NOMINA', permiso: 'Generar nomina' },
    { modulo: 'NOMINA', permiso: 'Aprobar nomina' },
    { modulo: 'NOMINA', permiso: 'Consultar nomina' },
  ],
  periodos: [{ modulo: 'PERIODOS', permiso: 'Gestionar periodos' }],
  ingresos: [{ modulo: 'INGRESOS', permiso: 'Gestionar ingresos' }],
  descuentos: [{ modulo: 'DESCUENTOS', permiso: 'Gestionar descuentos' }],
  prestamos: [{ modulo: 'PRESTAMOS', permiso: 'Gestionar prestamos' }],
  liquidaciones: [{ modulo: 'LIQUIDACIONES', permiso: 'Gestionar liquidaciones' }],
  reportes: [{ modulo: 'REPORTES', permiso: 'Ver reportes gerenciales' }],
  rolPermisos: [
    { modulo: 'ADMIN', permiso: 'Gestionar roles' },
    { modulo: 'ADMIN', permiso: 'Gestionar permisos' },
  ],
} satisfies Record<string, PermissionRequirement[]>;

const aliasModulo: Record<string, string[]> = {
  admin: ['admin', 'administracion', 'auditoria'],
  reportes: ['reportes', 'gerencia', 'auditoria'],
  empleados: ['empleados', 'rrhh'],
  nomina: ['nomina', 'contabilidad'],
  asistencia: ['asistencia', 'rrhh'],
  auditoria: ['auditoria', 'admin', 'administracion'],
};

const pathToVista: Record<string, keyof typeof permisosVista> = {
  '/usuarios': 'usuarios',
  '/roles': 'roles',
  '/permisos': 'permisos',
  '/rol-permisos': 'rolPermisos',
  '/bitacora': 'bitacora',
  '/usuario-bitacora': 'usuarioBitacora',
  '/empleados': 'empleados',
  '/departamentos': 'empleados',
  '/puestos': 'empleados',
  '/sede': 'empleados',
  '/sucursales': 'empleados',
  '/cuenta-bancaria': 'empleados',
  '/kpis': 'reportes',
  '/kpi-resultado': 'reportes',
  '/tipo-contrato': 'contratos',
  '/empleado-contrato': 'contratos',
  '/horarios': 'horarios',
  '/marcajes': 'marcajes',
  '/resumen-marcaje': 'marcajes',
  '/control-laboral': 'marcajes',
  '/suspensiones-igss': 'suspensionesIgss',
  '/nomina-asignaciones': 'nominas',
  '/nomina': 'nominas',
  '/nomina-detalle': 'nominas',
  '/periodo': 'periodos',
  '/tipo-ingresos': 'ingresos',
  '/descuentos': 'descuentos',
  '/prestamos': 'prestamos',
  '/liquidacion': 'liquidaciones',
  '/aprobacion-nomina': 'nominas',
};

const getValue = (record: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return undefined;
};

export function isFullAccessUser(usuario: AuthUserWithPermissions | null | undefined) {
  const role = normalizePermiso(
    String(usuario?.rol_nombre ?? usuario?.ROL_NOMBRE ?? usuario?.rol ?? usuario?.role ?? '')
  );
  return ['supremo', 'superadmin', 'root'].includes(role);
}

export function tienePermiso(
  usuario: AuthUserWithPermissions | null | undefined,
  modulo: string,
  permiso: string
) {
  if (isFullAccessUser(usuario)) return true;

  const moduloEsperado = normalizePermiso(modulo);
  const permisoEsperado = normalizePermiso(permiso);
  const modulosAceptados = aliasModulo[moduloEsperado] || [moduloEsperado];

  return usuario?.permisos?.some((p) => {
    if (typeof p === 'string') {
      return normalizePermiso(p) === permisoEsperado;
    }

    if (!p || typeof p !== 'object') return false;

    const record = p as Record<string, unknown>;
    const moduloActual = normalizePermiso(
      String(getValue(record, ['PER_MODULO', 'per_modulo', 'modulo']) ?? '')
    );
    const permisoActual = normalizePermiso(
      String(
        getValue(record, [
          'PER_NOMBRE_PERMISO',
          'per_nombre_permiso',
          'nombre_permiso',
          'permiso',
          'nombre',
        ]) ?? ''
      )
    );

    return (!moduloActual || modulosAceptados.includes(moduloActual)) && permisoActual === permisoEsperado;
  }) ?? false;
}

export function puedeVerVista(
  usuario: AuthUserWithPermissions | null | undefined,
  vista: keyof typeof permisosVista
) {
  if (isFullAccessUser(usuario)) return true;
  return permisosVista[vista].some(({ modulo, permiso }) => tienePermiso(usuario, modulo, permiso));
}

export function getVistaForPath(path: string) {
  return pathToVista[path];
}

export function canAccessPath(usuario: AuthUserWithPermissions | null | undefined, path: string) {
  if (path === '/') return true;
  const vista = getVistaForPath(path);
  if (!vista) return false;
  return puedeVerVista(usuario, vista);
}

export function getTokenPermissionKeys(authUser: AuthUserWithPermissions | null | undefined) {
  if (isFullAccessUser(authUser)) return [ALL_PERMISSIONS];

  return (authUser?.permisos ?? [])
    .flatMap((permission) => {
      if (typeof permission === 'string') return [permission];
      if (!permission || typeof permission !== 'object') return [];

      const record = permission as Record<string, unknown>;
      return [
        record.permiso,
        record.nombre,
        record.nombre_permiso,
        record.per_nombre_permiso,
        record.PER_NOMBRE_PERMISO,
        record.modulo,
        record.per_modulo,
        record.PER_MODULO,
      ];
    })
    .map(normalizeCompact)
    .filter(Boolean);
}
