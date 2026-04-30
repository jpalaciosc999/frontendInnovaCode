export interface KPIResultado {
    KRE_ID: number;
    KRE_MONTO_TOTAL: number;
    KRE_CALCULO: number;
    KRE_FECHA: string;
    KPI_ID: number;
    EMP_ID?: number;
}

export interface KPIResultadoForm {
    kre_monto_total: string;
    kre_calculo: string;
    kre_fecha: string;
    kpi_id: string;
    emp_id?: string;
}
