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
  await api.put(`${ENDPOINT}/${periodo.PER_ID}/estado`, {
    estado,
    motivo,
  });
};

export const eliminarPeriodo = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};
