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
    det_referencia: number | null;
    det_monto: number | null;
    nom_id: number | null;
    tis_id: number | null;
    tds_id: number | null;
    kre_id: number | null;
}