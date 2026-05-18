import api from '../api/axios';
import type { ReporteIgssResponse, ReporteIgssParams } from '../interfaces/reporteIgss';
import type { Empleado } from '../interfaces/empleados';
import type { Puesto } from '../interfaces/puestos';
import type { Departamento } from '../interfaces/departamentos';
import type { Nomina } from '../interfaces/nomina';
import type { Periodo } from '../interfaces/periodo';
import { obtenerSueldoMensual, TASA_IGSS_LABORAL, TASA_IGSS_PATRONAL } from '../utils/payroll';
import { obtenerSuspensionesIgss } from './suspensionIgss.service';

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

export const getReporteIgss = async (
  params: ReporteIgssParams
): Promise<ReporteIgssResponse> => {
  const [empleadosRes, puestosRes, departamentosRes, nominasRes, periodosRes] = await Promise.all([
    api.get<Empleado[]>('/empleados'),
    api.get<Puesto[]>('/puestos'),
    api.get<Departamento[]>('/departamentos'),
    api.get<Nomina[]>('/nominas/'),
    api.get<Periodo[]>('/periodo/'),
  ]);

  const empleados: Empleado[] = empleadosRes.data;
  const puestos: Puesto[] = puestosRes.data;
  const departamentos: Departamento[] = departamentosRes.data;
  const nominas: Nomina[] = nominasRes.data;
  const periodos: Periodo[] = periodosRes.data;

  const puestoMap = new Map(puestos.map((p) => [p.PUE_ID, p]));
  const depMap = new Map(departamentos.map((d) => [d.DEP_ID, d]));

  const periodoActual = params.periodoId
    ? periodos.find((p) => p.PER_ID === params.periodoId)
    : null;

  const nominasPeriodo = params.periodoId
    ? nominas.filter((n) => n.PER_ID === params.periodoId)
    : nominas;

  const nominaByEmp = new Map(nominasPeriodo.map((n) => [n.EMP_ID, n]));

  let empleadosFiltrados = empleados.filter((e) => e.EMP_ESTADO === 'A');

  if (params.departamentoId) {
    empleadosFiltrados = empleadosFiltrados.filter(
      (e) => e.DEP_ID === params.departamentoId
    );
  }

  // Load suspensiones y calcular dias suspendidos por empleado (sobre el período)
  const suspensiones = await obtenerSuspensionesIgss();

  const periodoInicio = periodoActual ? new Date(String(periodoActual.PER_FECHA_INICIO).slice(0, 10) + 'T00:00:00') : null;
  const periodoFin = periodoActual ? new Date(String(periodoActual.PER_FECHA_FIN).slice(0, 10) + 'T00:00:00') : null;
  const periodoDays = periodoInicio && periodoFin
    ? Math.ceil((periodoFin.getTime() - periodoInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 30;

  const suspensionMap = new Map<number, number>();
  for (const s of suspensiones) {
    if (s.SUS_ESTADO !== 'A') continue;
    const sStart = new Date(String(s.SUS_FECHA_INICIO).slice(0, 10) + 'T00:00:00');
    const sEnd = new Date(String(s.SUS_FECHA_FIN).slice(0, 10) + 'T00:00:00');
    if (!periodoInicio || !periodoFin) continue;
    const overlapStart = sStart > periodoInicio ? sStart : periodoInicio;
    const overlapEnd = sEnd < periodoFin ? sEnd : periodoFin;
    if (overlapEnd < overlapStart) continue;
    const overlapDays = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    suspensionMap.set(s.EMP_ID, (suspensionMap.get(s.EMP_ID) ?? 0) + overlapDays);
  }

  const rows = empleadosFiltrados.map((emp) => {
    const puesto = puestoMap.get(emp.PUE_ID ?? 0);
    const dep = depMap.get(emp.DEP_ID ?? 0);
    const salario = obtenerSueldoMensual(emp, puesto);
    const diasSuspendidos = suspensionMap.get(emp.EMP_ID) ?? 0;
    const diasTrabajados = Math.max(0, periodoDays - diasSuspendidos);
    const salarioReportado = periodoDays > 0 ? (salario * (diasTrabajados / periodoDays)) : salario;

    const patronal = salarioReportado * TASA_IGSS_PATRONAL;
    const laboral = salarioReportado * TASA_IGSS_LABORAL;
    const nomina = nominaByEmp.get(emp.EMP_ID);
    const nomEstado = String(nomina?.NOM_ESTADO ?? '').toLowerCase();
    const estado =
      nomEstado === 'aprobada' || nomEstado === 'pagada' || nomEstado === 'pagado'
        ? 'Pagado'
        : 'Pendiente';

    return {
      EMP_ID: emp.EMP_ID,
      EMPLEADO: `${emp.EMP_NOMBRE} ${emp.EMP_APELLIDO}`,
      INICIALES: getInitials(emp.EMP_NOMBRE, emp.EMP_APELLIDO),
      PUESTO: puesto?.PUE_NOMBRE ?? '—',
      DEPARTAMENTO: dep?.DEP_NOMBRE ?? '—',
      SALARIO_BASE: salarioReportado,
      DIAS_TRABAJADOS: diasTrabajados,
      DIAS_SUSPENDIDOS: diasSuspendidos,
      IGSS_PATRONAL: patronal,
      IGSS_LABORAL: laboral,
      TOTAL_IGSS: patronal + laboral,
      ESTADO: estado,
      SUSPENDIDO: diasSuspendidos > 0,
    };
  });

  const rowsFiltrados = params.estado
    ? rows.filter((r) => r.ESTADO === params.estado)
    : rows;

  const totalSalariosBase = rowsFiltrados.reduce((s, r) => s + r.SALARIO_BASE, 0);
  const igssPatronal = rowsFiltrados.reduce((s, r) => s + r.IGSS_PATRONAL, 0);
  const igssLaboral = rowsFiltrados.reduce((s, r) => s + r.IGSS_LABORAL, 0);
  const totalIgss = igssPatronal + igssLaboral;
  const todosPagados =
    rowsFiltrados.length > 0 && rowsFiltrados.every((r) => r.ESTADO === 'Pagado');

  const resumen = {
    totalSalariosBase,
    igssPatronal,
    igssLaboral,
    totalIgss,
    fechaLimitePago: periodoActual?.PER_FECHA_PAGO ?? '',
    estado: todosPagados ? 'Pagado' : 'Pendiente',
  };

  const depTotals = new Map<string, { patronal: number; laboral: number }>();
  for (const row of rowsFiltrados) {
    const cur = depTotals.get(row.DEPARTAMENTO) ?? { patronal: 0, laboral: 0 };
    depTotals.set(row.DEPARTAMENTO, {
      patronal: cur.patronal + row.IGSS_PATRONAL,
      laboral: cur.laboral + row.IGSS_LABORAL,
    });
  }

  const porDepartamento = Array.from(depTotals.entries()).map(
    ([departamento, totals]) => ({ departamento, ...totals })
  );

  return { empleados: rowsFiltrados, resumen, porDepartamento };
};

export const descargarPdfIgss = async (
  params: ReporteIgssParams
): Promise<void> => {
  const response = await api.get(`/api/reportes/igss/pdf`, {
    params,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(
    new Blob([response.data], { type: 'application/pdf' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-igss-${params.periodoId ?? 'todos'}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};

export const descargarCsvIgss = async (
  params: ReporteIgssParams
): Promise<void> => {
  const response = await api.get(`/api/reportes/igss/csv`, {
    params,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-igss-${params.periodoId ?? 'todos'}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const subirReciboIgss = async (periodoId: number, file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('periodoId', String(periodoId));
  return api.post('/api/reportes/igss/recibo', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const registrarNumeroRecibo = async (periodoId: number, numero: string) => {
  return api.post('/api/reportes/igss/recibo/numero', { periodoId, numero });
};
