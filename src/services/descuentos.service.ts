
import api from '../api/axios';
import type { Descuento, DescuentoForm } from '../interfaces/descuentos';
const ENDPOINT = 'descuentos';
export const obtenerDescuentos = async (): Promise<Descuento[]> => {
    const response = await api.get<Descuento[]>(`${ENDPOINT}/`);
    return response.data;
};
export const obtenerDescuentoPorId = async (id: number): Promise<Descuento> => {
    const response = await api.get<Descuento>(`${ENDPOINT}/${id}`);
    return response.data;
};
export const crearDescuento = async (data: DescuentoForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, data);
};
export const actualizarDescuento = async (id: number, data: DescuentoForm): Promise<void> => {
    await api.put(`${ENDPOINT}/${id}`, data);
};
export const eliminarDescuento = async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};
