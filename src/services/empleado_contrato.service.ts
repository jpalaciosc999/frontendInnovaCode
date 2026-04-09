import api from '../api/axios';
import type { EmpleadoContrato, EmpleadoContratoForm } from '../interfaces/empleado_contrato';

const ENDPOINT = 'empleado-contrato';

export const obtenerContratos = async (): Promise<EmpleadoContrato[]> => {
    const response = await api.get<EmpleadoContrato[]>(`${ENDPOINT}/`);
    return response.data;
};

export const crearContrato = async (data: EmpleadoContratoForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, data);
};

export const actualizarContrato = async (id: number, data: EmpleadoContratoForm): Promise<void> => {
    await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarContrato = async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};