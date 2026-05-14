export const getApiErrorMessage = (err: unknown, fallback: string) => {
  if (!err || typeof err !== 'object') return fallback;

  const record = err as {
    message?: string;
    response?: { data?: { error?: string; message?: string } };
  };

  return record.response?.data?.error || record.response?.data?.message || record.message || fallback;
};
