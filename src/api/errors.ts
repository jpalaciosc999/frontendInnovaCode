import { SERVER_CONNECTION_MESSAGE } from './axios';

export const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (!err || typeof err !== 'object') return fallback;

  const record = err as {
    message?: string;
    response?: { data?: { error?: string; message?: string } };
  };

  const message = record.response?.data?.error || record.response?.data?.message || record.message || fallback;

  if (!record.response && (message === 'Network Error' || message.includes('ERR_NETWORK'))) {
    return SERVER_CONNECTION_MESSAGE;
  }

  if (message.includes('ORA-02289')) {
    return 'Oracle no encontro la secuencia usada para generar el ID. Revisa en backend el NEXTVAL usado en este endpoint y crea esa secuencia en la base de datos.';
  }

  if (message.includes('ORA-02291')) {
    return 'No se pudo guardar porque una referencia no existe en la base de datos. En liquidaciones, verifica que el empleado seleccionado exista y que el backend reciba el EMP_ID correcto.';
  }

  return message;
};
