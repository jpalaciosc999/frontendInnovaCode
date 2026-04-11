import api from '../api/axios';
import type { Empleado, EmpleadoForm } from '../interfaces/empleados';

const ENDPOINT = 'empleados';

export const obtenerEmpleados = async (): Promise<Empleado[]> => {
  const response = await api.get<Empleado[]>(`${ENDPOINT}/`);
  return response.data;
};

export const obtenerEmpleadoPorId = async (id: number): Promise<Empleado> => {
  const response = await api.get<Empleado>(`${ENDPOINT}/${id}`);
  return response.data;
};

export const crearEmpleado = async (data: EmpleadoForm): Promise<void> => {
  await api.post(`${ENDPOINT}/`, data);
};

export const actualizarEmpleado = async (id: number, data: EmpleadoForm): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarEmpleado = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};
