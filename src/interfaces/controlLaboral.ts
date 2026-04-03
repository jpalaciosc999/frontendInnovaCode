// interfaces/controlLaboral.ts
export interface ControlLaboral {
  CTL_ID: number;
  CTL_FECHA_INICIO: string;
  CTL_FECHA_REGRESO: string;
  CTL_MOTIVO: string;
  CTL_HORAS: number;
  CTL_DESCRIPCION: string;
  CTL_ESTADO: string;
  CTL_FECHA_REGISTRO: string;
  EMP_ID: number;
}

export interface ControlLaboralForm {
  ctl_fecha_inicio: string;
  ctl_fecha_regreso: string;
  ctl_motivo: string;
  ctl_horas: string;
  ctl_descripcion: string;
  ctl_estado: string;
  ctl_fecha_registro: string;
  emp_id: string;
}