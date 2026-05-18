export interface IgssEmpleadoFila {
  EMP_ID: number;
  EMPLEADO: string;
  INICIALES: string;
  PUESTO: string;
  DEPARTAMENTO: string;
  SALARIO_BASE: number;
  DIAS_TRABAJADOS?: number;
  DIAS_SUSPENDIDOS?: number;
  IGSS_PATRONAL: number;
  IGSS_LABORAL: number;
  TOTAL_IGSS: number;
  ESTADO: string;
  SUSPENDIDO?: boolean;
}

export interface IgssPorDepartamento {
  departamento: string;
  patronal: number;
  laboral: number;
}

export interface IgssResumen {
  totalSalariosBase: number;
  igssPatronal: number;
  igssLaboral: number;
  totalIgss: number;
  fechaLimitePago: string;
  estado: string;
}

export interface ReporteIgssResponse {
  empleados: IgssEmpleadoFila[];
  resumen: IgssResumen;
  porDepartamento: IgssPorDepartamento[];
}

export interface ReporteIgssParams {
  periodoId?: number;
  departamentoId?: number;
  estado?: string;
}
