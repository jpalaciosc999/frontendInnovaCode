import api from '../api/axios';
import type { Periodo, PeriodoEstado, PeriodoForm } from '../interfaces/periodo';

const ENDPOINT = 'periodo';

const toOracleDateLiteral = (value: string) => {
  if (!value) return value;

  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!isoMatch) return value;

  const [, year, month, day] = isoMatch;
  return `${day}/${month}/${year}`;
};

const formatPeriodoPayload = (data: PeriodoForm): PeriodoForm => ({
  ...data,
  fecha_inicio: toOracleDateLiteral(data.fecha_inicio),
  fecha_fin: toOracleDateLiteral(data.fecha_fin),
  fecha_pago: toOracleDateLiteral(data.fecha_pago),
});

const toInputDate = (value?: string) => {
  if (!value) return '';

  const raw = String(value);
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const oracleMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (oracleMatch) return `${oracleMatch[3]}-${oracleMatch[2]}-${oracleMatch[1]}`;

  return raw.slice(0, 10);
};

const periodoToForm = (periodo: Periodo, estado: PeriodoEstado): PeriodoForm => ({
  fecha_inicio: toInputDate(periodo.PER_FECHA_INICIO),
  fecha_fin: toInputDate(periodo.PER_FECHA_FIN),
  fecha_pago: toInputDate(periodo.PER_FECHA_PAGO),
  estado,
});

export const obtenerPeriodos = async (): Promise<Periodo[]> => {
  const res = await api.get<Periodo[]>(`${ENDPOINT}/`);
  return res.data;
};

export const obtenerPeriodoPorId = async (id: number): Promise<Periodo> => {
  const res = await api.get<Periodo>(`${ENDPOINT}/${id}`);
  return res.data;
};

export const crearPeriodo = async (data: PeriodoForm): Promise<void> => {
  await api.post(`${ENDPOINT}/`, formatPeriodoPayload(data));
};

export const actualizarPeriodo = async (id: number, data: PeriodoForm): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, formatPeriodoPayload(data));
};

export const actualizarEstadoPeriodo = async (
  periodo: Periodo,
  estado: PeriodoEstado,
  motivo?: string
): Promise<void> => {
  try {
    await api.put(`${ENDPOINT}/${periodo.PER_ID}/estado`, {
      estado,
      motivo,
    });
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status !== 404) throw err;

    await actualizarPeriodo(periodo.PER_ID, periodoToForm(periodo, estado));
  }
};

export const eliminarPeriodo = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};
