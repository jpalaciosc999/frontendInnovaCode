import api from '../api/axios';
import type { Prestamo, PrestamoForm } from '../interfaces/prestamos';

const ENDPOINT = 'prestamo';

export const obtenerPrestamos = async (): Promise<Prestamo[]> => {
  const response = await api.get<Prestamo[]>(`${ENDPOINT}/`);
  return response.data;
};

export const obtenerPrestamoPorId = async (id: number): Promise<Prestamo> => {
  const response = await api.get<Prestamo>(`${ENDPOINT}/${id}`);
  return response.data;
};

export const crearPrestamo = async (data: PrestamoForm): Promise<void> => {
  await api.post(`${ENDPOINT}/`, data);
};

export const actualizarPrestamo = async (
  id: number,
  data: PrestamoForm
): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarPrestamo = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};