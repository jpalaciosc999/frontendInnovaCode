// services/controlLaboral.service.ts
import axios from 'axios';
import type { ControlLaboral, ControlLaboralForm } from '../interfaces/controlLaboral';

const BASE_URL = 'http://localhost:3000/api/controles'; // ajusta según tu config

export const obtenerControles = async (): Promise<ControlLaboral[]> => {
  const res = await axios.get<ControlLaboral[]>(BASE_URL);
  return res.data;
};

export const obtenerControlPorId = async (id: number): Promise<ControlLaboral> => {
  const res = await axios.get<ControlLaboral>(`${BASE_URL}/${id}`);
  return res.data;
};

export const crearControl = async (data: ControlLaboralForm): Promise<void> => {
  await axios.post(BASE_URL, data);
};

export const actualizarControl = async (id: number, data: ControlLaboralForm): Promise<void> => {
  await axios.put(`${BASE_URL}/${id}`, data);
};

export const eliminarControl = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/${id}`);
};