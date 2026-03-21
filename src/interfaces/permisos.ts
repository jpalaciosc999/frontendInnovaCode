export interface Permiso {
  PERMISOS_ID: number;
  PER_NOMBRE_PERMISO: string;
  PER_MODULO: string;
  PER_DESCRIPCION: string;
}

export interface PermisoForm {
  per_nombre_permiso: string;
  per_modulo: string;
  per_descripcion: string;
}