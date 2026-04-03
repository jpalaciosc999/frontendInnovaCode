// interfaces/periodos.ts
export interface Periodo {
  PER_ID: number;
  PER_FECHA_INICIO: string;
  PER_FECHA_FIN: string;
  PER_FECHA_PAGO: string;
  PER_ESTADO: string;
}

export interface PeriodoForm {
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  estado: string;
}