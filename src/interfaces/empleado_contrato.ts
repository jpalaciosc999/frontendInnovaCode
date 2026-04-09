export interface EmpleadoContrato {
    TCO_ID: number;
    TCO_FECHA_INICIO: string;
    TCO_FECHA_FIN: string;
    TCO_ESTADO: string;
    TIC_FECHA_MODIFICACION: string;
    TIC_ID: number;
}

export interface EmpleadoContratoForm {
    tco_fecha_inicio: string;
    tco_fecha_fin: string;
    tco_estado: string;
    tic_fecha_modificacion: string;
    tic_id: string | number;
}