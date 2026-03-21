import api from '../api/axios';
import type { Puesto, PuestoForm } from '../interfaces/puestos';

const ENDPOINT = 'puestos';

export const obtenerPuestos = async (): Promise<Puesto[]> => {
  const response = await api.get<Puesto[]>(`${ENDPOINT}/`);
  return response.data;
};

export const obtenerPuestoPorId = async (id: number): Promise<Puesto> => {
  const response = await api.get<Puesto>(`${ENDPOINT}/${id}`);
  return response.data;
};

export const crearPuesto = async (data: PuestoForm): Promise<void> => {
  await api.post(`${ENDPOINT}/`, data);
};

export const actualizarPuesto = async (id: number, data: PuestoForm): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarPuesto = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};