export interface Departamento {
  DEP_ID: number;
  DEP_NOMBRE: string;
  DEP_DESCRIPCION: string;
  DEP_ESTADO: string;
  DEP_FECHA_CREACION: Date;
  DEP_MODIFICACION: Date;
}

export interface DepartamentoForm {
  nombre: string;
  descripcion: string;
  estado: string;
}