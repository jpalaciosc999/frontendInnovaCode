// interfaces/cuentaBancaria.ts
export interface CuentaBancaria {
  CUE_ID: number;
  CUE_NOMBRE: string;
  CUE_NUMERO: string;
  CUE_TIPO: string;
  EMP_ID: number;
}

export interface CuentaBancariaForm {
  ban_nombre: string;
  cue_numero: string;
  cue_tipo: string;
  emp_id: string;
}