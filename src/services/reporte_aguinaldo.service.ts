import api from '../api/axios';
import type { Empleado } from '../interfaces/empleados';
import type { Puesto } from '../interfaces/puestos';
import type { Departamento } from '../interfaces/departamentos';
import { obtenerSueldoMensual } from '../utils/payroll';
import type {
  AguinaldoResponse,
  AguinaldoParams,
  AguinaldoEmpleadoFila,
  AguinaldoMensual,
  AguinaldoAvanceDep,
} from '../interfaces/reporteAguinaldo';

// ── constants ─────────────────────────────────────────────────────────────────

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

const DEP_COLORS = [
  '#1976D2','#388E3C','#F57C00','#7B1FA2',
  '#C62828','#0097A7','#558B2F','#E91E63',
];

// ── helpers ───────────────────────────────────────────────────────────────────

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

interface MesInfo { year: number; month: number; label: string }

interface PeriodoBounds {
  inicio: Date;
  fin: Date;
  meses: MesInfo[];
  fechaPago: string;
}

function getPeriodoBounds(tipo: 'aguinaldo' | 'bono14', anio: number): PeriodoBounds {
  if (tipo === 'aguinaldo') {
    // Dec Y-1 → Nov Y
    const inicio = new Date(anio - 1, 11, 1);
    const fin    = new Date(anio, 10, 30);
    const meses  = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(anio - 1, 11 + i, 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: MESES_ES[d.getMonth()] };
    });
    return { inicio, fin, meses, fechaPago: `1a quincena dic ${anio}` };
  } else {
    // Jul Y-1 → Jun Y
    const inicio = new Date(anio - 1, 6, 1);
    const fin    = new Date(anio, 5, 30);
    const meses  = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(anio - 1, 6 + i, 1);
      return { year: d.getFullYear(), month: d.getMonth(), label: MESES_ES[d.getMonth()] };
    });
    return { inicio, fin, meses, fechaPago: `1a quincena jul ${anio}` };
  }
}

/** Months the employee has been active inside the period window, up to `hasta`. */
function calcMesesEnPeriodo(
  fechaContratacion: unknown,
  periodoInicio: Date,
  periodoFin: Date,
  hasta: Date,
): number {
  const contratacion = parseDate(fechaContratacion);
  if (!contratacion) return 0;
  if (contratacion > periodoFin) return 0;

  const desde   = contratacion > periodoInicio ? contratacion : periodoInicio;
  const efectivo = hasta < periodoFin ? hasta : periodoFin;

  if (desde > efectivo) return 0;
  const meses =
    (efectivo.getFullYear() - desde.getFullYear()) * 12 +
    (efectivo.getMonth()    - desde.getMonth()) + 1;
  return Math.max(0, Math.min(12, meses));
}

// ── main service ──────────────────────────────────────────────────────────────

export const getReporteAguinaldo = async (
  params: AguinaldoParams,
): Promise<AguinaldoResponse> => {
  const { tipo, anio } = params;
  const hoy = new Date();

  const [empleadosRes, puestosRes, depRes] = await Promise.all([
    api.get<Empleado[]>('/empleados'),
    api.get<Puesto[]>('/puestos'),
    api.get<Departamento[]>('/departamentos'),
  ]);

  const empleados: Empleado[]      = empleadosRes.data;
  const puestos: Puesto[]          = puestosRes.data;
  const departamentos: Departamento[] = depRes.data;

  const puestoMap = new Map(puestos.map((p) => [p.PUE_ID, p]));
  const depMap    = new Map(departamentos.map((d) => [d.DEP_ID, d]));

  const periodo = getPeriodoBounds(tipo, anio);

  // Active employees who started before (or during) the period
  let base = empleados.filter((e) => {
    if (e.EMP_ESTADO !== 'A') return false;
    const f = parseDate(e.EMP_FECHA_CONTRATACION);
    return f !== null && f <= periodo.fin;
  });

  if (params.departamentoId) {
    base = base.filter((e) => e.DEP_ID === params.departamentoId);
  }

  // Months elapsed in period up to today
  const mesesTranscurridos = periodo.meses.filter(
    (m) => new Date(m.year, m.month, 1) <= hoy,
  ).length;

  // Build employee rows
  const rows: AguinaldoEmpleadoFila[] = base.map((emp) => {
    const puesto  = puestoMap.get(emp.PUE_ID ?? 0);
    const dep     = depMap.get(emp.DEP_ID ?? 0);
    const salario = obtenerSueldoMensual(emp, puesto);

    const mesesHoy  = calcMesesEnPeriodo(emp.EMP_FECHA_CONTRATACION, periodo.inicio, periodo.fin, hoy);
    const mesesFull = calcMesesEnPeriodo(emp.EMP_FECHA_CONTRATACION, periodo.inicio, periodo.fin, periodo.fin);

    const provisionAcum   = (salario / 12) * mesesHoy;
    const proyeccionTotal = (salario / 12) * mesesFull;
    const avancePct       = mesesFull > 0 ? (mesesHoy / mesesFull) * 100 : 0;

    const estado: AguinaldoEmpleadoFila['ESTADO'] =
      mesesFull === 12 && mesesHoy >= 12 ? 'Completado'
      : mesesHoy > 0                     ? 'En curso'
      :                                    'Pendiente';

    return {
      EMP_ID:           emp.EMP_ID,
      EMPLEADO:         `${emp.EMP_NOMBRE} ${emp.EMP_APELLIDO}`,
      INICIALES:        getInitials(emp.EMP_NOMBRE, emp.EMP_APELLIDO),
      DEPARTAMENTO:     dep?.DEP_NOMBRE ?? '—',
      PUESTO:           puesto?.PUE_NOMBRE ?? '—',
      SALARIO_BASE:     salario,
      MESES_LABORADOS:  mesesHoy,
      PROVISION_ACUM:   provisionAcum,
      PROYECCION_TOTAL: proyeccionTotal,
      AVANCE_PCT:       Math.min(100, avancePct),
      ESTADO:           estado,
    };
  });

  const rowsFiltrados = params.estado
    ? rows.filter((r) => r.ESTADO === params.estado)
    : rows;

  // ── Resumen ──────────────────────────────────────────────────────────────
  const resumen = {
    provisionAcumulada:   rowsFiltrados.reduce((s, r) => s + r.PROVISION_ACUM,   0),
    proyeccionTotal:      rowsFiltrados.reduce((s, r) => s + r.PROYECCION_TOTAL, 0),
    empleadosConDerecho:  rowsFiltrados.filter((r) => r.PROYECCION_TOTAL > 0).length,
    pctAnioTranscurrido:  (mesesTranscurridos / 12) * 100,
    mesesTranscurridos,
    totalMeses:           12,
    periodoInicio: `${periodo.meses[0].label} ${periodo.meses[0].year}`,
    periodoFin:    `${periodo.meses[11].label} ${periodo.meses[11].year}`,
    fechaPago:     periodo.fechaPago,
    anio,
  };

  // ── Monthly chart ─────────────────────────────────────────────────────────
  const mensual: AguinaldoMensual[] = periodo.meses.map((m, idx) => {
    const mesDate = new Date(m.year, m.month, 1);
    const pasado  = mesDate <= hoy;

    const totalMes = rowsFiltrados.reduce((s, r) => {
      const emp = base.find((e) => e.EMP_ID === r.EMP_ID);
      if (!emp) return s;
      const contratacion = parseDate(emp.EMP_FECHA_CONTRATACION);
      if (!contratacion || contratacion > mesDate) return s;
      const puesto  = puestoMap.get(emp.PUE_ID ?? 0);
      return s + obtenerSueldoMensual(emp, puesto) / 12;
    }, 0);

    return {
      mes:          m.label,
      mesNum:       idx + 1,
      provisionado: pasado ? totalMes : 0,
      proyectado:   pasado ? 0        : totalMes,
    };
  });

  // ── Avance por departamento (for RadialBar) ───────────────────────────────
  const depNames = [...new Set(rowsFiltrados.map((r) => r.DEPARTAMENTO))].filter((d) => d !== '—');
  const avancePorDep: AguinaldoAvanceDep[] = depNames.map((dep, i) => {
    const emps = rowsFiltrados.filter((r) => r.DEPARTAMENTO === dep);
    const avg  = emps.reduce((s, e) => s + e.AVANCE_PCT, 0) / (emps.length || 1);
    return { departamento: dep.length > 10 ? dep.slice(0, 10) + '.' : dep, avance: Math.round(avg), fill: DEP_COLORS[i % DEP_COLORS.length] };
  });

  return { empleados: rowsFiltrados, resumen, mensual, avancePorDep };
};

export const descargarPdfAguinaldo = (_params: AguinaldoParams): void => {
  // PDF generation not yet implemented
  alert('Generacion de PDF en desarrollo');
};
