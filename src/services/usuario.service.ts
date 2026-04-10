import api from '../api/axios';
import type { Usuario, UsuarioForm } from '../interfaces/usuario';

const ENDPOINT = 'usuarios';

export const obtenerUsuarios = async (): Promise<Usuario[]> => {
    const response = await api.get<Usuario[]>(`${ENDPOINT}/`);
    return response.data;
};

export const crearUsuario = async (data: UsuarioForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, data);
};

export const actualizarUsuario = async (id: number, data: UsuarioForm): Promise<void> => {
    await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarUsuario = async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};