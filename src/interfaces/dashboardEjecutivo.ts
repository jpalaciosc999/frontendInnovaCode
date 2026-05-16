export interface DashboardMetadata {
  periodoActual: string;
  fechaInicio: string;
  fechaFin: string;
  filtrosAplicados: {
    anio: number | null;
    mes: number | null;
    periodoId: number | null;
    departamentoId: number | null;
    empleadoId: number | null;
    motivoSalida: string | null;
    estadoEmpleado: string | null;
  };
  totalRegistrosProcesados: number;
  camposNoDisponibles: Array<{
    campo: string;
    motivo: string;
  }>;
  formulas: Record<string, string>;
}

export interface DashboardResumen {
  totalEmpleados: number;
  costoPlanillaMensual: number;
  rotacion12Meses: number;
  contratosPorVencer: number;
  puntualidad: number;
  horasExtraMes: number;
  vacacionesPendientesPromedio: number | null;
  ingresosEsteMes: number;
  bajasEsteMes: number;
  liquidacionesMes: number;
}

export interface SerieMesSimple {
  mes: string;
  total: number;
}

export interface SerieMesCosto {
  mes: string;
  costo: number;
}

export interface DistribucionDepartamento {
  departamento: string;
  total: number;
  color: string;
}

export interface RotacionMensualItem {
  mes: string;
  ingresos: number;
  bajas: number;
  rotacion: number;
}

export interface ObligacionesPeriodo {
  igssPatronal: number;
  igssLaboral: number;
  isrRetenido: number;
  aguinaldoProvisionado: number;
  bono14Provisionado: number;
  totalObligaciones: number;
}

export interface TopHorasExtraItem {
  empleado: string;
  iniciales: string;
  departamento: string;
  horas: number;
  total: number;
}

export interface DistribucionEstadoItem {
  estado: string;
  total: number;
}

export interface MarcajesResumen {
  puntual: number;
  tardanza: number;
  ausencias: number;
}

export interface AlertaItem {
  tipo: string;
  descripcion: string;
  cantidad: number;
}

export interface LiquidacionesData {
  porMotivo: Array<{
    motivo: string;
    cantidad: number;
    montoTotal: number;
    color: string;
  }>;
  porEstadoEmpleado: Array<{
    estado: string;
    cantidad: number;
  }>;
  porEmpleado: Array<{
    empleado: string;
    departamento: string;
    motivoSalida: string;
    fechaSalida: string;
    totalLiquidacion: number;
    indemnizacion: number;
    vacaciones: number;
    aguinaldo: number;
    bono14: number;
  }>;
}

export interface DashboardEjecutivoResponse {
  metadata: DashboardMetadata;
  resumen: DashboardResumen;
  evolucionPlanilla: SerieMesSimple[];
  distribucionDepartamentos: DistribucionDepartamento[];
  costoPlanillaPorMes: SerieMesCosto[];
  rotacionMensual: RotacionMensualItem[];
  obligacionesPeriodo: ObligacionesPeriodo;
  topHorasExtra: TopHorasExtraItem[];
  distribucionEstados: DistribucionEstadoItem[];
  marcajesResumen: MarcajesResumen;
  alertas: AlertaItem[];
  liquidaciones: LiquidacionesData;
}

export interface DashboardEjecutivoParams {
  anio?: number;
  mes?: number;
  periodoId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  departamentoId?: number;
  empleadoId?: number;
  motivoSalida?: string;
  estadoEmpleado?: string;
}
