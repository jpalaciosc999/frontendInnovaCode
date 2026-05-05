export interface TipoContrato {
    TIC_ID: number;
    TIC_NOMBRE: string;
    TIC_NUMERO: string;
    TIC_DESCRIPCION: string;
    TIC_TIPO_JORNADA: string;
    TIC_FECHA_MODIFICACION: string;
    EMP_ID?: number;
}

export interface TipoContratoForm {
    tic_nombre: string;
    tic_numero: string;
    tic_descripcion: string;
    tic_tipo_jornada: string;
    tic_fecha_modificacion: string;
    emp_id?: string | number;
}
