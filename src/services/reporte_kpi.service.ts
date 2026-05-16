import { obtenerKPIs }         from './kpi.service';
import { obtenerResultados }    from './kpi-resultado.service';
import { obtenerEmpleados }     from './empleados.service';
import { obtenerDepartamentos } from './departamentos.service';

import type { KPI }         from '../interfaces/kpi';
import type { KPIResultado } from '../interfaces/kpi-resultado';
import type { Empleado }    from '../interfaces/empleados';
import type { Departamento } from '../interfaces/departamentos';
import type {
  KpiEstado,
  KpiEmpleadoFila,
  KpiDepData,
  KpiIncumplido,
  KpiResumen,
  KpiAvancePorIndicador,
  KpiParams,
  KpiResponse,
} from '../interfaces/reporteKpi';

// ── helpers ───────────────────────────────────────────────────────────────────

const KPI_COLORS = [
  '#388E3C', '#1976D2', '#F57C00', '#7B1FA2',
  '#0097A7', '#C62828', '#558B2F', '#E91E63',
];

function getEstado(pct: number): KpiEstado {
  if (pct >= 100) return 'Superado';
  if (pct >= 70)  return 'En proceso';
  return 'No alcanzado';
}

function getPeriodoKey(fecha: string): string {
  return fecha.substring(0, 7); // "2025-05"
}

function formatPeriodo(key: string): string {
  const [year, monthStr] = key.split('-');
  const date  = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
  const label = date.toLocaleString('es-GT', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function getInitials(nombre: string): string {
  const parts = nombre.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function calcCumplimiento(resultado: KPIResultado, kpiMap: Map<number, KPI>): number {
  const raw = Number(resultado.KRE_CALCULO ?? 0);
  if (raw > 0) return raw; // trust pre-calculated value
  // Fallback: compute from monto / meta
  const meta = Number(kpiMap.get(resultado.KPI_ID)?.KPI_VALOR ?? 0);
  const monto = Number(resultado.KRE_MONTO_TOTAL ?? 0);
  if (meta === 0) return 0;
  return Math.round((monto / meta) * 1000) / 10; // one decimal
}

// ── main function ─────────────────────────────────────────────────────────────

export async function getReporteKpi(params: KpiParams): Promise<KpiResponse> {
  const [kpis, resultados, empleados, departamentos] = await Promise.all([
    obtenerKPIs(),
    obtenerResultados(),
    obtenerEmpleados(),
    obtenerDepartamentos(),
  ]);

  const kpiMap = new Map<number, KPI>(kpis.map(k => [k.KPI_ID, k]));
  const empMap = new Map<number, Empleado>(empleados.map(e => [e.EMP_ID, e]));
  const depMap = new Map<number, Departamento>(departamentos.map(d => [d.DEP_ID, d]));

  // Collect sorted unique periods (most recent first)
  const periodSet = new Set<string>();
  resultados.forEach(r => { if (r.KRE_FECHA) periodSet.add(getPeriodoKey(r.KRE_FECHA)); });
  const periodos = [...periodSet].sort().reverse();

  // Build flat rows
  let filas: KpiEmpleadoFila[] = resultados.map(r => {
    const kpi    = kpiMap.get(r.KPI_ID);
    const emp    = r.EMP_ID != null ? empMap.get(r.EMP_ID) : undefined;
    const dep    = emp?.DEP_ID != null ? depMap.get(emp.DEP_ID) : undefined;
    const nombre = emp
      ? `${emp.EMP_NOMBRE} ${emp.EMP_APELLIDO}`.trim()
      : `Empleado ${r.EMP_ID ?? '?'}`;
    const cumplimiento = Math.round(calcCumplimiento(r, kpiMap) * 10) / 10;

    return {
      KRE_ID:       r.KRE_ID,
      EMP_ID:       r.EMP_ID ?? 0,
      KPI_ID:       r.KPI_ID,
      EMPLEADO:     nombre,
      INICIALES:    getInitials(nombre),
      DEPARTAMENTO: dep?.DEP_NOMBRE ?? 'Sin departamento',
      DEP_ID:       dep?.DEP_ID     ?? 0,
      KPI_NOMBRE:   kpi?.KPI_NOMBRE ?? `KPI ${r.KPI_ID}`,
      KPI_TIPO:     kpi?.KPI_TIPO   ?? '',
      META:         Number(kpi?.KPI_VALOR ?? 0),
      RESULTADO:    Number(r.KRE_MONTO_TOTAL ?? 0),
      CUMPLIMIENTO: cumplimiento,
      ESTADO:       getEstado(cumplimiento),
      KRE_FECHA:    r.KRE_FECHA,
      MES:          getPeriodoKey(r.KRE_FECHA),
    };
  });

  // ── apply filters ────────────────────────────────────────────────────────────
  if (params.periodo)        filas = filas.filter(f => f.MES === params.periodo);
  if (params.departamentoId) filas = filas.filter(f => f.DEP_ID === params.departamentoId);
  if (params.kpiId)          filas = filas.filter(f => f.KPI_ID === params.kpiId);
  if (params.empleadoId)     filas = filas.filter(f => f.EMP_ID === params.empleadoId);

  // ── resumen ──────────────────────────────────────────────────────────────────
  const total  = filas.length;
  const avg    = total > 0 ? Math.round(filas.reduce((s, f) => s + f.CUMPLIMIENTO, 0) / total) : 0;
  const superados  = filas.filter(f => f.ESTADO === 'Superado').length;
  const enProceso  = filas.filter(f => f.ESTADO === 'En proceso').length;
  const noAlcanzan = filas.filter(f => f.ESTADO === 'No alcanzado').length;

  const resumen: KpiResumen = {
    promedioCumplimiento: avg,
    superaronMeta:        superados,
    enProceso,
    noAlcanzaron:         noAlcanzan,
    total,
    periodoLabel: params.periodo ? formatPeriodo(params.periodo) : 'Todos los periodos',
  };

  // ── por departamento ─────────────────────────────────────────────────────────
  const depAgg = new Map<string, { sum: number; count: number; sup: number; proc: number; noAlc: number }>();
  filas.forEach(f => {
    const e = depAgg.get(f.DEPARTAMENTO) ?? { sum: 0, count: 0, sup: 0, proc: 0, noAlc: 0 };
    e.sum   += f.CUMPLIMIENTO;
    e.count += 1;
    if      (f.ESTADO === 'Superado')     e.sup++;
    else if (f.ESTADO === 'En proceso')   e.proc++;
    else                                  e.noAlc++;
    depAgg.set(f.DEPARTAMENTO, e);
  });

  const porDepartamento: KpiDepData[] = [...depAgg.entries()]
    .map(([dpto, v]) => ({
      departamento: dpto,
      promedio:     Math.round(v.sum / v.count),
      superados:    v.sup,
      enProceso:    v.proc,
      noAlcanzados: v.noAlc,
      total:        v.count,
    }))
    .sort((a, b) => b.promedio - a.promedio);

  // ── más incumplidos ──────────────────────────────────────────────────────────
  const kpiAgg = new Map<string, { sum: number; count: number; bajo: number }>();
  filas.forEach(f => {
    const e = kpiAgg.get(f.KPI_NOMBRE) ?? { sum: 0, count: 0, bajo: 0 };
    e.sum   += f.CUMPLIMIENTO;
    e.count += 1;
    if (f.ESTADO !== 'Superado') e.bajo++;
    kpiAgg.set(f.KPI_NOMBRE, e);
  });

  const masIncumplidos: KpiIncumplido[] = [...kpiAgg.entries()]
    .filter(([, v]) => v.bajo > 0)
    .map(([nombre, v]) => ({
      kpiNombre:         nombre,
      empleadosBajoMeta: v.bajo,
      promedio:          Math.round(v.sum / v.count),
    }))
    .sort((a, b) => a.promedio - b.promedio)
    .slice(0, 5);

  // ── avance por indicador ─────────────────────────────────────────────────────
  const avancePorIndicador: KpiAvancePorIndicador[] = [...kpiAgg.entries()].map(([nombre, v], i) => ({
    kpiNombre: nombre,
    promedio:  Math.round(v.sum / v.count),
    fill:      KPI_COLORS[i % KPI_COLORS.length],
  }));

  return { filas, resumen, porDepartamento, masIncumplidos, avancePorIndicador, periodos };
}

export function descargarPdfKpi(_params: KpiParams): void {
  alert('Exportacion PDF en desarrollo');
}
