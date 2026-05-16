export interface IsrEmpleadoFila {
  EMP_ID: number;
  EMPLEADO: string;
  INICIALES: string;
  NIT: string;
  PUESTO: string;
  DEPARTAMENTO: string;
  MESES_LABORADOS: number;
  RENTA_ANUAL: number;
  IGSS_LABORAL: number;
  CREDITO_IVA: number;
  MINIMO_VITAL: number;
  TOTAL_DEDUCCIONES: number;
  RENTA_IMPONIBLE: number;
  TASA: string;
  ISR_CALCULADO: number;
  ISR_MENSUAL: number;
  ISR_RETENIDO: number;
  DIFERENCIA: number;
  ESTADO: 'Al día' | 'Diferencia' | 'No afecto';
  REGIMEN: string;
}

export interface IsrMensual {
  mes: string;
  mesNum: number;
  isr_mensual: number;
  isr_acumulado: number;
}

export interface IsrResumen {
  totalEmpleados: number;
  empleadosAfectos: number;
  empleadosNoAfectos: number;
  totalRentaImponible: number;
  totalIsrRetenido: number;
  periodoFiscal: string;
}

export interface ReporteIsrResponse {
  empleados: IsrEmpleadoFila[];
  resumen: IsrResumen;
  mensual: IsrMensual[];
}

export interface ReporteIsrParams {
  anioFiscal: number;
  departamentoId?: number;
  tipoRenta?: string;
  estado?: string;
}
