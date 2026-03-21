export interface Rol {
  ROL_ID: number;
  ROL_NOMBRE: string;
  ROL_DESCRIPCION: string;
  ROL_NIVEL_ACCESO: string;
  ROL_ESTADO: string;
  ROL_FECHA_CREACION: string;
}

export interface RolForm {
  rol_nombre: string;
  rol_descripcion: string;
  rol_nivel_acceso: string;
  rol_estado: string;
  rol_fecha_creacion: string;
}