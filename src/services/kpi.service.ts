import api from '../api/axios';
import type { KPI, KPIForm } from '../interfaces/kpi';

const ENDPOINT = 'kpi'; // Asegúrate de que este coincida con app.use("/kpis", ...) en tu backend

export const obtenerKPIs = async (): Promise<KPI[]> => {
    const response = await api.get<KPI[]>(`${ENDPOINT}/`);
    return response.data;
};

export const crearKPI = async (data: KPIForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, data);
};

export const actualizarKPI = async (id: number, data: KPIForm): Promise<void> => {
    await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarKPI = async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};