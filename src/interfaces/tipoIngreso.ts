export interface Ingreso {
  TIS_ID: number;
  TIS_CODIGO: string;
  TIS_NOMBRE: string;
  TIS_DESCRIPCION: string;
  TIS_VALOR_BASE: number;
  TIS_ES_RECURRENTE: string;
  FECHA_MODIFICACION: string;
}

export interface IngresoForm {
  tis_codigo: string;
  tis_nombre: string;
  tis_descripcion: string;
  tis_valor_base: number;
  tis_es_recurrente: string;
  fecha_modificacion: string;
}
