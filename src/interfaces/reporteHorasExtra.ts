export interface HorasExtraFila {
  EMP_ID: number;
  EMPLEADO: string;
  INICIALES: string;
  DEPARTAMENTO: string;
  DEP_ID: number;
  SALARIO_HORA: number;
  HORAS_EXTRA: number;
  VALOR_HORA_EXTRA: number;
  TOTAL_A_PAGAR: number;
  ALERTA: boolean;
}

export interface HorasExtraPorDia {
  dia: string;
  horas: number;
}

export interface HorasExtraPorDepto {
  departamento: string;
  horas: number;
  costo: number;
  color: string;
}

export interface HorasExtraPorEmpleado {
  empleado: string;
  iniciales: string;
  horas: number;
  total: number;
}

export interface HorasExtraAvance {
  fecha: string;
  label: string;
  horas: number;
  acumulado: number;
}

export interface HorasExtraResumen {
  totalHoras: number;
  costoTotal: number;
  promedioPorEmpleado: number;
  empleadosAlerta: number;
  totalEmpleados: number;
}

export interface HorasExtraResponse {
  filas: HorasExtraFila[];
  resumen: HorasExtraResumen;
  porDia: HorasExtraPorDia[];
  porDepartamento: HorasExtraPorDepto[];
  porEmpleado: HorasExtraPorEmpleado[];
  avance: HorasExtraAvance[];
}

export interface HorasExtraParams {
  fechaInicio: string;
  fechaFin: string;
  departamentoId?: number;
}
