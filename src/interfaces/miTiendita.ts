export type TipoGastoMiTiendita = 'SEGURO' | 'PARQUEO' | 'TIENDA';
export type EstadoPagoMiTiendita = 'PENDIENTE' | 'APLICADO' | 'ANULADO';

export interface PagoMiTiendita {
  MIT_ID: number;
  EMP_ID: number;

  EMP_NOMBRE?: string;
  EMP_APELLIDO?: string;

  NOM_ID?: number | null;
  TDS_ID?: number | null;

  MIT_TIPO_GASTO: TipoGastoMiTiendita | string;
  MIT_MONTO: number;
  MIT_FECHA: string;
  MIT_DESCRIPCION?: string | null;
  MIT_ESTADO: EstadoPagoMiTiendita | string;

  MIT_FECHA_CREACION?: string;
  MIT_MODIFICACION?: string;
}

export interface PagoMiTienditaForm {
  mit_tipo_gasto: TipoGastoMiTiendita | '';
  mit_monto: string | number;
  mit_fecha: string;
  mit_descripcion: string;
  tds_id?: string | number | null;
}

export interface TotalPendienteMiTiendita {
  EMP_ID: number;
  TOTAL_MI_TIENDITA: number;
}