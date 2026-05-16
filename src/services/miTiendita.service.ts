import api from '../api/axios';
import type {
  PagoMiTiendita,
  PagoMiTienditaForm,
  TotalPendienteMiTiendita,
} from '../interfaces/miTiendita';

const ENDPOINT = 'mi-tiendita';

const toPayload = (data: PagoMiTienditaForm, empId?: number) => {
  const payload: Record<string, unknown> = {
    tipo_gasto: data.mit_tipo_gasto,
    monto: data.mit_monto,
    fecha: data.mit_fecha,
    descripcion: data.mit_descripcion,
    tds_id: data.tds_id || null,
  };

  /*
    El backend obtiene el EMP_ID desde el token.
    Pero dejamos emp_id opcional por si el usuario es ADMINISTRADOR_NOMINA
    o CONTABILIDAD y en algún momento necesita registrar para otro empleado.
  */
  if (empId && Number.isFinite(empId)) {
    payload.emp_id = empId;
  }

  return payload;
};

export const obtenerPagosMiTiendita = async (): Promise<PagoMiTiendita[]> => {
  const response = await api.get<PagoMiTiendita[]>(`${ENDPOINT}/`);
  return response.data;
};

export const obtenerMisPagosMiTiendita = async (): Promise<PagoMiTiendita[]> => {
  const response = await api.get<PagoMiTiendita[]>(`${ENDPOINT}/mis-pagos`);
  return response.data;
};

export const obtenerTotalesPendientesMiTiendita = async (): Promise<TotalPendienteMiTiendita[]> => {
  const response = await api.get<TotalPendienteMiTiendita[]>(`${ENDPOINT}/totales-pendientes`);
  return response.data;
};

export const obtenerPagoMiTienditaPorId = async (id: number): Promise<PagoMiTiendita> => {
  const response = await api.get<PagoMiTiendita>(`${ENDPOINT}/${id}`);
  return response.data;
};

export const crearPagoMiTiendita = async (
  data: PagoMiTienditaForm,
  empId?: number
): Promise<void> => {
  await api.post(`${ENDPOINT}/`, toPayload(data, empId));
};

export const actualizarPagoMiTiendita = async (
  id: number,
  data: PagoMiTienditaForm,
  empId?: number
): Promise<void> => {
  await api.put(`${ENDPOINT}/${id}`, toPayload(data, empId));
};

export const eliminarPagoMiTiendita = async (id: number): Promise<void> => {
  await api.delete(`${ENDPOINT}/${id}`);
};

export const anularPagoMiTiendita = async (id: number): Promise<void> => {
  await api.patch(`${ENDPOINT}/${id}/anular`);
};