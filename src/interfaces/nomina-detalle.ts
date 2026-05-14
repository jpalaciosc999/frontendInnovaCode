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
    det_referencia: string | number | null;
    det_monto: string | number | null;
    nom_id: string | number | null;
    tis_id: string | number | null;
    tds_id: string | number | null;
    kre_id: string | number | null;
}
