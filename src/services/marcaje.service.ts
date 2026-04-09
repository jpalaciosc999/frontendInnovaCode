import axios from 'axios';
// Cambia '../interfaces/marcaje' por './marcaje'
import type { Marcaje, MarcajeForm } from '../interfaces/marcaje';

const API_URL = 'http://localhost:4000/marcaje';

// Cambiamos los nombres para que coincidan con los del componente
export const obtenerMarcajes = async (): Promise<Marcaje[]> => {
    const response = await axios.get(API_URL);
    return response.data;
};

export const crearMarcaje = async (data: MarcajeForm) => {
    return await axios.post(API_URL, data);
};

export const actualizarMarcaje = async (id: number, data: MarcajeForm) => {
    return await axios.put(`${API_URL}/${id}`, data);
};

export const eliminarMarcaje = async (id: number) => {
    return await axios.delete(`${API_URL}/${id}`);
};