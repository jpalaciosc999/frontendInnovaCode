export interface Usuario {
  id: number;
  username: string;
  nombre_completo: string;
  correo: string;
  password: string;
  estado: string;
  fecha_creacion: string;
  rol_id: number;
  emp_id: number;
}

export interface UsuarioForm {
  username: string;
  nombre_completo: string;
  correo: string;
  password: string;
  estado: string;
  rol_id?: number;
  emp_id?: number;
}