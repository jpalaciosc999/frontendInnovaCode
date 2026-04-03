import axios from 'axios';
import type { CuentaBancaria, CuentaBancariaForm } from '../interfaces/cuentaBancaria';

const BASE_URL = 'http://localhost:3000/api/cuentas'; // ajusta según tu config

export const obtenerCuentas = async (): Promise<CuentaBancaria[]> => {
  const res = await axios.get<CuentaBancaria[]>(BASE_URL);
  return res.data;
};

export const obtenerCuentaPorId = async (id: number): Promise<CuentaBancaria> => {
  const res = await axios.get<CuentaBancaria>(`${BASE_URL}/${id}`);
  return res.data;
};

export const crearCuenta = async (data: CuentaBancariaForm): Promise<void> => {
  await axios.post(BASE_URL, data);
};

export const actualizarCuenta = async (id: number, data: CuentaBancariaForm): Promise<void> => {
  await axios.put(`${BASE_URL}/${id}`, data);
};

export const eliminarCuenta = async (id: number): Promise<void> => {
  await axios.delete(`${BASE_URL}/${id}`);
};