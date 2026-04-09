import api from '../api/axios';
import type { Bitacora, BitacoraForm } from '../interfaces/bitacora';

const ENDPOINT = 'bitacora';

export const obtenerBitacoras = async (): Promise<Bitacora[]> => {
    const response = await api.get<Bitacora[]>(`${ENDPOINT}/`);
    return response.data;
};

export const crearBitacora = async (data: BitacoraForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, data);
};

export const actualizarBitacora = async (id: number, data: BitacoraForm): Promise<void> => {
    await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarBitacora = async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};