import api from '../api/axios';
import type { Departamento, DepartamentoForm } from '../interfaces/departamentos';

const ENDPOINT = 'departamentos';

export const obtenerDepartamentos = async (): Promise<Departamento[]> => {
  const response = await api.get<Departamento[]>(`${ENDPOINT}/`);
  return response.data;
};

export const obtenerDepartamentoPorId = async (id: number): Promise<Departamento> => {
  const response = await api.get<Departamento>(`${ENDPOINT}/${id}`);
  return response.data;
};

export const crearDepartamento = async (data: DepartamentoForm): Promise<void> => {
  await api.post(`${ENDPOINT}/`, data);
};

export const actualizarDepartamento = async (id: number, data: DepartamentoForm): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarDepartamento = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};