import axios from 'axios';
import type { KPIResultado, KPIResultadoForm } from '../interfaces/kpi-resultado';

const API_URL = 'http://localhost:4000/kpiResultado';

export const obtenerResultados = async (): Promise<KPIResultado[]> => {
    const res = await axios.get(API_URL);
    return res.data;
};

export const crearResultado = async (data: KPIResultadoForm) => {
    return await axios.post(API_URL, data);
};

export const actualizarResultado = async (id: number, data: KPIResultadoForm) => {
    return await axios.put(`${API_URL}/${id}`, data);
};

export const eliminarResultado = async (id: number) => {
    return await axios.delete(`${API_URL}/${id}`);
};