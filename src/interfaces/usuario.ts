export interface Usuario {
    USU_ID: number;
    USU_NOMBRE: string;
    USU_CORREO: string;
    USU_PASSWORD: string;
    USU_ESTADO: string;
}

export interface UsuarioForm {
    usu_nombre: string;
    usu_correo: string;
    usu_password: string;
    usu_estado: string;
}