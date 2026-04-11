import api from '../api/axios';
import type { Periodo, PeriodoForm } from '../interfaces/periodo';

const ENDPOINT = 'periodo';

export const obtenerPeriodos = async (): Promise<Periodo[]> => {
  const res = await api.get<Periodo[]>(`${ENDPOINT}/`);
  return res.data;
};

export const obtenerPeriodoPorId = async (id: number): Promise<Periodo> => {
  const res = await api.get<Periodo>(`${ENDPOINT}/${id}`);
  return res.data;
};

export const crearPeriodo = async (data: PeriodoForm): Promise<void> => {
  await api.post(`${ENDPOINT}/`, data);
};

export const actualizarPeriodo = async (id: number, data: PeriodoForm): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarPeriodo = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};