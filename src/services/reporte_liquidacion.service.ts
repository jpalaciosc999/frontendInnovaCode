import api from '../api/axios';
import type { Liquidacion } from '../interfaces/liquidacion';
import type { Empleado } from '../interfaces/empleados';
import type { Departamento } from '../interfaces/departamentos';
import type {
  LiquidacionResponse,
  LiquidacionParams,
  LiquidacionEmpleadoFila,
  LiquidacionPorMotivo,
  LiquidacionPorDepartamento,
  LiquidacionEvolucion,
  LiquidacionPorEstado,
} from '../interfaces/reporteLiquidacion';

// ── constants ─────────────────────────────────────────────────────────────────

const MOTIVO_COLORS: Record<string, string> = {
  'Voluntario':  '#1976D2',
  'Renuncia':    '#388E3C',
  'Despido':     '#C62828',
  'Jubilación':  '#7B1FA2',
  'Contrato':    '#F57C00',
  'Otro':        '#455A64',
};

const FALLBACK_COLORS = [
  '#1976D2', '#388E3C', '#F57C00', '#7B1FA2',
  '#C62828', '#0097A7', '#558B2F', '#E91E63',
];

const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ── helpers ───────────────────────────────────────────────────────────────────

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function motivoColor(motivo: string, idx: number): string {
  return MOTIVO_COLORS[motivo] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
}

function mesKey(fecha: string): string {
  return String(fecha ?? '').slice(0, 7);
}

function mesLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  const idx = parseInt(m, 10) - 1;
  return `${MESES_ES[idx] ?? m} ${y}`;
}

// ── main service ──────────────────────────────────────────────────────────────

export const getReporteLiquidacion = async (
  params: LiquidacionParams,
): Promise<LiquidacionResponse> => {

  const [liqRes, empRes, depRes] = await Promise.all([
    api.get<Liquidacion[]>('/liquidaciones/'),
    api.get<Empleado[]>('/empleados'),
    api.get<Departamento[]>('/departamentos'),
  ]);

  const liquidaciones: Liquidacion[]    = liqRes.data;
  const empleados: Empleado[]           = empRes.data;
  const departamentos: Departamento[]   = depRes.data;

  const empMap = new Map(empleados.map((e) => [e.EMP_ID, e]));
  const depMap = new Map(departamentos.map((d) => [d.DEP_ID, d]));

  // ── filter by year ────────────────────────────────────────────────────────
  let liqFiltradas = liquidaciones;
  if (params.anio) {
    liqFiltradas = liqFiltradas.filter((l) =>
      String(l.LIQ_FECHA_SALIDA ?? '').startsWith(String(params.anio)),
    );
  }

  // ── build rows ────────────────────────────────────────────────────────────
  let rows: LiquidacionEmpleadoFila[] = liqFiltradas.map((liq) => {
    const emp = empMap.get(liq.EMP_ID);
    const dep = emp ? depMap.get(emp.DEP_ID ?? 0) : undefined;

    return {
      LIQ_ID:                 liq.LIQ_ID,
      EMP_ID:                 liq.EMP_ID,
      EMPLEADO:               emp ? `${emp.EMP_NOMBRE} ${emp.EMP_APELLIDO}` : `Empleado #${liq.EMP_ID}`,
      INICIALES:              emp ? getInitials(emp.EMP_NOMBRE, emp.EMP_APELLIDO) : '??',
      DEPARTAMENTO:           dep?.DEP_NOMBRE ?? '—',
      FECHA_SALIDA:           liq.LIQ_FECHA_SALIDA,
      MOTIVO_SALIDA:          liq.LIQ_TIPO_RETIRO || 'No especificado',
      DIAS_TRABAJADOS:        liq.LIQ_DIAS_TRABAJADO,
      INDEMNIZACION:          Number(liq.LIQ_INDEMNIZACION) || 0,
      VACACIONES_PAGADAS:     Number(liq.LIQ_VACACIONES_PAGADAS) || 0,
      AGUINALDO_PROPORCIONAL: Number(liq.LIQ_AGUINALDO_PROPORCIONAL) || 0,
      BONO14_PROPORCIONAL:    Number(liq.LIQ_BONO14_PROPORCIONAL) || 0,
      TOTAL_LIQUIDACION:      Number(liq.LIQ_LIQUIDACION) || 0,
      EMP_ESTADO:             emp?.EMP_ESTADO ?? 'I',
    };
  });

  // ── secondary filters ─────────────────────────────────────────────────────
  if (params.departamentoId) {
    rows = rows.filter((r) => {
      const emp = empMap.get(r.EMP_ID);
      return emp?.DEP_ID === params.departamentoId;
    });
  }
  if (params.motivoSalida) {
    rows = rows.filter((r) => r.MOTIVO_SALIDA === params.motivoSalida);
  }

  // ── resumen ───────────────────────────────────────────────────────────────
  const montoTotal          = rows.reduce((s, r) => s + r.TOTAL_LIQUIDACION, 0);
  const totalDias           = rows.reduce((s, r) => s + r.DIAS_TRABAJADOS, 0);
  const anioLabel           = params.anio ? String(params.anio) : 'Todos los años';

  const resumen = {
    totalLiquidaciones:      rows.length,
    montoTotal,
    promedioPorLiquidacion:  rows.length > 0 ? montoTotal / rows.length : 0,
    promedioDiasTrabajados:  rows.length > 0 ? Math.round(totalDias / rows.length) : 0,
    anioLabel,
  };

  // ── por motivo ────────────────────────────────────────────────────────────
  const motivoMap = new Map<string, { cantidad: number; monto: number }>();
  for (const r of rows) {
    const existing = motivoMap.get(r.MOTIVO_SALIDA) ?? { cantidad: 0, monto: 0 };
    motivoMap.set(r.MOTIVO_SALIDA, {
      cantidad: existing.cantidad + 1,
      monto:    existing.monto + r.TOTAL_LIQUIDACION,
    });
  }
  const porMotivo: LiquidacionPorMotivo[] = Array.from(motivoMap.entries()).map(([motivo, v], idx) => ({
    motivo,
    cantidad:   v.cantidad,
    montoTotal: v.monto,
    color:      motivoColor(motivo, idx),
  }));

  // ── por departamento ──────────────────────────────────────────────────────
  const depTotals = new Map<string, { cantidad: number; monto: number }>();
  for (const r of rows) {
    const existing = depTotals.get(r.DEPARTAMENTO) ?? { cantidad: 0, monto: 0 };
    depTotals.set(r.DEPARTAMENTO, {
      cantidad: existing.cantidad + 1,
      monto:    existing.monto + r.TOTAL_LIQUIDACION,
    });
  }
  const porDepartamento: LiquidacionPorDepartamento[] = Array.from(depTotals.entries())
    .map(([departamento, v]) => ({ departamento, cantidad: v.cantidad, montoTotal: v.monto }))
    .sort((a, b) => b.montoTotal - a.montoTotal);

  // ── evolución mensual ─────────────────────────────────────────────────────
  const evolMap = new Map<string, { cantidad: number; monto: number }>();
  for (const r of rows) {
    const key = mesKey(r.FECHA_SALIDA);
    if (!key || key === '') continue;
    const existing = evolMap.get(key) ?? { cantidad: 0, monto: 0 };
    evolMap.set(key, {
      cantidad: existing.cantidad + 1,
      monto:    existing.monto + r.TOTAL_LIQUIDACION,
    });
  }
  const evolucion: LiquidacionEvolucion[] = Array.from(evolMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      mes:        mesLabel(key),
      cantidad:   v.cantidad,
      montoTotal: v.monto,
    }));

  // ── por estado del empleado ───────────────────────────────────────────────
  const estadoMap = new Map<string, number>();
  for (const r of rows) {
    const label = r.EMP_ESTADO === 'A' ? 'Activo' : 'Inactivo';
    estadoMap.set(label, (estadoMap.get(label) ?? 0) + 1);
  }
  const porEstado: LiquidacionPorEstado[] = Array.from(estadoMap.entries())
    .map(([estado, cantidad]) => ({ estado, cantidad }));

  // ── motivos únicos ────────────────────────────────────────────────────────
  const motivos = [...new Set(liquidaciones.map((l) => l.LIQ_TIPO_RETIRO || 'No especificado'))].sort();

  return { empleados: rows, resumen, porMotivo, porDepartamento, evolucion, porEstado, motivos };
};
