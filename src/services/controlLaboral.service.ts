import api from '../api/axios';
import type { ControlLaboral, ControlLaboralForm } from '../interfaces/controlLaboral';

const ENDPOINT = 'Periodo';

export const obtenerControles = async (): Promise<ControlLaboral[]> => {
  const res = await api.get<ControlLaboral[]>(ENDPOINT);
  return res.data;
};

export const obtenerControlPorId = async (id: number): Promise<ControlLaboral> => {
  const res = await api.get<ControlLaboral>(`${ENDPOINT}/${id}`);
  return res.data;
};

export const crearControl = async (data: ControlLaboralForm): Promise<void> => {
  await api.post(ENDPOINT, data);
};

export const actualizarControl = async (id: number, data: ControlLaboralForm): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarControl = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};