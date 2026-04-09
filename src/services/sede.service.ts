import api from '../api/axios';
import type { Sede, SedeForm } from '../interfaces/sede';

const ENDPOINT = 'sede';

export const obtenerSedes = async (): Promise<Sede[]> => {
    const response = await api.get<Sede[]>(`${ENDPOINT}/`);
    return response.data;
};

export const crearSede = async (data: SedeForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, data);
};

export const actualizarSede = async (id: number, data: SedeForm): Promise<void> => {
    await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarSede = async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};