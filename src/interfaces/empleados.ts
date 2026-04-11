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
}

export interface EmpleadoForm {
  emp_nombre: string;
  emp_apellido: string;
  emp_dpi: string;
  emp_nit: string;
  emp_telefono: string;
  emp_fecha_contratacion: string;
  emp_estado: string;
  dep_id: string;
  hor_id: string;
}