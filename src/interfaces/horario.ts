export interface Horario {
  HOR_ID: number;
  HOR_DESCRIPCION: string;
  HOR_HORA_INICIO: string;
  HOR_HORA_FIN: string;
  HOR_LUNES: number;
  HOR_MARTES: number;
  HOR_MIERCOLES: number;
  HOR_JUEVES: number;
  HOR_VIERNES: number;
  HOR_SABADO: number;
  HOR_DOMINGO: number;
}

export interface HorarioForm {
  hor_descripcion: string;
  hor_hora_inicio: string;
  hor_hora_fin: string;
  hor_lunes: number;
  hor_martes: number;
  hor_miercoles: number;
  hor_jueves: number;
  hor_viernes: number;
  hor_sabado: number;
  hor_domingo: number;
}