    import api from '../api/axios';
import type { Ingreso, IngresoForm } from '../interfaces/tipoIngreso';

const ENDPOINT = 'ingresos';

export const obtenerIngresos = async (): Promise<Ingreso[]> => {
  const response = await api.get<Ingreso[]>(`${ENDPOINT}/`);
  return response.data;
};

export const obtenerIngresoPorId = async (id: number): Promise<Ingreso> => {
  const response = await api.get<Ingreso>(`${ENDPOINT}/${id}`);
  return response.data;
};

export const crearIngreso = async (data: IngresoForm): Promise<void> => {
  await api.post(`${ENDPOINT}/`, data);
};

export const actualizarIngreso = async (id: number, data: IngresoForm): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarIngreso = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};



