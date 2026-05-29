import api from '../api/axios';
import type { Empleado } from '../interfaces/empleados';
import type { ControlLaboral } from '../interfaces/controlLaboral';
import type { Departamento } from '../interfaces/departamentos';
import type { Sede } from '../interfaces/sede';
import type {
  VacacionesResponse,
  VacacionesParams,
  VacacionesEmpleadoFila,
  VacacionesEstado,
  VacacionesDepData,
} from '../interfaces/reporteVacaciones';

// ── constants ─────────────────────────────────────────────────────────────────

/** Días hábiles mínimos de vacaciones por año según Art. 130 Código de Trabajo */
const DIAS_POR_ANIO = 15;

// ── helpers ───────────────────────────────────────────────────────────────────

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function calcAniosCumplidos(fechaContratacion: unknown, hoy: Date): number {
  const f = parseDate(fechaContratacion);
  if (!f) return 0;
  let years = hoy.getFullYear() - f.getFullYear();
  const hasCumpleanio =
    hoy.getMonth() > f.getMonth() ||
    (hoy.getMonth() === f.getMonth() && hoy.getDate() >= f.getDate());
  if (!hasCumpleanio) years--;
  return Math.max(0, years);
}

function formatAntiguedad(anios: number): string {
  if (anios === 0) return 'Menos de 1 año';
  if (anios === 1) return '1 año';
  return `${anios} años`;
}

function getInclusiveDays(start?: string | null, end?: string | null): number {
  const startDate = parseDate(start);
  const endDate = parseDate(end || start);
  if (!startDate || !endDate || endDate < startDate) return 0;

  return Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
}

function calcEstado(
  diasPendientes: number,
  aniosCumplidos: number,
): VacacionesEstado {
  if (aniosCumplidos === 0) return 'En proceso';
  if (diasPendientes >= DIAS_POR_ANIO * 2) return 'Alerta';
  if (diasPendientes >= DIAS_POR_ANIO) return 'Pendiente';
  return 'Al día';
}

// ── main service ──────────────────────────────────────────────────────────────

export const getReporteVacaciones = async (
  params: VacacionesParams,
): Promise<VacacionesResponse> => {
  const hoy = new Date();

  const [empleadosRes, depRes, sedesRes, controlesRes] = await Promise.all([
    api.get<Empleado[]>('/empleados'),
    api.get<Departamento[]>('/departamentos'),
    api.get<Sede[]>('/sedes').catch(() => ({ data: [] as Sede[] })),
    api.get<ControlLaboral[]>('/control-laboral').catch(() => ({ data: [] as ControlLaboral[] })),
  ]);

  const empleados: Empleado[] = empleadosRes.data;
  const departamentos: Departamento[] = depRes.data;
  const sedes: Sede[] = sedesRes.data;
  const controles: ControlLaboral[] = controlesRes.data;

  const depMap  = new Map(departamentos.map((d) => [d.DEP_ID, d]));
  const sedeMap = new Map(sedes.map((s) => [s.SED_ID, s]));
  const vacacionesAprobadasPorEmpleado = controles
    .filter((control) => control.CTL_MOTIVO === 'VAC' && control.CTL_ESTADO === 'A')
    .reduce((map, control) => {
      const empId = Number(control.EMP_ID);
      map.set(empId, (map.get(empId) ?? 0) + getInclusiveDays(control.CTL_FECHA_INICIO, control.CTL_FECHA_REGRESO));
      return map;
    }, new Map<number, number>());

  // Only active employees
  let base = empleados.filter((e) => e.EMP_ESTADO === 'A');

  if (params.departamentoId) {
    base = base.filter((e) => e.DEP_ID === params.departamentoId);
  }
  if (params.sedeId) {
    base = base.filter((e) => e.SED_ID === params.sedeId);
  }

  // Build rows
  let rows: VacacionesEmpleadoFila[] = base.map((emp) => {
    const dep  = depMap.get(emp.DEP_ID ?? 0);
    const sede = sedeMap.get(emp.SED_ID ?? 0);

    const aniosCumplidos  = calcAniosCumplidos(emp.EMP_FECHA_CONTRATACION, hoy);
    const diasAcumulados  = aniosCumplidos * DIAS_POR_ANIO;
    const diasDisfrutados = Math.min(diasAcumulados, vacacionesAprobadasPorEmpleado.get(emp.EMP_ID) ?? 0);
    const diasPendientes  = diasAcumulados - diasDisfrutados;
    const usoPct          = diasAcumulados > 0
      ? Math.round((diasDisfrutados / diasAcumulados) * 100)
      : 0;
    const estado = calcEstado(diasPendientes, aniosCumplidos);

    return {
      EMP_ID:            emp.EMP_ID,
      EMPLEADO:          `${emp.EMP_NOMBRE} ${emp.EMP_APELLIDO}`,
      INICIALES:         getInitials(emp.EMP_NOMBRE, emp.EMP_APELLIDO),
      DEPARTAMENTO:      dep?.DEP_NOMBRE ?? '—',
      SEDE:              sede?.SED_NOMBRE ?? '—',
      ANTIGUEDAD_ANIOS:  aniosCumplidos,
      ANTIGUEDAD_LABEL:  formatAntiguedad(aniosCumplidos),
      DIAS_ACUMULADOS:   diasAcumulados,
      DIAS_DISFRUTADOS:  diasDisfrutados,
      DIAS_PENDIENTES:   diasPendientes,
      USO_PCT:           usoPct,
      ESTADO:            estado,
    };
  });

  if (params.antiguedadMin !== undefined && params.antiguedadMin > 0) {
    rows = rows.filter((r) => r.ANTIGUEDAD_ANIOS >= (params.antiguedadMin ?? 0));
  }
  if (params.estado) {
    rows = rows.filter((r) => r.ESTADO === params.estado);
  }

  // ── Resumen ───────────────────────────────────────────────────────────────
  const resumen = {
    totalAcumulados:    rows.reduce((s, r) => s + r.DIAS_ACUMULADOS,  0),
    totalDisfrutados:   rows.reduce((s, r) => s + r.DIAS_DISFRUTADOS, 0),
    totalPendientes:    rows.reduce((s, r) => s + r.DIAS_PENDIENTES,  0),
    empleadosConAlerta: rows.filter((r) => r.ESTADO === 'Alerta').length,
    totalEmpleados:     rows.length,
  };

  // ── Por departamento ──────────────────────────────────────────────────────
  const depNames = [...new Set(rows.map((r) => r.DEPARTAMENTO))].filter((d) => d !== '—');
  const porDepartamento: VacacionesDepData[] = depNames.map((dep) => {
    const emps = rows.filter((r) => r.DEPARTAMENTO === dep);
    return {
      departamento: dep.length > 8 ? dep.slice(0, 8) + '.' : dep,
      disfrutados:  emps.reduce((s, e) => s + e.DIAS_DISFRUTADOS, 0),
      pendientes:   emps.reduce((s, e) => s + e.DIAS_PENDIENTES,  0),
    };
  });

  return { empleados: rows, resumen, porDepartamento };
};

export const descargarPdfVacaciones = (_params: VacacionesParams): void => {
  alert('Generacion de PDF en desarrollo');
};
