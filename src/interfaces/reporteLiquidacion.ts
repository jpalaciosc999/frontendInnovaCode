export interface LiquidacionEmpleadoFila {
  LIQ_ID: number;
  EMP_ID: number;
  EMPLEADO: string;
  INICIALES: string;
  DEPARTAMENTO: string;
  FECHA_SALIDA: string;
  MOTIVO_SALIDA: string;
  DIAS_TRABAJADOS: number;
  INDEMNIZACION: number;
  VACACIONES_PAGADAS: number;
  AGUINALDO_PROPORCIONAL: number;
  BONO14_PROPORCIONAL: number;
  TOTAL_LIQUIDACION: number;
  EMP_ESTADO: string;
}

export interface LiquidacionResumen {
  totalLiquidaciones: number;
  montoTotal: number;
  promedioPorLiquidacion: number;
  promedioDiasTrabajados: number;
  anioLabel: string;
}

export interface LiquidacionPorMotivo {
  motivo: string;
  cantidad: number;
  montoTotal: number;
  color: string;
}

export interface LiquidacionPorDepartamento {
  departamento: string;
  cantidad: number;
  montoTotal: number;
}

export interface LiquidacionEvolucion {
  mes: string;
  cantidad: number;
  montoTotal: number;
}

export interface LiquidacionPorComponente {
  empleado: string;
  indemnizacion: number;
  vacaciones: number;
  aguinaldo: number;
  bono14: number;
  total: number;
}

export interface LiquidacionPorEstado {
  estado: string;
  cantidad: number;
}

export interface LiquidacionParams {
  anio?: number;
  departamentoId?: number;
  motivoSalida?: string;
}

export interface LiquidacionResponse {
  empleados: LiquidacionEmpleadoFila[];
  resumen: LiquidacionResumen;
  porMotivo: LiquidacionPorMotivo[];
  porDepartamento: LiquidacionPorDepartamento[];
  evolucion: LiquidacionEvolucion[];
  porEstado: LiquidacionPorEstado[];
  motivos: string[];
}
