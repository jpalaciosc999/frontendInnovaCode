export type VacacionesEstado = 'Al día' | 'Pendiente' | 'Alerta' | 'En proceso';

export interface VacacionesEmpleadoFila {
  EMP_ID: number;
  EMPLEADO: string;
  INICIALES: string;
  DEPARTAMENTO: string;
  SEDE: string;
  ANTIGUEDAD_ANIOS: number;
  ANTIGUEDAD_LABEL: string;
  DIAS_ACUMULADOS: number;
  DIAS_DISFRUTADOS: number;
  DIAS_PENDIENTES: number;
  USO_PCT: number;
  ESTADO: VacacionesEstado;
}

export interface VacacionesDepData {
  departamento: string;
  disfrutados: number;
  pendientes: number;
}

export interface VacacionesResumen {
  totalAcumulados: number;
  totalDisfrutados: number;
  totalPendientes: number;
  empleadosConAlerta: number;
  totalEmpleados: number;
}

export interface VacacionesParams {
  departamentoId?: number;
  sedeId?: number;
  estado?: VacacionesEstado;
  antiguedadMin?: number;
}

export interface VacacionesResponse {
  empleados: VacacionesEmpleadoFila[];
  resumen: VacacionesResumen;
  porDepartamento: VacacionesDepData[];
}
