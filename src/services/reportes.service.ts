import api from '../api/axios';
import type { ReporteMarcajesResponse, ReporteMarcajesParams } from '../interfaces/reporteMarcajes';

const ENDPOINT = 'reportes';

export const getMarcajesReporte = async (
  params: ReporteMarcajesParams
): Promise<ReporteMarcajesResponse> => {
  const response = await api.get<ReporteMarcajesResponse>(`/api/${ENDPOINT}/marcajes`, { params });
  return response.data;
};

export const descargarPdfMarcajes = async (
  params: ReporteMarcajesParams
): Promise<void> => {
  const response = await api.get(`/api/${ENDPOINT}/marcajes/pdf`, {
    params,
    responseType: 'blob',
  });
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `reporte-marcajes-${params.fechaInicio}_${params.fechaFin}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
};
