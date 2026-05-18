export interface AuditoriaCambio {
  AUD_ID?: number;
  AUD_TABLA?: string;
  AUD_REGISTRO_ID?: number;
  AUD_CAMPO?: string;
  AUD_VALOR_ANTERIOR?: string;
  AUD_VALOR_NUEVO?: string;
  USU_ID?: number;
  AUD_FECHA?: string;
  AUD_IP?: string;
}
