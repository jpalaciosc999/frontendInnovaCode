export interface Rol {
  ROL_ID: number;
  ROL_NOMBRE: string;
  ROL_DESCRIPCION: string;
  ROL_NIVEL_ACCESO: string;
  ROL_ESTADO: string;
  ROL_FECHA_CREACION: Date;
}

export interface RolForm {
  nombre: string;
  descripcion: string;
  nivel_acceso: string;
  estado: string;
}