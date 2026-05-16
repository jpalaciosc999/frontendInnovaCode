import api from '../api/axios';
import type { Nomina, NominaForm } from '../interfaces/nomina';

const ENDPOINT = 'nominas';

type NominaPayload = {
    total_ingresos: string | number;
    total_descuento: string | number;
    salario_liquido: string | number;
    nom_fecha_generacion: string;
    per_id: string | number;
    emp_id: string | number;
    liq_id: string | number | null;
    estado: string;
};

export type GenerarNominaPayload = {
    per_id: string | number;
    fecha_generacion?: string;
    estado?: string;
    emp_ids?: number[];
    recalcular?: boolean;
};

export type GenerarNominaResponse = {
    mensaje?: string;
    message?: string;
    generadas?: unknown[];
    omitidas?: unknown[];
    errores?: unknown[];
    resumen?: {
        generadas?: number;
        omitidas?: number;
        errores?: number;
    };
    [key: string]: unknown;
};

const toOracleDateLiteral = (value: string) => {
    if (!value) return value;

    const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!isoMatch) return value;

    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
};

const formatNominaPayload = (data: NominaForm): NominaPayload => ({
    total_ingresos: data.nom_total_ingresos,
    total_descuento: data.nom_total_descuento,
    salario_liquido: data.nom_salario_liquido,
    nom_fecha_generacion: toOracleDateLiteral(data.nom_fecha_generacion),
    per_id: data.per_id,
    emp_id: data.empleado_id,
    liq_id: data.liq_id || null,
    estado: data.nom_estado,
});

export const obtenerNominas = async (): Promise<Nomina[]> => {
    const response = await api.get<Nomina[]>(`${ENDPOINT}/`);
    return response.data;
};

export const crearNomina = async (data: NominaForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, formatNominaPayload(data));
};

export const actualizarNomina = async (id: number, data: NominaForm): Promise<void> => {
    await api.put(`${ENDPOINT}/${id}`, formatNominaPayload(data));
};

export const eliminarNomina = async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};

export const generarNominas = async (data: GenerarNominaPayload): Promise<GenerarNominaResponse> => {
    const response = await api.post<GenerarNominaResponse>(`${ENDPOINT}/generar`, data);
    return response.data;
};
