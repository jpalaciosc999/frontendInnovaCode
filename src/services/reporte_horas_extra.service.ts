import { getMarcajesReporte } from './reportes.service';
import { obtenerEmpleados } from './empleados.service';
import { obtenerHorarios } from './horario.service';
import { obtenerPuestos } from './puestos.service';
import type { HorasExtraResponse, HorasExtraParams, HorasExtraFila } from '../interfaces/reporteHorasExtra';
import type { Empleado } from '../interfaces/empleados';
import type { Horario } from '../interfaces/horario';
import type { Puesto } from '../interfaces/puestos';

// ── helpers ────────────────────────────────────────────────────────────────

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const DEPTO_COLORS = [
  '#1976D2', '#388E3C', '#F57C00', '#7B1FA2',
  '#C62828', '#0097A7', '#558B2F', '#E91E63',
];

function parseHoras(hhmmss: string | null | undefined): number {
  if (!hhmmss || hhmmss === '00:00:00') return 0;
  const parts = hhmmss.split(':').map(Number);
  return (parts[0] || 0) + (parts[1] || 0) / 60 + (parts[2] || 0) / 3600;
}

function horariosHoras(hor: Horario): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  return (toMin(hor.HOR_HORA_FIN) - toMin(hor.HOR_HORA_INICIO)) / 60;
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase();
}

function formatFechaLabel(fecha: string): string {
  const d = new Date(fecha + 'T12:00:00');
  return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short' });
}

function round1(v: number): number {
  return Math.round(v * 10) / 10;
}

// ── main service ───────────────────────────────────────────────────────────

export async function getReporteHorasExtra(
  params: HorasExtraParams
): Promise<HorasExtraResponse> {
  const [marcajesResp, empleados, horarios, puestos] = await Promise.all([
    getMarcajesReporte({
      fechaInicio: params.fechaInicio,
      fechaFin: params.fechaFin,
      ...(params.departamentoId ? { departamentoId: params.departamentoId } : {}),
    }),
    obtenerEmpleados(),
    obtenerHorarios(),
    obtenerPuestos(),
  ]);

  const marcajes = marcajesResp.marcajes;

  // Lookup maps
  const empMap = new Map<number, Empleado>(empleados.map((e) => [e.EMP_ID, e]));
  const horMap = new Map<number, Horario>(horarios.map((h) => [h.HOR_ID, h]));
  const puestoMap = new Map<number, Puesto>(puestos.map((p) => [p.PUE_ID, p]));

  // Aggregation buckets
  interface EmpAgg {
    empleado: string;
    iniciales: string;
    departamento: string;
    depId: number;
    salarioHora: number;
    horasExtra: number;
    totalPagar: number;
  }
  const empAgg = new Map<number, EmpAgg>();

  const diasMap: Record<string, number> = {};
  DIAS_SEMANA.forEach((d) => (diasMap[d] = 0));

  const deptoMap = new Map<string, { horas: number; costo: number }>();
  const fechaMap = new Map<string, number>();

  for (const m of marcajes) {
    const worked = parseHoras(m.HORAS_TRABAJADAS);
    if (worked === 0) continue;

    const emp = empMap.get(m.EMP_ID);
    const hor = emp?.HOR_ID ? horMap.get(emp.HOR_ID) : undefined;
    const puesto = emp?.PUE_ID ? puestoMap.get(emp.PUE_ID) : undefined;

    // Scheduled hours (default 8h if no horario found)
    const scheduled = hor ? horariosHoras(hor) : 8;
    const extra = Math.max(0, worked - scheduled);
    if (extra === 0) continue;

    // Hourly rates
    const sueldo = Number(emp?.EMP_SUELDO ?? puesto?.PUE_SALARIO_BASE ?? 0);
    const salarioHora = sueldo > 0 ? sueldo / 240 : 0; // 30 días × 8 hrs
    const valorHoraExtra = salarioHora * 1.5;
    const costo = extra * valorHoraExtra;

    // Employee bucket
    if (!empAgg.has(m.EMP_ID)) {
      empAgg.set(m.EMP_ID, {
        empleado: m.EMPLEADO,
        iniciales: m.INICIALES || iniciales(m.EMPLEADO),
        departamento: m.DEPARTAMENTO,
        depId: emp?.DEP_ID ?? 0,
        salarioHora,
        horasExtra: 0,
        totalPagar: 0,
      });
    }
    const agg = empAgg.get(m.EMP_ID)!;
    agg.horasExtra += extra;
    agg.totalPagar += costo;

    // Day of week
    const d = new Date(m.FECHA + 'T12:00:00');
    const diaKey = DIAS_SEMANA[d.getDay()];
    diasMap[diaKey] = (diasMap[diaKey] || 0) + extra;

    // Department
    const depto = m.DEPARTAMENTO || 'Sin depto';
    const depBucket = deptoMap.get(depto) ?? { horas: 0, costo: 0 };
    depBucket.horas += extra;
    depBucket.costo += costo;
    deptoMap.set(depto, depBucket);

    // Date avance
    const fKey = m.FECHA.substring(0, 10);
    fechaMap.set(fKey, (fechaMap.get(fKey) ?? 0) + extra);
  }

  // ── Build result filas ─────────────────────────────────────────────────
  const filas: HorasExtraFila[] = Array.from(empAgg.entries())
    .map(([empId, v]) => ({
      EMP_ID: empId,
      EMPLEADO: v.empleado,
      INICIALES: v.iniciales,
      DEPARTAMENTO: v.departamento,
      DEP_ID: v.depId,
      SALARIO_HORA: v.salarioHora,
      HORAS_EXTRA: round1(v.horasExtra),
      VALOR_HORA_EXTRA: v.salarioHora * 1.5,
      TOTAL_A_PAGAR: v.totalPagar,
      ALERTA: v.horasExtra > 20,
    }))
    .sort((a, b) => b.HORAS_EXTRA - a.HORAS_EXTRA);

  const totalHoras = filas.reduce((s, f) => s + f.HORAS_EXTRA, 0);
  const costoTotal = filas.reduce((s, f) => s + f.TOTAL_A_PAGAR, 0);

  const resumen = {
    totalHoras: round1(totalHoras),
    costoTotal,
    promedioPorEmpleado:
      filas.length > 0 ? round1(totalHoras / filas.length) : 0,
    empleadosAlerta: filas.filter((f) => f.ALERTA).length,
    totalEmpleados: filas.length,
  };

  // ── Por día de semana (Lun–Sáb) ────────────────────────────────────────
  const daysOrder = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const porDia = daysOrder.map((d) => ({
    dia: d,
    horas: round1(diasMap[d] || 0),
  }));

  // ── Por departamento ───────────────────────────────────────────────────
  let colorIdx = 0;
  const porDepartamento = Array.from(deptoMap.entries())
    .map(([dep, v]) => ({
      departamento: dep,
      horas: round1(v.horas),
      costo: v.costo,
      color: DEPTO_COLORS[colorIdx++ % DEPTO_COLORS.length],
    }))
    .sort((a, b) => b.horas - a.horas);

  // ── Por empleado (top 15) ──────────────────────────────────────────────
  const porEmpleado = filas.slice(0, 15).map((f) => ({
    empleado: f.EMPLEADO,
    iniciales: f.INICIALES,
    horas: f.HORAS_EXTRA,
    total: f.TOTAL_A_PAGAR,
  }));

  // ── Avance diario acumulado ────────────────────────────────────────────
  const sortedFechas = Array.from(fechaMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );
  let acumulado = 0;
  const avance = sortedFechas.map(([fecha, horas]) => {
    acumulado += horas;
    return {
      fecha,
      label: formatFechaLabel(fecha),
      horas: round1(horas),
      acumulado: round1(acumulado),
    };
  });

  return { filas, resumen, porDia, porDepartamento, porEmpleado, avance };
}

export async function descargarPdfHorasExtra(
  _params: HorasExtraParams
): Promise<void> {
  alert('Función de PDF en desarrollo');
}
