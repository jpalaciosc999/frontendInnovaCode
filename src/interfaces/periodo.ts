// interfaces/periodos.ts
export interface Periodo {
  PER_ID: number;
  PER_FECHA_INICIO: string;
  PER_FECHA_FIN: string;
  PER_FECHA_PAGO: string;
  PER_ESTADO: string;
  DIAS_PERIODO?: number;
  TIPO_PERIODO?: 'Q' | 'M' | 'X';
}

export interface PeriodoForm {
  fecha_inicio: string;
  fecha_fin: string;
  fecha_pago: string;
  estado: string;
}
