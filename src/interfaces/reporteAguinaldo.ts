export interface AguinaldoEmpleadoFila {
  EMP_ID: number;
  EMPLEADO: string;
  INICIALES: string;
  DEPARTAMENTO: string;
  PUESTO: string;
  SALARIO_BASE: number;
  MESES_LABORADOS: number;
  PROVISION_ACUM: number;
  PROYECCION_TOTAL: number;
  AVANCE_PCT: number;
  ESTADO: 'En curso' | 'Completado' | 'Pendiente';
}

export interface AguinaldoMensual {
  mes: string;
  mesNum: number;
  provisionado: number;
  proyectado: number;
}

export interface AguinaldoResumen {
  provisionAcumulada: number;
  proyeccionTotal: number;
  empleadosConDerecho: number;
  pctAnioTranscurrido: number;
  mesesTranscurridos: number;
  totalMeses: number;
  periodoInicio: string;
  periodoFin: string;
  fechaPago: string;
  anio: number;
}

export interface AguinaldoAvanceDep {
  departamento: string;
  avance: number;
  fill: string;
}

export interface AguinaldoResponse {
  empleados: AguinaldoEmpleadoFila[];
  resumen: AguinaldoResumen;
  mensual: AguinaldoMensual[];
  avancePorDep: AguinaldoAvanceDep[];
}

export interface AguinaldoParams {
  tipo: 'aguinaldo' | 'bono14';
  anio: number;
  departamentoId?: number;
  estado?: string;
}
