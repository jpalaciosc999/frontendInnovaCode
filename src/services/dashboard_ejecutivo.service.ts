import api from '../api/axios';
import type { DashboardEjecutivoParams, DashboardEjecutivoResponse } from '../interfaces/dashboardEjecutivo';

const ENDPOINTS = [
  '/api/reportes/ejecutivo',
  '/reportes/ejecutivo',
  '/api/reportes/dashboard/ejecutivo',
];

export async function getDashboardEjecutivo(
  params: DashboardEjecutivoParams,
): Promise<DashboardEjecutivoResponse> {
  let lastError: unknown;

  for (const endpoint of ENDPOINTS) {
    try {
      const response = await api.get<DashboardEjecutivoResponse>(endpoint, { params });
      return response.data;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
