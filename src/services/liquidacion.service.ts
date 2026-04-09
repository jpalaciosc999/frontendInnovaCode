import api from '../api/axios';
import type { Liquidacion, LiquidacionForm } from '../interfaces/liquidacion';

const ENDPOINT = 'liquidaciones';

export const obtenerLiquidaciones = async (): Promise<Liquidacion[]> => {
    const response = await api.get<Liquidacion[]>(`${ENDPOINT}/`);
    return response.data;
};

export const crearLiquidacion = async (data: LiquidacionForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, data);
};

export const actualizarLiquidacion = async (id: number, data: LiquidacionForm): Promise<void> => {
    await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarLiquidacion = async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};