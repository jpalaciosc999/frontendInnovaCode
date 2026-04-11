export interface Marcaje {
  MAR_ID: number;
  MAR_FECHA: string;
  MAR_ENTRADA: string;
  MAR_SALIDA: string;
  MAR_HORAS_EXTRA: number;
  MAR_ESTADO: string;
  EMP_ID: number;
  EMP_NOMBRE?: string;
  EMP_APELLIDO?: string;
  HOR_DESCRIPCION?: string;
}

export interface MarcajeForm {
  fecha: string;
  entrada: string;
  salida: string;
  horas_extra: string | number;
  estado: string;
  emp_id: string | number;
}