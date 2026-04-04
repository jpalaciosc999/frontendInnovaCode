export interface NominaDetalle {
    DET_ID: number;
    DET_REFERENCIA: number;
    DET_MONTO: number;
    NOM_ID: number;
    TIS_ID: number;
    TDS_ID: number;
    KRE_ID: number;
}

export interface NominaDetalleForm {
    det_referencia: string | number;
    det_monto: string | number;
    nom_id: string | number;
    tis_id: string | number;
    tds_id: string | number;
    kre_id: string | number;
}