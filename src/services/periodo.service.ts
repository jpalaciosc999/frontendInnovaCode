// services/periodos.service.ts
import axios from 'axios';
import type { Periodo, PeriodoForm } from '../interfaces/periodo';

const BASE_URL = 'http://localhost:3000/api/periodos'; // ajusta según tu config

export const obtenerPeriodos = async (): Promise<Periodo[]> => {
  const res = await axios.get<Periodo[]>(BASE_URL);
  return res.data;
};

export const obtenerPeriodoPorId = async (id: number): Promise<Periodo> => {
  const res = await axios.get<Periodo>(`${BASE_URL}/${id}`);
  return res.data;
};

export const crearPeriodo = async (data: PeriodoForm): Promise<void> => {
  await axios.post(BASE_URL, data);
};

export const actualizarPeriodo = async (id: number, data: PeriodoForm): Promise<void> => {
  await axios.put(`${BASE_URL}/${id}`, data);
};

export const eliminarPeriodo = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/${id}`);
};