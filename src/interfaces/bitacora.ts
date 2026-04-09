export interface Bitacora {
    BIT_ID: number;
    BIT_ACCION: string;
    BIT_TABLA_AFECTADA: string;
    BIT_ID_REGISTRO: number;
    BIT_DESCRIPCION: string;
    BIT_VALOR_ANTERIOR: string;
    BIT_VALOR_NUEVO: string;
    BIT_IP_USUARIO: string;
    BIT_FECHA: string;
}

export interface BitacoraForm {
    bit_accion: string;
    bit_tabla_afectada: string;
    bit_id_registro: string | number;
    bit_descripcion: string;
    bit_valor_anterior: string;
    bit_valor_nuevo: string;
    bit_ip_usuario: string;
    bit_fecha: string;
}