import api from '../api/axios';
import type { CuentaBancaria, CuentaBancariaForm } from '../interfaces/cuentaBancaria';

const ENDPOINT = 'cuentas';

export const obtenerCuentas = async (): Promise<CuentaBancaria[]> => {
  const res = await api.get<CuentaBancaria[]>(ENDPOINT);
  return res.data;
};

export const obtenerCuentaPorId = async (id: number): Promise<CuentaBancaria> => {
  const res = await api.get<CuentaBancaria>(`${ENDPOINT}/${id}`);
  return res.data;
};

export const crearCuenta = async (data: CuentaBancariaForm): Promise<void> => {
  await api.post(ENDPOINT, data);
};

export const actualizarCuenta = async (id: number, data: CuentaBancariaForm): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarCuenta = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};