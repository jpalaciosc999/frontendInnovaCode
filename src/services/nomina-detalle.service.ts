import api from '../api/axios';
import type { NominaDetalle, NominaDetalleForm } from '../interfaces/nomina-detalle';

const ENDPOINT = 'nominaDetalle';

export const obtenerDetallesNomina = async (): Promise<NominaDetalle[]> => {
    const response = await api.get<NominaDetalle[]>(`${ENDPOINT}/`);
    return response.data;
};

export const crearDetalleNomina = async (data: NominaDetalleForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, data);
};

export const actualizarDetalleNomina = async (id: number, data: NominaDetalleForm): Promise<void> => {
    await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarDetalleNomina = async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};