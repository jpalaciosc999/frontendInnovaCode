import api from '../api/axios';
import type { UsuarioBitacora, UsuarioBitacoraForm } from '../interfaces/usuarioBitacora';

const ENDPOINT = 'usuario-bitacora';

export const obtenerUsuariosBitacora = async (): Promise<UsuarioBitacora[]> => {
    const response = await api.get<UsuarioBitacora[]>(`${ENDPOINT}/`);
    return response.data;
};

export const crearUsuarioBitacora = async (data: UsuarioBitacoraForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, data);
};

export const actualizarUsuarioBitacora = async (id: number, data: UsuarioBitacoraForm): Promise<void> => {
    await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarUsuarioBitacora = async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};