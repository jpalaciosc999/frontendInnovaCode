export const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (!err || typeof err !== 'object') return fallback;

  const record = err as {
    message?: string;
    response?: { data?: { error?: string; message?: string } };
  };

  const message = record.response?.data?.error || record.response?.data?.message || record.message || fallback;

  if (message.includes('ORA-02289')) {
    return 'Oracle no encontro la secuencia usada para generar el ID. Revisa en backend el NEXTVAL usado en este endpoint y crea esa secuencia en la base de datos.';
  }

  return message;
};
