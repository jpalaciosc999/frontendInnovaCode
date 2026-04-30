export const ALL_PERMISSIONS = '*';

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

export const toAccessKey = normalize;

const accessKeysByPath: Record<string, string[]> = {
  '/empleados': ['empleados', 'registroempleados', 'registrodeempleados'],
  '/usuarios': ['usuarios', 'registrosusuarios', 'registrosdeusuarios'],
  '/roles': ['roles', 'asignacionroles', 'asignacionderoles'],
  '/permisos': ['permisos', 'asignacionpermisos', 'asignaciondepermisos'],
  '/rol-permisos': ['rolpermisos', 'rolespermisos'],
  '/departamentos': ['departamentos'],
  '/puestos': ['puestos'],
  '/sede': ['sede', 'sedes', 'sucursal', 'sucursales'],
  '/horarios': ['horarios'],
  '/tipo-contrato': ['tipocontrato'],
  '/empleado-contrato': ['empleadocontrato'],
  '/cuenta-bancaria': ['cuentabancaria', 'cuentabancario', 'cuentabancarias', 'cuentabancarios'],
  '/tipos-descuento': ['tiposdescuento', 'descuentos'],
  '/nomina': ['nomina', 'aprobacionnomina', 'aprobaciondenomina'],
  '/nomina-detalle': ['nominadetalle'],
  '/periodo': ['periodo', 'periodos'],
  '/tipo-ingresos': ['tipoingresos', 'ingresos'],
  '/descuentos': ['descuentos'],
  '/liquidacion': ['liquidacion'],
  '/marcajes': ['marcajes', 'marcaje', 'resumenmarcaje', 'resumendemarcaje'],
  '/control-laboral': ['controllaboral'],
  '/prestamos': ['prestamos'],
  '/prestamo-detalle': ['prestamodetalle'],
  '/prestamos-banco': ['prestamosbanco', 'prestamos'],
  '/calculadora-igss': ['calculadoraigss', 'igss'],
  '/calculadora-isr': ['calculadoraisr', 'isr'],
  '/suspensiones-igss': ['suspensionesigss'],
  '/generar-csv': ['generarcsv', 'csvdeposito'],
  '/kpis': ['kpis'],
  '/kpi-resultado': ['kpiresultado', 'resultadoskpi'],
  '/bitacora': ['bitacora'],
  '/usuario-bitacora': ['usuariobitacora'],
};

export const getAccessKeysForPath = (path: string) =>
  accessKeysByPath[path] ?? [normalize(path.replace(/^\//, ''))];

export const canAccessPath = (permissions: string[], path: string) => {
  if (path === '/') return true;
  if (permissions.includes(ALL_PERMISSIONS)) return true;

  const routeKeys = getAccessKeysForPath(path);
  return routeKeys.some((key) => permissions.includes(key));
};
