export interface PrestamoDetalle {
  PDE_ID: number;
  PDE_NUMERO_CUOTA: number | string;
  PDE_FECHA_PAGO: string;
  PDE_MONTO: number | string;
  PDE_SALDO_RESTANTE: number | string;
  PDE_ESTADO: string;
  PRE_ID: number | string;
}

export interface PrestamoDetalleForm {
  pde_numero_cuota: string;
  pde_fecha_pago: string;
  pde_monto: string;
  pde_saldo_restante: string;
  pde_estado: string;
  pre_id: string;
}