import api from '../api/axios';
import type {
  PrestamoDetalle,
  PrestamoDetalleForm
} from '../interfaces/prestamoDetalle';

const ENDPOINT = 'prestamoDetalle';

export const obtenerPrestamoDetalles = async (): Promise<PrestamoDetalle[]> => {
  const response = await api.get<PrestamoDetalle[]>(`${ENDPOINT}/`);
  return response.data;
};

export const obtenerPrestamoDetallePorId = async (
  id: number
): Promise<PrestamoDetalle> => {
  const response = await api.get<PrestamoDetalle>(`${ENDPOINT}/${id}`);
  return response.data;
};

export const crearPrestamoDetalle = async (
  data: PrestamoDetalleForm
): Promise<void> => {
  await api.post(`${ENDPOINT}/`, data);
};

export const actualizarPrestamoDetalle = async (
  id: number,
  data: PrestamoDetalleForm
): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarPrestamoDetalle = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};