import api from '../api/axios';
import type { Liquidacion, LiquidacionCalculo, LiquidacionForm } from '../interfaces/liquidacion';

const ENDPOINT = 'liquidaciones';

type LiquidacionPayload = {
    fecha_retiro: string;
    tipo_retiro: string;
    dias_trabajado: string | number;
    indemnizacion: string | number;
    vacaciones_pagadas: string | number;
    aguinaldo_proporcional: string | number;
    bono14_proporcional: string | number;
    liquidacion: string | number;
    fecha_registro: string;
    emp_id: string | number;
};

const formatLiquidacionPayload = (data: LiquidacionForm): LiquidacionPayload => ({
    fecha_retiro: data.liq_fecha_salida,
    tipo_retiro: data.liq_tipo_retiro,
    dias_trabajado: data.liq_dias_trabajado,
    indemnizacion: data.liq_indemnizacion,
    vacaciones_pagadas: data.liq_vacaciones_pagadas,
    aguinaldo_proporcional: data.liq_aguinaldo_proporcional,
    bono14_proporcional: data.liq_bono14_proporcional,
    liquidacion: data.liq_liquidacion,
    fecha_registro: data.liq_fecha_registro || data.liq_fecha_salida,
    emp_id: data.emp_id,
});

export const obtenerLiquidaciones = async (): Promise<Liquidacion[]> => {
    const response = await api.get<Liquidacion[]>(`${ENDPOINT}/`);
    return response.data;
};

export const calcularLiquidacion = async (data: LiquidacionForm): Promise<LiquidacionCalculo> => {
    const response = await api.post<LiquidacionCalculo>(`${ENDPOINT}/calcular`, formatLiquidacionPayload(data));
    return response.data;
};

export const crearLiquidacion = async (data: LiquidacionForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, formatLiquidacionPayload(data));
};

export const actualizarLiquidacion = async (id: number, data: LiquidacionForm): Promise<void> => {
    await api.put(`${ENDPOINT}/${id}`, formatLiquidacionPayload(data));
};

export const eliminarLiquidacion = async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
};
