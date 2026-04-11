import api from '../api/axios';
import type { Horario, HorarioForm } from '../interfaces/horario';

const ENDPOINT = 'horarios';

export const obtenerHorarios = async (): Promise<Horario[]> => {
  const response = await api.get<Horario[]>(`${ENDPOINT}/`);
  return response.data;
};

export const crearHorario = async (data: HorarioForm): Promise<void> => {
  await api.post(`${ENDPOINT}/`, data);
};

export const actualizarHorario = async (id: number, data: HorarioForm): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarHorario = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};