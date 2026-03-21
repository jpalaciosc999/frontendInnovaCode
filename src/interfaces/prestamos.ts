export interface Prestamo {
  PRE_ID: number;
  PRE_MONTO_TOTAL: number | string;
  PRE_INTERES: number | string;
  PRE_PLAZO: string;
  PRE_CUOTA_MENSUAL: number | string;
  PRE_SALDO_PENDIENTE: number | string;
  PRE_FECHA_INICIO: string;
  PRE_ESTADO: string;
}

export interface PrestamoForm {
  pre_monto_total: string;
  pre_interes: string;
  pre_plazo: string;
  pre_cuota_mensual: string;
  pre_saldo_pendiente: string;
  pre_fecha_inicio: string;
  pre_estado: string;
}