import api from '../api/axios';
import type { Marcaje } from '../interfaces/marcaje';

const API_URL = 'marcaje';

export const obtenerMarcajes = async (): Promise<Marcaje[]> => {
  const response = await api.get(`${API_URL}/`);
  return response.data;
};

export const obtenerHistorial = async (empId: number, offset: number = 0): Promise<Marcaje[]> => {
  const response = await api.get(`${API_URL}/historial`, {
    params: { emp_id: empId, offset },
  });
  return response.data;
};

export const registrarMarcaje = async (empId: number) => {
  const response = await api.post(`${API_URL}/registrar`, { emp_id: empId });
  return response.data;
};

export const updateMarcaje = async (id: number, autorizacion: number) => {
  const response = await api.put(`${API_URL}/${id}`, { autorizacion });
  return response.data;
};
