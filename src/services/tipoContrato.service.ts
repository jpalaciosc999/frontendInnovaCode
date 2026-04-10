import api from '../api/axios';
import type { TipoContrato, TipoContratoForm } from '../interfaces/tipoContrato';

const ENDPOINT = 'tipo-contrato';

export const obtenerTiposContrato = async (): Promise<TipoContrato[]> => {
    const response = await api.get<TipoContrato[]>(`${ENDPOINT}/`);
    return response.data;
};

export const crearTipoContrato = async (data: TipoContratoForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, data);
};

export const actualizarTipoContrato = async (id: number, data: TipoContratoForm): Promise<void> => {
    await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarTipoContrato = async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};