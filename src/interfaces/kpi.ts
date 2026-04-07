export interface KPI {
    KPI_ID: number;
    KPI_NOMBRE: string;
    KPI_TIPO: string;
    KPI_VALOR: number;
}

export interface KPIForm {
    kpi_nombre: string;
    kpi_tipo: string;
    kpi_valor: string | number;
}