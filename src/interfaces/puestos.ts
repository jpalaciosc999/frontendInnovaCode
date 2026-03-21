export interface Puesto {
  PUE_ID: number;
  PUE_NOMBRE: string; 
  PUE_SALARIO_BASE: number;
  PUE_DESCRIPCION: string;
  PUE_ESTADO: string;
  PUE_FECHA_CREACION: Date;
  PUE_MODIFICACION: Date;
}

export interface PuestoForm {
  codigo: string;
  nombre: string;
  salario_base: string;
  descripcion: string;
  estado: string;
  dep_id: string;
}