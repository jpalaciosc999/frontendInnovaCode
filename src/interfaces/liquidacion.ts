export interface Liquidacion {
    LIQ_ID: number;
    LIQ_FECHA_SALIDA: string;
    LIQ_TIPO_RETIRO: string;
    LIQ_DIAS_TRABAJADO: number;
    LIQ_INDEMNIZACION: number;
    LIQ_VACACIONES_PAGADAS: number;
    LIQ_AGUINALDO_PROPORCIONAL: number;
    LIQ_BONO14_PROPORCIONAL: number;
    LIQ_LIQUIDACION: number;
    LIQ_FECHA_REGISTRO: string;
    EMP_ID: number;
}

export interface LiquidacionForm {
    liq_fecha_salida: string;
    liq_tipo_retiro: string;
    liq_dias_trabajado: string | number;
    liq_indemnizacion: string | number;
    liq_vacaciones_pagadas: string | number;
    liq_aguinaldo_proporcional: string | number;
    liq_bono14_proporcional: string | number;
    liq_liquidacion: string | number;
    liq_fecha_registro: string;
    emp_id: string | number;
}