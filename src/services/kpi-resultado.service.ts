import api from '../api/axios';
import type { KPIResultado, KPIResultadoForm } from '../interfaces/kpi-resultado';

const ENDPOINT = 'kpiResultado';

export const obtenerResultados = async (): Promise<KPIResultado[]> => {
    const res = await api.get<KPIResultado[]>(ENDPOINT);
    return res.data;
};

export const crearResultado = async (data: KPIResultadoForm) => {
    return await api.post(ENDPOINT, data);
};

export const actualizarResultado = async (id: number, data: KPIResultadoForm) => {
    return await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarResultado = async (id: number) => {
    return await api.delete(`${ENDPOINT}/${id}`);
};
