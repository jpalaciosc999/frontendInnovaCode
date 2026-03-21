export interface Descuento {
    TDS_ID: number;
    TDS_CODIGO: string;
    TDS_NOMBRE: string;
    TDS_DESCRIPCION: string;
    TDS_TIPO_CALCULO: string;
    TDS_VALOR_BASE: number;
    TDS_PORCENTAJE: number;
    TDS_ES_OBLIGATORIO: string; // CHAR(1) -> 'S'/'N'
    TDS_ESTADO: string;         // CHAR(1) -> 'A'/'I'
    TDS_FECHA_CREACION: string;
    TDS_MODIFICACION: string;
}
export interface DescuentoForm {
    tds_codigo: string;
    tds_nombre: string;
    tds_descripcion: string;
    tds_tipo_calculo: string;
    tds_valor_base: number;
    tds_porcentaje: number;
    tds_es_obligatorio: string;
    tds_estado: string;
    tds_fecha_creacion: string;
    tds_modificacion: string;
}
