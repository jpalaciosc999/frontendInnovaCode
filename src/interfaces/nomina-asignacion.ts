export type NominaAsignacionTipo = 'I' | 'D';

export interface NominaAsignacion {
  NAS_ID: number;
  PER_ID: number;
  EMP_ID: number;
  TIS_ID: number | null;
  TDS_ID: number | null;
  NAS_TIPO: NominaAsignacionTipo;
  NAS_MONTO: number;
  NAS_CANTIDAD: number | null;
  NAS_REFERENCIA: string | null;
  NAS_DESCRIPCION: string | null;
  NAS_ESTADO: string;
  NAS_FECHA_CREACION?: string;
  NAS_FECHA_ACTUALIZACION?: string;
}

export interface NominaAsignacionForm {
  per_id: string | number;
  emp_id: string | number;
  nas_tipo: NominaAsignacionTipo | '';
  tis_id: string | number | null;
  tds_id: string | number | null;
  nas_monto: string | number;
  nas_cantidad: string | number | null;
  nas_referencia: string;
  nas_descripcion: string;
  nas_estado: string;
}
