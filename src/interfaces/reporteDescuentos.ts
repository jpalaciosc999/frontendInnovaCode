export type DescuentoEstado = 'Normal' | 'Descuento alto' | 'Alerta';

export interface DescuentoEmpleadoFila {
  EMP_ID: number;
  NOM_ID: number;
  EMPLEADO: string;
  INICIALES: string;
  DEPARTAMENTO: string;
  SALARIO_BRUTO: number;
  IGSS_LABORAL: number;
  ISR_RETENIDO: number;
  CUOTA_PRESTAMO: number;
  OTROS_DESCUENTOS: number;
  TOTAL_DESCUENTOS: number;
  SALARIO_LIQUIDO: number;
  PCT_DESCUENTO: number;
  ESTADO: DescuentoEstado;
}

export interface DescuentoTipoData {
  nombre: string;
  total: number;
  color: string;
}

export interface DescuentoEvolucion {
  mes: string;
  total: number;
  igss: number;
  isr: number;
  prestamos: number;
}

export interface DescuentoDepData {
  departamento: string;
  salarioBruto: number;
  totalDescuentos: number;
  salarioLiquido: number;
}

export interface DescuentoResumen {
  totalDescuentosMes: number;
  igssLaboralTotal: number;
  isrRetenidoTotal: number;
  salarioLiquidoTotal: number;
  totalEmpleados: number;
  periodoLabel: string;
}

export interface DescuentoParams {
  departamentoId?: number;
  estado?: DescuentoEstado;
}

export interface DescuentoResponse {
  empleados: DescuentoEmpleadoFila[];
  resumen: DescuentoResumen;
  porTipo: DescuentoTipoData[];
  evolucion: DescuentoEvolucion[];
  porDepartamento: DescuentoDepData[];
}
