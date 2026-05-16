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
    EMPLEADO?: string;
    LIQ_FECHA_ELIMINACION_TXT?: string | null;
    LIQ_ESTADO_RETENCION_TXT?: string | null;
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

export interface LiquidacionCalculo {
    emp_id: number;
    empleado: string;
    fecha_retiro: string;
    tipo_retiro: string;
    fecha_inicio: string;
    salario_base: number;
    dias_trabajado: number;
    vacaciones_generadas: number;
    vacaciones_tomadas: number;
    vacaciones_pendientes: number;
    dias_aguinaldo: number;
    dias_bono14: number;
    indemnizacion: number;
    vacaciones_pagadas: number;
    aguinaldo_proporcional: number;
    bono14_proporcional: number;
    liquidacion: number;
    fecha_eliminacion?: string | null;
}
