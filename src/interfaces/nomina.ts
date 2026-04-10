export interface Nomina {
    NOM_ID: number;
    NOM_TOTAL_INGRESOS: number;
    NOM_TOTAL_DESCUENTO: number;
    NOM_SALARIO_LIQUIDO: number;
    NOM_FECHA_GENERACION: string;
    PER_ID: number;
    EMP_ID: number;
    LIQ_ID: number;
    NOM_ESTADO: string;
}

export interface NominaForm {
    nom_total_ingresos: string | number;
    nom_total_descuento: string | number;
    nom_salario_liquido: string | number;
    nom_fecha_generacion: string;
    per_id: string | number;
    empleado_id: string | number;
    liq_id: string | number;
    nom_estado: string;
}