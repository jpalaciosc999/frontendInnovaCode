import api from '../api/axios';
import type { Bitacora } from '../interfaces/bitacora';
import { readPaginatedRows } from './paginated';

const ENDPOINT = 'bitacora';

export const obtenerBitacoras = async (): Promise<Bitacora[]> => {
  const response = await api.get(`${ENDPOINT}/`);
  return readPaginatedRows<Bitacora>(response.data).rows;
};
