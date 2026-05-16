export interface MarcajeReporte {
  MAR_ID: number;
  EMP_ID: number;
  EMPLEADO: string;
  INICIALES: string;
  FECHA: string;
  ENTRADA: string;
  SALIDA: string;
  HORAS_TRABAJADAS: string;
  ESTADO: string;
  DEPARTAMENTO: string;
}

export interface ResumenMarcaje {
  totalEmpleados: number;
  puntual: number;
  tardanza: number;
  ausencias: number;
}

export interface AsistenciaPorDia {
  dia: string;
  total: number;
}

export interface DistribucionEstado {
  estado: string;
  total: number;
  porcentaje: number;
}

export interface ReporteMarcajesResponse {
  marcajes: MarcajeReporte[];
  resumen: ResumenMarcaje;
  asistenciaPorDia: AsistenciaPorDia[];
  distribucion: DistribucionEstado[];
}

export interface ReporteMarcajesParams {
  fechaInicio: string;
  fechaFin: string;
  empleadoId?: number;
  departamentoId?: number;
}
