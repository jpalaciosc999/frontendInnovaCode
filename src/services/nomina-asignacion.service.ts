import api from '../api/axios';
import type { NominaAsignacion, NominaAsignacionForm } from '../interfaces/nomina-asignacion';

const ENDPOINT = 'nomina-asignaciones';

const limpiarPayload = (data: NominaAsignacionForm) => ({
  per_id: Number(data.per_id),
  emp_id: Number(data.emp_id),
  nas_tipo: data.nas_tipo,
  tis_id: data.nas_tipo === 'I' && data.tis_id ? Number(data.tis_id) : null,
  tds_id: data.nas_tipo === 'D' && data.tds_id ? Number(data.tds_id) : null,
  nas_monto: Number(data.nas_monto || 0),
  nas_cantidad: data.nas_cantidad !== null && data.nas_cantidad !== '' ? Number(data.nas_cantidad) : null,
  nas_referencia: data.nas_referencia || null,
  nas_descripcion: data.nas_descripcion || null,
  nas_estado: data.nas_estado || 'A',
});

export const obtenerNominaAsignaciones = async (params?: {
  per_id?: string | number;
  emp_id?: string | number;
}): Promise<NominaAsignacion[]> => {
  const response = await api.get<NominaAsignacion[]>(`${ENDPOINT}/`, { params });
  return response.data;
};

export const crearNominaAsignacion = async (data: NominaAsignacionForm): Promise<void> => {
  await api.post(`${ENDPOINT}/`, limpiarPayload(data));
};

export const actualizarNominaAsignacion = async (
  id: number,
  data: NominaAsignacionForm
): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, limpiarPayload(data));
};

export const eliminarNominaAsignacion = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};
