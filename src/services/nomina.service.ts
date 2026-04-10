import api from '../api/axios';
import type { Nomina, NominaForm } from '../interfaces/nomina';

const ENDPOINT = 'nominas';

export const obtenerNominas = async (): Promise<Nomina[]> => {
    const response = await api.get<Nomina[]>(`${ENDPOINT}/`);
    return response.data;
};

export const crearNomina = async (data: NominaForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, data);
};

export const actualizarNomina = async (id: number, data: NominaForm): Promise<void> => {
    await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarNomina = async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};