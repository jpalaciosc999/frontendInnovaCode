import api from '../api/axios';
import type { Nomina } from '../interfaces/nomina';
import type { NominaDetalle } from '../interfaces/nomina-detalle';
import type { Descuento } from '../interfaces/descuentos';
import type { Empleado } from '../interfaces/empleados';
import type { Departamento } from '../interfaces/departamentos';
import {
  type DescuentoResponse,
  type DescuentoParams,
  type DescuentoEmpleadoFila,
  type DescuentoEstado,
  type DescuentoTipoData,
  type DescuentoEvolucion,
  type DescuentoDepData,
} from '../interfaces/reporteDescuentos';
import { obtenerSueldoMensual } from '../utils/payroll';
import type { Puesto } from '../interfaces/puestos';

// ── constants ─────────────────────────────────────────────────────────────────

const TASA_IGSS_LABORAL = 0.0483;

const TIPO_COLORS = [
  '#F57C00', '#C62828', '#1976D2', '#7B1FA2',
  '#0097A7', '#558B2F', '#E91E63', '#455A64',
];

const MESES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

// ── helpers ───────────────────────────────────────────────────────────────────

function normalizeNombre(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();
}

function getInitials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function mesKey(fecha: string): string {
  // 'YYYY-MM-DD...' → 'YYYY-MM'
  return String(fecha ?? '').slice(0, 7);
}

function mesLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-');
  const idx = parseInt(m, 10) - 1;
  return `${MESES_ES[idx] ?? m} ${y}`;
}

function calcEstado(pct: number): DescuentoEstado {
  if (pct > 55) return 'Alerta';
  if (pct > 35) return 'Descuento alto';
  return 'Normal';
}

/** Classify a discount by its name */
function classifyTds(nombre: string): 'igss' | 'isr' | 'prestamo' | 'otros' {
  const n = normalizeNombre(nombre);
  if (n.includes('igss'))     return 'igss';
  if (n.includes('isr'))      return 'isr';
  if (n.includes('presta') || n.includes('cuota') || n.includes('credito')) return 'prestamo';
  return 'otros';
}

// ── main service ──────────────────────────────────────────────────────────────

export const getReporteDescuentos = async (
  params: DescuentoParams,
): Promise<DescuentoResponse> => {

  const [nominasRes, detallesRes, tiposRes, empRes, depRes, puestosRes] = await Promise.all([
    api.get<Nomina[]>('/nominas'),
    api.get<NominaDetalle[]>('/nominaDetalle'),
    api.get<Descuento[]>('/descuentos').catch(() => ({ data: [] as Descuento[] })),
    api.get<Empleado[]>('/empleados'),
    api.get<Departamento[]>('/departamentos'),
    api.get<Puesto[]>('/puestos').catch(() => ({ data: [] as Puesto[] })),
  ]);

  const nominas: Nomina[]          = nominasRes.data;
  const detalles: NominaDetalle[]  = detallesRes.data;
  const tipos: Descuento[]         = tiposRes.data;
  const empleados: Empleado[]      = empRes.data;
  const departamentos: Departamento[] = depRes.data;
  const puestos: Puesto[]          = puestosRes.data;

  // ── build lookup maps ────────────────────────────────────────────────────
  const depMap    = new Map(departamentos.map((d) => [d.DEP_ID, d]));
  const empMap    = new Map(empleados.map((e) => [e.EMP_ID, e]));
  const puestoMap = new Map(puestos.map((p) => [p.PUE_ID, p]));
  const tipoMap   = new Map(tipos.map((t) => [t.TDS_ID, t]));

  // ── latest nomina per employee ────────────────────────────────────────────
  const latestNominaMap = new Map<number, Nomina>();
  for (const nom of nominas) {
    const existing = latestNominaMap.get(nom.EMP_ID);
    if (!existing || nom.NOM_ID > existing.NOM_ID) {
      latestNominaMap.set(nom.EMP_ID, nom);
    }
  }

  // ── detalles index by NOM_ID ──────────────────────────────────────────────
  const detByNom = new Map<number, NominaDetalle[]>();
  for (const det of detalles) {
    if (!detByNom.has(det.NOM_ID)) detByNom.set(det.NOM_ID, []);
    detByNom.get(det.NOM_ID)!.push(det);
  }

  // ── determine the latest period label ─────────────────────────────────────
  let latestFecha = '';
  for (const nom of latestNominaMap.values()) {
    if (nom.NOM_FECHA_GENERACION > latestFecha) latestFecha = nom.NOM_FECHA_GENERACION;
  }
  const periodoLabel = latestFecha
    ? mesLabel(mesKey(latestFecha))
    : 'Periodo actual';

  // ── build employee rows ───────────────────────────────────────────────────
  let activeEmps = empleados.filter((e) => e.EMP_ESTADO === 'A');
  if (params.departamentoId) {
    activeEmps = activeEmps.filter((e) => e.DEP_ID === params.departamentoId);
  }

  const rows: DescuentoEmpleadoFila[] = activeEmps.map((emp) => {
    const dep    = depMap.get(emp.DEP_ID ?? 0);
    const puesto = puestoMap.get(emp.PUE_ID ?? 0);
    const nom    = latestNominaMap.get(emp.EMP_ID);
    const dets   = nom ? (detByNom.get(nom.NOM_ID) ?? []) : [];

    // Base salary (from payroll util or nomina)
    const salarioBruto = nom?.NOM_TOTAL_INGRESOS
      ?? obtenerSueldoMensual(emp, puesto);

    // Sum detalles by type class (only discount entries: TDS_ID > 0)
    let igssLaboral    = 0;
    let isrRetenido    = 0;
    let cuotaPrestamo  = 0;
    let otrosDesc      = 0;

    const discountDets = dets.filter((d) => d.TDS_ID > 0);
    for (const det of discountDets) {
      const tipo  = tipoMap.get(det.TDS_ID);
      const clase = tipo ? classifyTds(tipo.TDS_NOMBRE) : 'otros';
      if (clase === 'igss')     igssLaboral   += det.DET_MONTO;
      else if (clase === 'isr') isrRetenido   += det.DET_MONTO;
      else if (clase === 'prestamo') cuotaPrestamo += det.DET_MONTO;
      else otrosDesc += det.DET_MONTO;
    }

    // Fallback: compute IGSS if no nomina detail found
    if (igssLaboral === 0 && discountDets.length === 0) {
      igssLaboral = Math.round(salarioBruto * TASA_IGSS_LABORAL * 100) / 100;
    }

    const totalDescuentos = nom?.NOM_TOTAL_DESCUENTO
      ?? (igssLaboral + isrRetenido + cuotaPrestamo + otrosDesc);
    const salarioLiquido  = nom?.NOM_SALARIO_LIQUIDO
      ?? (salarioBruto - totalDescuentos);
    const pctDescuento    = salarioBruto > 0
      ? Math.round((totalDescuentos / salarioBruto) * 100)
      : 0;

    return {
      EMP_ID:           emp.EMP_ID,
      NOM_ID:           nom?.NOM_ID ?? 0,
      EMPLEADO:         `${emp.EMP_NOMBRE} ${emp.EMP_APELLIDO}`,
      INICIALES:        getInitials(emp.EMP_NOMBRE, emp.EMP_APELLIDO),
      DEPARTAMENTO:     dep?.DEP_NOMBRE ?? '—',
      SALARIO_BRUTO:    salarioBruto,
      IGSS_LABORAL:     igssLaboral,
      ISR_RETENIDO:     isrRetenido,
      CUOTA_PRESTAMO:   cuotaPrestamo,
      OTROS_DESCUENTOS: otrosDesc,
      TOTAL_DESCUENTOS: totalDescuentos,
      SALARIO_LIQUIDO:  salarioLiquido,
      PCT_DESCUENTO:    pctDescuento,
      ESTADO:           calcEstado(pctDescuento),
    };
  });

  const rowsFiltrados = params.estado
    ? rows.filter((r) => r.ESTADO === params.estado)
    : rows;

  // ── resumen ───────────────────────────────────────────────────────────────
  const resumen = {
    totalDescuentosMes: rowsFiltrados.reduce((s, r) => s + r.TOTAL_DESCUENTOS, 0),
    igssLaboralTotal:   rowsFiltrados.reduce((s, r) => s + r.IGSS_LABORAL,     0),
    isrRetenidoTotal:   rowsFiltrados.reduce((s, r) => s + r.ISR_RETENIDO,     0),
    salarioLiquidoTotal:rowsFiltrados.reduce((s, r) => s + r.SALARIO_LIQUIDO,  0),
    totalEmpleados:     rowsFiltrados.length,
    periodoLabel,
  };

  // ── descuentos por tipo ───────────────────────────────────────────────────
  const tipoTotals = new Map<string, number>();
  for (const det of detalles) {
    if (det.TDS_ID <= 0) continue;
    const tipo   = tipoMap.get(det.TDS_ID);
    const nombre = tipo?.TDS_NOMBRE ?? `Tipo ${det.TDS_ID}`;
    tipoTotals.set(nombre, (tipoTotals.get(nombre) ?? 0) + det.DET_MONTO);
  }
  // Fallback if no detalles: use resumen data
  if (tipoTotals.size === 0) {
    if (resumen.igssLaboralTotal)    tipoTotals.set('IGSS Laboral', resumen.igssLaboralTotal);
    if (resumen.isrRetenidoTotal)    tipoTotals.set('ISR Retenido', resumen.isrRetenidoTotal);
    if (rowsFiltrados.some((r) => r.CUOTA_PRESTAMO > 0))
      tipoTotals.set('Cuota Prestamo', rowsFiltrados.reduce((s, r) => s + r.CUOTA_PRESTAMO, 0));
    if (rowsFiltrados.some((r) => r.OTROS_DESCUENTOS > 0))
      tipoTotals.set('Otros', rowsFiltrados.reduce((s, r) => s + r.OTROS_DESCUENTOS, 0));
  }
  const porTipo: DescuentoTipoData[] = [...tipoTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([nombre, total], i) => ({
      nombre,
      total,
      color: TIPO_COLORS[i % TIPO_COLORS.length],
    }));

  // ── evolución mensual (last 5 months) ─────────────────────────────────────
  const mesMap = new Map<string, { total: number; igss: number; isr: number; prestamos: number }>();
  for (const nom of nominas) {
    const key = mesKey(nom.NOM_FECHA_GENERACION);
    if (!key) continue;
    const entry = mesMap.get(key) ?? { total: 0, igss: 0, isr: 0, prestamos: 0 };
    entry.total += nom.NOM_TOTAL_DESCUENTO;
    // Disaggregate via detalles if available
    for (const det of detByNom.get(nom.NOM_ID) ?? []) {
      if (det.TDS_ID <= 0) continue;
      const tipo  = tipoMap.get(det.TDS_ID);
      const clase = tipo ? classifyTds(tipo.TDS_NOMBRE) : 'otros';
      if (clase === 'igss')     entry.igss     += det.DET_MONTO;
      else if (clase === 'isr') entry.isr      += det.DET_MONTO;
      else if (clase === 'prestamo') entry.prestamos += det.DET_MONTO;
    }
    mesMap.set(key, entry);
  }

  const sortedKeys = [...mesMap.keys()].sort().slice(-5);
  const evolucion: DescuentoEvolucion[] = sortedKeys.map((key) => {
    const e = mesMap.get(key)!;
    return {
      mes:       mesLabel(key),
      total:     Math.round(e.total),
      igss:      Math.round(e.igss),
      isr:       Math.round(e.isr),
      prestamos: Math.round(e.prestamos),
    };
  });

  // ── por departamento ──────────────────────────────────────────────────────
  const depNames = [...new Set(rowsFiltrados.map((r) => r.DEPARTAMENTO))].filter((d) => d !== '—');
  const porDepartamento: DescuentoDepData[] = depNames.map((dep) => {
    const emps = rowsFiltrados.filter((r) => r.DEPARTAMENTO === dep);
    return {
      departamento:    dep.length > 8 ? dep.slice(0, 8) + '.' : dep,
      salarioBruto:    Math.round(emps.reduce((s, e) => s + e.SALARIO_BRUTO,    0)),
      totalDescuentos: Math.round(emps.reduce((s, e) => s + e.TOTAL_DESCUENTOS, 0)),
      salarioLiquido:  Math.round(emps.reduce((s, e) => s + e.SALARIO_LIQUIDO,  0)),
    };
  });

  return { empleados: rowsFiltrados, resumen, porTipo, evolucion, porDepartamento };
};

export const descargarPdfDescuentos = (_params: DescuentoParams): void => {
  alert('Generacion de PDF en desarrollo');
};
