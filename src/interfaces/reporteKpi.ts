export type KpiEstado = 'Superado' | 'En proceso' | 'No alcanzado';

export interface KpiEmpleadoFila {
  KRE_ID:       number;
  EMP_ID:       number;
  KPI_ID:       number;
  EMPLEADO:     string;
  INICIALES:    string;
  DEPARTAMENTO: string;
  DEP_ID:       number;
  KPI_NOMBRE:   string;
  KPI_TIPO:     string;
  META:         number;
  RESULTADO:    number;
  CUMPLIMIENTO: number;   // percentage 0–200+
  ESTADO:       KpiEstado;
  KRE_FECHA:    string;
  MES:          string;   // "2025-05"
}

export interface KpiDepData {
  departamento: string;
  promedio:     number;
  superados:    number;
  enProceso:    number;
  noAlcanzados: number;
  total:        number;
}

export interface KpiIncumplido {
  kpiNombre:         string;
  empleadosBajoMeta: number;
  promedio:          number;
}

export interface KpiAvancePorIndicador {
  kpiNombre: string;
  promedio:  number;
  fill:      string;
}

export interface KpiResumen {
  promedioCumplimiento: number;
  superaronMeta:        number;
  enProceso:            number;
  noAlcanzaron:         number;
  total:                number;
  periodoLabel:         string;
}

export interface KpiParams {
  periodo?:       string;  // "2025-05"
  departamentoId?: number;
  kpiId?:         number;
  empleadoId?:    number;
}

export interface KpiResponse {
  filas:               KpiEmpleadoFila[];
  resumen:             KpiResumen;
  porDepartamento:     KpiDepData[];
  masIncumplidos:      KpiIncumplido[];
  avancePorIndicador:  KpiAvancePorIndicador[];
  periodos:            string[];  // ["2025-05", "2025-04", ...]
}
