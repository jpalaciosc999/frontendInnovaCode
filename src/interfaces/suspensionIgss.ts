export interface SuspensionIgss {
  SUS_ID: number;
  EMP_ID: number;
  EMP_NOMBRE: string;
  SUS_NO_CERTIFICADO: string;
  SUS_FECHA_INICIO: string;
  SUS_FECHA_FIN: string;
  SUS_DIAS: number;
  SUS_SALARIO_DIARIO: number;
  SUS_TIPO: string;
  SUS_ESTADO: string;
  SUS_OBSERVACION: string;
}

export interface SuspensionIgssForm {
  emp_id: string | number;
  sus_no_certificado: string;
  sus_fecha_inicio: string;
  sus_fecha_fin: string;
  sus_dias?: string | number;
  sus_salario_diario: string | number;
  sus_tipo: string;
  sus_estado: string;
  sus_observacion: string;
}
