import { lazy, Suspense, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import SummarizeIcon from '@mui/icons-material/Summarize';

import { useAuth } from '../context/AuthContext';
import { getCurrentUserRole, reportesPorRol } from '../config/roleViews';
import PageHeader from './common/PageHeader';

const ReporteMarcajes = lazy(() => import('./ReporteMarcajes'));
const ReporteIgss = lazy(() => import('./ReporteIgss'));
const ReporteIsr = lazy(() => import('./ReporteIsr'));
const ReporteAguinaldo = lazy(() => import('./ReporteAguinaldo'));
const ReporteVacaciones = lazy(() => import('./ReporteVacaciones'));
const ReporteDescuentos = lazy(() => import('./ReporteDescuentos'));
const ReporteKpi = lazy(() => import('./ReporteKpi'));
const ReporteHorasExtra = lazy(() => import('./ReporteHorasExtra'));
const ReporteLiquidacion = lazy(() => import('./ReporteLiquidacion'));
const DashboardEjecutivo = lazy(() => import('./DashboardEjecutivo'));

type ReportDefinition = {
  key: string;
  text: string;
  path: string;
  component: ReactNode;
};

const reportesDisponibles: ReportDefinition[] = [
  { key: 'reporte-marcajes', text: 'Reporte de Marcajes', path: '/reporte-marcajes', component: <ReporteMarcajes /> },
  { key: 'reporte-igss', text: 'Reporte IGSS', path: '/reporte-igss', component: <ReporteIgss /> },
  { key: 'reporte-isr', text: 'Reporte ISR Anual', path: '/reporte-isr', component: <ReporteIsr /> },
  { key: 'reporte-aguinaldo', text: 'Reporte Aguinaldo/Bono 14', path: '/reporte-aguinaldo', component: <ReporteAguinaldo /> },
  { key: 'reporte-vacaciones', text: 'Reporte de Vacaciones', path: '/reporte-vacaciones', component: <ReporteVacaciones /> },
  { key: 'reporte-descuentos', text: 'Reporte de Descuentos', path: '/reporte-descuentos', component: <ReporteDescuentos /> },
  { key: 'reporte-liquidacion', text: 'Reporte de Liquidaciones', path: '/reporte-liquidacion', component: <ReporteLiquidacion /> },
  { key: 'reporte-kpi', text: 'Reporte KPIs', path: '/reporte-kpi', component: <ReporteKpi /> },
  { key: 'reporte-horas-extra', text: 'Reporte Horas Extra', path: '/reporte-horas-extra', component: <ReporteHorasExtra /> },
  { key: 'dashboard-ejecutivo', text: 'Dashboard Ejecutivo', path: '/dashboard-ejecutivo', component: <DashboardEjecutivo /> },
];

export default function ReportesView() {
  const { canAccessPath, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentRole = useMemo(() => getCurrentUserRole(), [user]);

  const reportesPermitidos = useMemo(() => {
    const reportesDelRol = currentRole ? reportesPorRol[currentRole] ?? [] : [];
    const allowedKeys = new Set(reportesDelRol.map((reporte) => reporte.key));
    const reportesPorPermiso = reportesDisponibles.filter((reporte) => canAccessPath(reporte.path));

    if (allowedKeys.size === 0) return reportesPorPermiso;

    const reportesDelRolDisponibles = reportesDisponibles.filter((reporte) => allowedKeys.has(reporte.key));
    const reportesPermitidos = new Map<string, ReportDefinition>();

    [...reportesDelRolDisponibles, ...reportesPorPermiso].forEach((reporte) => {
      reportesPermitidos.set(reporte.key, reporte);
    });

    return Array.from(reportesPermitidos.values());
  }, [canAccessPath, currentRole]);

  const reporteParam = searchParams.get('reporte') ?? '';
  const reporteSeleccionado =
    reportesPermitidos.find((reporte) => reporte.key === reporteParam) ?? reportesPermitidos[0];

  useEffect(() => {
    if (!reporteSeleccionado) return;
    if (reporteParam !== reporteSeleccionado.key) {
      navigate(`/reportes?reporte=${reporteSeleccionado.key}`, { replace: true });
    }
  }, [navigate, reporteParam, reporteSeleccionado]);

  const handleReporteChange = (event: SelectChangeEvent) => {
    navigate(`/reportes?reporte=${event.target.value}`);
  };

  return (
    <Box>
      <PageHeader
        title="Reportes"
        subtitle="Selecciona el reporte que quieres consultar y revisa indicadores contables, laborales o gerenciales."
        icon={<SummarizeIcon />}
        actions={
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 340 } }}>
            <InputLabel>Reporte</InputLabel>
            <Select
              label="Reporte"
              value={reporteSeleccionado?.key ?? ''}
              onChange={handleReporteChange}
              disabled={reportesPermitidos.length === 0}
            >
              {reportesPermitidos.map((reporte) => (
                <MenuItem key={reporte.key} value={reporte.key}>
                  {reporte.text}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        }
      />

      {!reporteSeleccionado ? (
        <Alert severity="warning">No tienes reportes disponibles para consultar.</Alert>
      ) : (
        <Suspense
          fallback={
            <Box sx={{ minHeight: 320, display: 'grid', placeItems: 'center' }}>
              <CircularProgress />
            </Box>
          }
        >
          {reporteSeleccionado.component}
        </Suspense>
      )}
    </Box>
  );
}
