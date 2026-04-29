import type { AppRole } from './roleViews';

export type SuggestedPermission = {
  nombre: string;
  modulo: string;
  descripcion: string;
};

export const suggestedPermissions: SuggestedPermission[] = [
  { nombre: 'VER_MARCAJE', modulo: 'Marcaje', descripcion: 'Permite consultar y registrar marcajes propios.' },
  { nombre: 'VER_RESUMEN_MARCAJE', modulo: 'RRHH', descripcion: 'Permite consultar resumenes de marcaje.' },
  { nombre: 'GESTIONAR_EMPLEADOS', modulo: 'RRHH', descripcion: 'Permite crear, editar y consultar empleados.' },
  { nombre: 'GESTIONAR_DEPARTAMENTOS', modulo: 'RRHH', descripcion: 'Permite administrar departamentos.' },
  { nombre: 'GESTIONAR_PUESTOS', modulo: 'RRHH', descripcion: 'Permite administrar puestos.' },
  { nombre: 'GESTIONAR_SUCURSALES', modulo: 'RRHH', descripcion: 'Permite administrar sucursales o sedes.' },
  { nombre: 'GESTIONAR_HORARIOS', modulo: 'RRHH', descripcion: 'Permite administrar horarios.' },
  { nombre: 'GESTIONAR_CUENTAS_BANCARIAS', modulo: 'RRHH', descripcion: 'Permite administrar cuentas bancarias de empleados.' },
  { nombre: 'VER_KPIS', modulo: 'RRHH', descripcion: 'Permite consultar indicadores KPI.' },
  { nombre: 'GESTIONAR_SUSPENSIONES_IGSS', modulo: 'RRHH', descripcion: 'Permite registrar suspensiones de IGSS.' },
  { nombre: 'GESTIONAR_VACACIONES', modulo: 'RRHH', descripcion: 'Permite registrar vacaciones.' },
  { nombre: 'GESTIONAR_ROLES', modulo: 'Administracion', descripcion: 'Permite administrar roles.' },
  { nombre: 'GESTIONAR_PERMISOS', modulo: 'Administracion', descripcion: 'Permite administrar permisos.' },
  { nombre: 'GESTIONAR_USUARIOS', modulo: 'Administracion', descripcion: 'Permite administrar usuarios.' },
  { nombre: 'ASIGNAR_ROL_PERMISOS', modulo: 'Administracion', descripcion: 'Permite asignar permisos a roles.' },
  { nombre: 'VER_BITACORA', modulo: 'Auditoria', descripcion: 'Permite consultar bitacoras del sistema.' },
  { nombre: 'GESTIONAR_NOMINA', modulo: 'Contabilidad', descripcion: 'Permite administrar nomina.' },
  { nombre: 'VER_NOMINA_DETALLE', modulo: 'Contabilidad', descripcion: 'Permite consultar detalle de nomina.' },
  { nombre: 'GESTIONAR_PERIODOS', modulo: 'Contabilidad', descripcion: 'Permite administrar periodos.' },
  { nombre: 'GESTIONAR_ISR', modulo: 'Contabilidad', descripcion: 'Permite administrar ISR.' },
  { nombre: 'GESTIONAR_IRTRA', modulo: 'Contabilidad', descripcion: 'Permite administrar IRTRA.' },
  { nombre: 'GESTIONAR_INTECAP', modulo: 'Contabilidad', descripcion: 'Permite administrar INTECAP.' },
  { nombre: 'GESTIONAR_PRESTAMOS', modulo: 'Contabilidad', descripcion: 'Permite administrar prestamos.' },
  { nombre: 'USAR_CALCULADORA_IGSS', modulo: 'Contabilidad', descripcion: 'Permite usar calculadora IGSS.' },
  { nombre: 'USAR_CALCULADORA_ISR', modulo: 'Contabilidad', descripcion: 'Permite usar calculadora ISR.' },
  { nombre: 'APROBAR_NOMINA', modulo: 'Gerencia', descripcion: 'Permite aprobar nomina.' },
];

export const suggestedPermissionNamesByRole: Record<AppRole, string[]> = {
  EMPLEADO: ['VER_MARCAJE'],
  RRHH: [
    'VER_RESUMEN_MARCAJE',
    'GESTIONAR_EMPLEADOS',
    'GESTIONAR_DEPARTAMENTOS',
    'GESTIONAR_PUESTOS',
    'GESTIONAR_SUCURSALES',
    'GESTIONAR_HORARIOS',
    'GESTIONAR_CUENTAS_BANCARIAS',
    'VER_KPIS',
    'GESTIONAR_SUSPENSIONES_IGSS',
    'GESTIONAR_VACACIONES',
  ],
  ADMIN: [
    'GESTIONAR_ROLES',
    'GESTIONAR_PERMISOS',
    'GESTIONAR_USUARIOS',
    'ASIGNAR_ROL_PERMISOS',
    'VER_BITACORA',
  ],
  CONTABILIDAD: [
    'GESTIONAR_NOMINA',
    'VER_NOMINA_DETALLE',
    'GESTIONAR_PERIODOS',
    'GESTIONAR_ISR',
    'GESTIONAR_IRTRA',
    'GESTIONAR_INTECAP',
    'GESTIONAR_PRESTAMOS',
    'USAR_CALCULADORA_IGSS',
    'USAR_CALCULADORA_ISR',
  ],
  GERENTE: ['APROBAR_NOMINA'],
  SUPREMO: suggestedPermissions.map((permiso) => permiso.nombre),
};
