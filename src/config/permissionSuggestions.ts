import type { AppRole } from './roleViews';

export type SuggestedPermission = {
  nombre: string;
  modulo: string;
  descripcion: string;
};

export const suggestedPermissions: SuggestedPermission[] = [
  { nombre: 'VER_MARCAJE', modulo: 'MARCAJE', descripcion: 'Permite consultar y registrar marcajes propios.' },

  { nombre: 'VER_RESUMEN_MARCAJE', modulo: 'ASISTENCIA', descripcion: 'Permite consultar resumenes de marcaje.' },
  { nombre: 'GESTIONAR_HORARIOS', modulo: 'ASISTENCIA', descripcion: 'Permite administrar horarios.' },
  { nombre: 'GESTIONAR_SUSPENSIONES_IGSS', modulo: 'ASISTENCIA', descripcion: 'Permite registrar suspensiones de IGSS.' },

  { nombre: 'GESTIONAR_EMPLEADOS', modulo: 'RRHH', descripcion: 'Permite crear, editar y consultar empleados.' },
  { nombre: 'GESTIONAR_DEPARTAMENTOS', modulo: 'RRHH', descripcion: 'Permite administrar departamentos.' },
  { nombre: 'GESTIONAR_PUESTOS', modulo: 'RRHH', descripcion: 'Permite administrar puestos.' },
  { nombre: 'GESTIONAR_SUCURSALES', modulo: 'RRHH', descripcion: 'Permite administrar sucursales o sedes.' },
  { nombre: 'GESTIONAR_CUENTAS_BANCARIAS', modulo: 'RRHH', descripcion: 'Permite administrar cuentas bancarias de empleados.' },
  { nombre: 'VER_KPIS', modulo: 'RRHH', descripcion: 'Permite consultar indicadores KPI.' },
  { nombre: 'VER_KPI_RESULTADO', modulo: 'RRHH', descripcion: 'Permite consultar resultados de KPI por empleado.' },
  { nombre: 'GESTIONAR_CONTROL_LABORAL', modulo: 'RRHH', descripcion: 'Permite registrar permisos, vacaciones y controles laborales.' },
  { nombre: 'VER_EMPLEADO_CONTRATO', modulo: 'RRHH', descripcion: 'Permite consultar el historial de contratos por empleado.' },
  { nombre: 'GESTIONAR_TIPO_CONTRATO', modulo: 'RRHH', descripcion: 'Permite administrar el catálogo de tipos de contrato.' },

  { nombre: 'GESTIONAR_ROLES', modulo: 'ADMIN', descripcion: 'Permite administrar roles.' },
  { nombre: 'GESTIONAR_PERMISOS', modulo: 'ADMIN', descripcion: 'Permite administrar permisos.' },
  { nombre: 'GESTIONAR_USUARIOS', modulo: 'ADMIN', descripcion: 'Permite administrar usuarios.' },
  { nombre: 'ASIGNAR_ROL_PERMISOS', modulo: 'ADMIN', descripcion: 'Permite asignar permisos a roles.' },
  { nombre: 'VER_BITACORA', modulo: 'ADMIN', descripcion: 'Permite consultar bitácoras del sistema.' },
  { nombre: 'VER_USUARIO_BITACORA', modulo: 'AUDITORIA', descripcion: 'Permite consultar la relación entre usuarios y bitácoras.' },

  { nombre: 'GESTIONAR_MI_TIENDITA', modulo: 'NOMINA', descripcion: 'Permite administrar pagos y descuentos de Mi Tiendita.' },
  { nombre: 'GESTIONAR_NOMINA', modulo: 'NOMINA', descripcion: 'Permite administrar nomina.' },
  { nombre: 'VER_NOMINA_DETALLE', modulo: 'NOMINA', descripcion: 'Permite consultar detalle de nomina.' },
  { nombre: 'GESTIONAR_PERIODOS', modulo: 'NOMINA', descripcion: 'Permite administrar periodos.' },
  { nombre: 'GESTIONAR_INGRESOS', modulo: 'NOMINA', descripcion: 'Permite administrar tipos de ingresos.' },
  { nombre: 'GESTIONAR_LIQUIDACIONES', modulo: 'NOMINA', descripcion: 'Permite administrar liquidaciones.' },
  { nombre: 'GENERAR_CSV_DEPOSITO', modulo: 'NOMINA', descripcion: 'Permite generar archivo CSV de depósito bancario.' },
  { nombre: 'GESTIONAR_ISR', modulo: 'NOMINA', descripcion: 'Permite administrar ISR.' },
  { nombre: 'GESTIONAR_IRTRA', modulo: 'NOMINA', descripcion: 'Permite administrar IRTRA.' },
  { nombre: 'GESTIONAR_INTECAP', modulo: 'NOMINA', descripcion: 'Permite administrar INTECAP.' },
  { nombre: 'GESTIONAR_PRESTAMOS', modulo: 'NOMINA', descripcion: 'Permite administrar prestamos.' },
  { nombre: 'USAR_CALCULADORA_IGSS', modulo: 'NOMINA', descripcion: 'Permite usar calculadora IGSS.' },
  { nombre: 'USAR_CALCULADORA_ISR', modulo: 'NOMINA', descripcion: 'Permite usar calculadora ISR.' },

  { nombre: 'APROBAR_NOMINA', modulo: 'REPORTES', descripcion: 'Permite aprobar nomina.' },
  { nombre: 'VER_REPORTES_GERENCIALES', modulo: 'REPORTES', descripcion: 'Permite consultar reportes gerenciales.' },
];

export const suggestedPermissionNamesByRole: Record<AppRole, string[]> = {
  EMPLEADO: [
    'VER_MARCAJE',
  ],

  SUPERVISOR_ASISTENCIA: [
    'VER_MARCAJE',
    'VER_RESUMEN_MARCAJE',
    'GESTIONAR_HORARIOS',
    'GESTIONAR_SUSPENSIONES_IGSS',
  ],

  GERENTE_RRHH: [
    'VER_RESUMEN_MARCAJE',
    'GESTIONAR_EMPLEADOS',
    'GESTIONAR_DEPARTAMENTOS',
    'GESTIONAR_PUESTOS',
    'GESTIONAR_SUCURSALES',
    'GESTIONAR_HORARIOS',
    'GESTIONAR_CUENTAS_BANCARIAS',
    'VER_KPIS',
    'VER_KPI_RESULTADO',
    'GESTIONAR_SUSPENSIONES_IGSS',
    'GESTIONAR_CONTROL_LABORAL',
    'VER_EMPLEADO_CONTRATO',
    'GESTIONAR_TIPO_CONTRATO',
    'APROBAR_NOMINA',
    'VER_REPORTES_GERENCIALES',
  ],

  ANALISTA_NOMINA: [
    'GESTIONAR_NOMINA',
    'VER_NOMINA_DETALLE',
    'GESTIONAR_PERIODOS',
    'GESTIONAR_INGRESOS',
    'GESTIONAR_LIQUIDACIONES',
    'GESTIONAR_ISR',
    'GESTIONAR_IRTRA',
    'GESTIONAR_INTECAP',
    'GESTIONAR_PRESTAMOS',
    'USAR_CALCULADORA_IGSS',
    'USAR_CALCULADORA_ISR',
  ],

  CONTABILIDAD: [
    'GESTIONAR_MI_TIENDITA',
    'GESTIONAR_NOMINA',
    'VER_NOMINA_DETALLE',
    'GESTIONAR_PERIODOS',
    'GESTIONAR_INGRESOS',
    'GESTIONAR_LIQUIDACIONES',
    'GENERAR_CSV_DEPOSITO',
    'GESTIONAR_ISR',
    'GESTIONAR_IRTRA',
    'GESTIONAR_INTECAP',
    'GESTIONAR_PRESTAMOS',
    'USAR_CALCULADORA_IGSS',
    'USAR_CALCULADORA_ISR',
  ],

  CONSULTA_AUDITORIA: [
    'VER_BITACORA',
    'VER_USUARIO_BITACORA',
  ],

  ADMINISTRADOR_NOMINA: suggestedPermissions.map((permiso) => permiso.nombre),
};