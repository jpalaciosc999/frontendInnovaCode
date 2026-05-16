export interface Empleado {
  EMP_ID: number;
  EMP_NOMBRE: string;
  EMP_APELLIDO: string;
  EMP_DPI: number | string;
  EMP_NIT: number | string;
  EMP_TELEFONO: number | string;
  EMP_FECHA_CONTRATACION: string;
  EMP_ESTADO: string;
  DEP_ID?: number;
  HOR_ID?: number;
  SED_ID?: number;
  PUE_ID?: number;
  TIC_ID?: number;
  EMP_FECHA_INICIO_CONTRATO?: string;
  EMP_FECHA_FIN_CONTRATO?: string;
  EMP_FECHA_LIQUIDACION?: string;
  EMP_SUELDO?: number | string;
  EMP_FOTO?: string | { data?: number[] };
  emp_foto?: string | { data?: number[] };
}

export interface EmpleadoForm {
  emp_nombre: string;
  emp_apellido: string;
  emp_dpi: string;
  emp_nit: string;
  emp_telefono: string;
  emp_fecha_contratacion: string;
  emp_estado: string;
  dep_id?: string;
  hor_id: string;
  sed_id: string;
  pue_id: string;
  tic_id: string;
  emp_fecha_inicio_contrato: string;
  emp_fecha_fin_contrato: string;
  emp_motivo_cambio_contrato?: string;
  emp_sueldo: string;
  emp_foto: string;
}
