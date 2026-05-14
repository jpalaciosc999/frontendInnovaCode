import api from '../api/axios';
import type { UsuarioBitacora } from '../interfaces/usuarioBitacora';
import { readPaginatedRows } from './paginated';

const ENDPOINT = 'usuarioBitacora';

export const obtenerUsuariosBitacora = async (): Promise<UsuarioBitacora[]> => {
  const response = await api.get(`${ENDPOINT}/`);
  return readPaginatedRows<UsuarioBitacora>(response.data).rows;
};
