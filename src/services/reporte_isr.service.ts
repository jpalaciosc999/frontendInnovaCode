                            import api from '../api/axios';
import type {
  ReporteIsrResponse,
  ReporteIsrParams,
  IsrEmpleadoFila,
  IsrMensual,
} from '../interfaces/reporteIsr';
import type { Empleado } from '../interfaces/empleados';
import type { Puesto } from '../interfaces/puestos';
import type { Departamento } from '../interfaces/departamentos';
import { obtenerSueldoMensual, TASA_IGSS_LABORAL } from '../utils/payroll';

// ── constantes Guatemala Decreto 10-2012 ──────────────────────────────────────
const MINIMO_VITAL_ANUAL = 48_000;
const DEDUCCION_IVA_ANUAL = 12_000;
const TRAMO_1_LIMITE = 300_000;
const TRAMO_1_TASA = 0.05;
const TRAMO_2_TASA = 0.07;
const TRAMO_2_BASE = 15_000;

const MESES_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ── helpers ───────────────────────────────────────────────────────────────────

function initials(nombre: string, apellido: string): string {
  return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }
  const ddmm = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (ddmm) {
    const d = new Date(`${ddmm[3]}-${ddmm[2]}-${ddmm[1]}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function calcMeses(fechaContratacion: unknown, anio: number): number {
  const fecha = parseDate(fechaContratacion);
  if (!fecha) return 12;
  const finAnio = new Date(anio, 11, 31);
  if (fecha > finAnio) return 0;
  const iniAnio = new Date(anio, 0, 1);
  const desde = fecha > iniAnio ? fecha : iniAnio;
  return Math.max(1, 12 - desde.getMonth());
}

function calcIsrFila(salarioMensual: number, meses: number) {
  const rentaAnual      = salarioMensual * meses;
  const igssLaboral     = rentaAnual * TASA_IGSS_LABORAL;
  const creditoIva      = DEDUCCION_IVA_ANUAL * (meses / 12);
  const minimoVital     = MINIMO_VITAL_ANUAL  * (meses / 12);
  const totalDed        = igssLaboral + creditoIva + minimoVital;
  const imponible       = Math.max(0, rentaAnual - totalDed);

  let isrAnual = 0;
  let tasa = 'No afecto';
  if (imponible > 0) {
    if (imponible <= TRAMO_1_LIMITE) {
      isrAnual = imponible * TRAMO_1_TASA;
      tasa = '5%';
    } else {
      isrAnual = TRAMO_2_BASE + (imponible - TRAMO_1_LIMITE) * TRAMO_2_TASA;
      tasa = '5% + 7%';
    }
  }

  return {
    rentaAnual,
    igssLaboral,
    creditoIva,
    minimoVital,
    totalDed,
    imponible,
    isrAnual,
    isrMensual: meses > 0 ? isrAnual / meses : 0,
    tasa,
  };
}

// ── service ───────────────────────────────────────────────────────────────────

export const getReporteIsr = async (
  params: ReporteIsrParams
): Promise<ReporteIsrResponse> => {
  const anio = params.anioFiscal;

  const [empleadosRes, puestosRes, departamentosRes] = await Promise.all([
    api.get<Empleado[]>('/empleados'),
    api.get<Puesto[]>('/puestos'),
    api.get<Departamento[]>('/departamentos'),
  ]);

  const empleados: Empleado[]     = empleadosRes.data;
  const puestos: Puesto[]         = puestosRes.data;
  const departamentos: Departamento[] = departamentosRes.data;

  const puestoMap = new Map(puestos.map((p) => [p.PUE_ID, p]));
  const depMap    = new Map(departamentos.map((d) => [d.DEP_ID, d]));

  // Filtrar activos con actividad en el año fiscal
  let base = empleados.filter((e) => {
    if (e.EMP_ESTADO !== 'A') return false;
    return calcMeses(e.EMP_FECHA_CONTRATACION, anio) > 0;
  });

  if (params.departamentoId) {
    base = base.filter((e) => e.DEP_ID === params.departamentoId);
  }

  // Construir filas
  const rows: IsrEmpleadoFila[] = base.map((emp) => {
    const puesto  = puestoMap.get(emp.PUE_ID ?? 0);
    const dep     = depMap.get(emp.DEP_ID ?? 0);
    const meses   = calcMeses(emp.EMP_FECHA_CONTRATACION, anio);
    const salario = obtenerSueldoMensual(emp, puesto);

    const {
      rentaAnual, igssLaboral, creditoIva, minimoVital,
      totalDed, imponible, isrAnual, isrMensual, tasa,
    } = calcIsrFila(salario, meses);

    // ISR retenido = calculado (sin tabla de retenciones reales en la DB)
    const isrRetenido = isrAnual;
    const diferencia  = +(isrAnual - isrRetenido).toFixed(2);
    const estado: IsrEmpleadoFila['ESTADO'] =
      isrAnual === 0
        ? 'No afecto'
        : diferencia !== 0
          ? 'Diferencia'
          : 'Al día';

    return {
      EMP_ID:            emp.EMP_ID,
      EMPLEADO:          `${emp.EMP_NOMBRE} ${emp.EMP_APELLIDO}`,
      INICIALES:         initials(emp.EMP_NOMBRE, emp.EMP_APELLIDO),
      NIT:               String(emp.EMP_NIT ?? '—'),
      PUESTO:            puesto?.PUE_NOMBRE ?? '—',
      DEPARTAMENTO:      dep?.DEP_NOMBRE ?? '—',
      MESES_LABORADOS:   meses,
      RENTA_ANUAL:       rentaAnual,
      IGSS_LABORAL:      igssLaboral,
      CREDITO_IVA:       creditoIva,
      MINIMO_VITAL:      minimoVital,
      TOTAL_DEDUCCIONES: totalDed,
      RENTA_IMPONIBLE:   imponible,
      TASA:              tasa,
      ISR_CALCULADO:     isrAnual,
      ISR_MENSUAL:       isrMensual,
      ISR_RETENIDO:      isrRetenido,
      DIFERENCIA:        diferencia,
      ESTADO:            estado,
      REGIMEN:           'Opcional Simplificado',
    };
  });

  // Filtro por estado UI
  const rowsFiltrados =
    params.estado ? rows.filter((r) => r.ESTADO === params.estado) : rows;

  // Resumen
  const afectos    = rowsFiltrados.filter((r) => r.ISR_CALCULADO > 0);
  const noAfectos  = rowsFiltrados.filter((r) => r.ISR_CALCULADO === 0);
  const resumen = {
    totalEmpleados:     rowsFiltrados.length,
    empleadosAfectos:   afectos.length,
    empleadosNoAfectos: noAfectos.length,
    totalRentaImponible: afectos.reduce((s, r) => s + r.RENTA_IMPONIBLE, 0),
    totalIsrRetenido:   rowsFiltrados.reduce((s, r) => s + r.ISR_RETENIDO, 0),
    periodoFiscal:      String(anio),
  };

  // Datos mensuales (retención acumulada mes a mes)
  const empConFecha = base.map((emp) => ({
    id:          emp.EMP_ID,
    fecha:       parseDate(emp.EMP_FECHA_CONTRATACION),
    isrMensual:  rowsFiltrados.find((r) => r.EMP_ID === emp.EMP_ID)?.ISR_MENSUAL ?? 0,
  }));

  let acumulado = 0;
  const mensual: IsrMensual[] = MESES_LABELS.map((mes, idx) => {
    const mesNum      = idx + 1;
    const ultimoDia   = new Date(anio, mesNum, 0);
    const isr_mensual = empConFecha.reduce((s, e) => {
      if (!e.fecha || e.fecha > ultimoDia) return s;
      return s + e.isrMensual;
    }, 0);
    acumulado += isr_mensual;
    return { mes, mesNum, isr_mensual, isr_acumulado: acumulado };
  });

  return { empleados: rowsFiltrados, resumen, mensual };
};

export const descargarPdfIsr = async (params: ReporteIsrParams): Promise<void> => {
  const response = await api.get(`/api/reportes/isr/pdf`, {
    params,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(
    new Blob([response.data], { type: 'application/pdf' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-isr-${params.anioFiscal}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};


