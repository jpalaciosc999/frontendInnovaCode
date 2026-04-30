import axios from 'axios';
import type { Marcaje } from '../interfaces/marcaje';

// IMPORTANTE: Asegúrate de que el backend use este prefijo o quita /api si no lo usas
const API_URL = 'http://localhost:4000/marcaje';

/**
 * Obtiene el historial de 15 en 15 días (Punto 5 del PDF)
 */
export const obtenerHistorial = async (empId: number, offset: number = 0): Promise<Marcaje[]> => {
  const response = await axios.get(`${API_URL}/historial`, {
    params: { emp_id: empId, offset: offset }
  });
  return response.data;
};

/**
 * Registro unificado: Entrada o Salida automática (Punto 3 del PDF)
 */
export const registrarMarcaje = async (empId: number) => {
  const response = await axios.post(`${API_URL}/registrar`, { emp_id: empId });
  return response.data;
};

/**
 * Punto 6: Autorización (Esta es la que faltaba y causaba el error rojo)
 */
export const updateMarcaje = async (id: number, autorizacion: number) => {
  // Asegúrate de que la URL termine en /id para que el backend lo reciba como req.params
  const response = await axios.put(`${API_URL}/${id}`, { autorizacion });
  return response.data;
};

// Se eliminó eliminarMarcaje para evitar errores, ya que el PDF prohíbe borrar registros.