import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WorkHistoryIcon from '@mui/icons-material/WorkHistory';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { getDashboardEjecutivo } from '../services/dashboard_ejecutivo.service';
import { getApiErrorMessage } from '../api/errors';
import type { DashboardEjecutivoResponse } from '../interfaces/dashboardEjecutivo';

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatQ(value: number): string {
  return `Q ${Number(value || 0).toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPercent(value: number): string {
  return `${Number(value || 0).toFixed(1)}%`;
}

function monthLabel(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-');
  const idx = Number(month) - 1;
  return `${MONTH_NAMES[idx] ?? month} ${year}`;
}

function buildMonthOptions(count = 12): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

function MetricCard({
  title,
  value,
  helper,
  color,
  icon,
}: {
  title: string;
  value: string | number;
  helper: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, color, mt: 0.5 }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{helper}</Typography>
        </Box>
        <Box sx={{ color, opacity: 0.85 }}>{icon}</Box>
      </Box>
    </Paper>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      <Typography variant="body2" color="text.secondary">{text}</Typography>
    </Box>
  );
}

export default function DashboardEjecutivo() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<DashboardEjecutivoResponse | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>(buildMonthOptions(12).at(-1) ?? '');

  const monthOptions = useMemo(() => buildMonthOptions(12), []);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [year, month] = selectedMonth.split('-').map(Number);
        const response = await getDashboardEjecutivo({ anio: year, mes: month });
        setData(response);
      } catch (err) {
        setError(getApiErrorMessage(err, 'No se pudo cargar el dashboard ejecutivo'));
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    if (selectedMonth) {
      loadDashboard();
    }
  }, [selectedMonth]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedMonthLabel = selectedMonth ? monthLabel(selectedMonth) : 'Periodo actual';

  return (
    <Box sx={{ py: 1 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' } }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Dashboard Ejecutivo</Typography>
          <Typography color="text.secondary">KPIs clave de Recursos Humanos · {selectedMonthLabel}</Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Periodo</InputLabel>
            <Select
              label="Periodo"
              value={selectedMonth}
              onChange={(e: SelectChangeEvent<string>) => setSelectedMonth(e.target.value)}
            >
              {monthOptions.map((m) => (
                <MenuItem key={m} value={m}>{monthLabel(m)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<PictureAsPdfIcon />} disabled>
            Descargar PDF
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert> : null}

      {data && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard title="Total empleados" value={data.resumen.totalEmpleados} helper="Activos en sistema" color="#5B7CFA" icon={<PeopleIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard title="Costo planilla mensual" value={formatQ(data.resumen.costoPlanillaMensual)} helper="Nómina del periodo" color="#2E7D32" icon={<AttachMoneyIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard title="Rotación (12 meses)" value={formatPercent(data.resumen.rotacion12Meses)} helper="Promedio mensual" color="#F57C00" icon={<TrendingUpIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard title="Contratos por vencer" value={data.resumen.contratosPorVencer} helper="En próximos 30 días" color="#C62828" icon={<EventAvailableIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard title="Puntualidad" value={formatPercent(data.resumen.puntualidad)} helper={`Puntuales: ${data.marcajesResumen.puntual}`} color="#7B1FA2" icon={<AssignmentTurnedInIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard title="Horas extra / mes" value={data.resumen.horasExtraMes} helper="Control laboral" color="#1976D2" icon={<AccessTimeIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard title="Vac. pendientes prom." value={data.resumen.vacacionesPendientesPromedio ?? 0} helper="Horas promedio" color="#388E3C" icon={<WorkHistoryIcon />} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <MetricCard title="Ingresos este mes" value={data.resumen.ingresosEsteMes} helper={`Bajas: ${data.resumen.bajasEsteMes}`} color="#0097A7" icon={<EventBusyIcon />} />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Evolución de planilla</Typography>
                <Box sx={{ mt: 1.5, height: 250 }}>
                  {data.evolucionPlanilla.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.evolucionPlanilla.map((x) => ({ ...x, mesLabel: monthLabel(x.mes) }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mesLabel" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                        <RechartsTooltip />
                        <Line type="monotone" dataKey="total" name="Empleados" stroke="#5B7CFA" strokeWidth={3} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState text="Sin datos" />
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Distribución por departamento</Typography>
                <Box sx={{ mt: 1.5, height: 250 }}>
                  {data.distribucionDepartamentos.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.distribucionDepartamentos}
                          dataKey="total"
                          nameKey="departamento"
                          innerRadius={55}
                          outerRadius={95}
                          paddingAngle={3}
                          labelLine={false}
                        >
                          {data.distribucionDepartamentos.map((entry) => (
                            <Cell key={entry.departamento} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState text="Sin datos" />
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Costo planilla por mes</Typography>
                <Box sx={{ mt: 1.5, height: 250 }}>
                  {data.costoPlanillaPorMes.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.costoPlanillaPorMes.map((x) => ({ ...x, mesLabel: monthLabel(x.mes) }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mesLabel" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatQ(Number(v))} />
                        <RechartsTooltip formatter={(v) => formatQ(Number(v))} />
                        <Bar dataKey="costo" fill="#5B7CFA" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState text="Sin datos de nómina" />
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Rotación mensual</Typography>
                <Box sx={{ mt: 1.5, height: 250 }}>
                  {data.rotacionMensual.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.rotacionMensual.map((x) => ({ ...x, mesLabel: monthLabel(x.mes) }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mesLabel" tick={{ fontSize: 11 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 11 }} allowDecimals={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="ingresos" name="Ingresos" fill="#2E7D32" />
                        <Bar yAxisId="left" dataKey="bajas" name="Bajas" fill="#E53935" />
                        <Line yAxisId="right" type="monotone" dataKey="rotacion" name="Rotación %" stroke="#5B7CFA" strokeWidth={3} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState text="Sin datos" />
                  )}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 340 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Obligaciones del período</Typography>
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={1.2}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">IGSS patronal</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatQ(data.obligacionesPeriodo.igssPatronal)}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">IGSS laboral</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatQ(data.obligacionesPeriodo.igssLaboral)}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">ISR retenido</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatQ(data.obligacionesPeriodo.isrRetenido)}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Aguinaldo provisionado</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatQ(data.obligacionesPeriodo.aguinaldoProvisionado)}</Typography></Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography variant="body2">Bono 14 provisionado</Typography><Typography variant="body2" sx={{ fontWeight: 700 }}>{formatQ(data.obligacionesPeriodo.bono14Provisionado)}</Typography></Box>
                </Stack>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main' }}>
                  Total obligaciones: {formatQ(data.obligacionesPeriodo.totalObligaciones)}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                  <Chip color="success" label={`${data.marcajesResumen.puntual} puntuales`} />
                  <Chip color="warning" label={`${data.marcajesResumen.tardanza} tardanzas`} />
                  <Chip color="error" label={`${data.marcajesResumen.ausencias} ausencias`} />
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 340 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Alertas del período</Typography>
                <Divider sx={{ my: 1.5 }} />
                <Stack spacing={1}>
                  {data.alertas.map((item) => (
                    <Paper key={item.tipo} variant="outlined" sx={{ p: 1.2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{item.descripcion}</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 800 }}>{item.cantidad}</Typography>
                    </Paper>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Top horas extra</Typography>
                {data.topHorasExtra.length ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.topHorasExtra} layout="vertical" margin={{ left: 12, right: 18 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="empleado" width={120} tick={{ fontSize: 10 }} />
                      <RechartsTooltip />
                      <Bar dataKey="horas" name="Horas" fill="#F57C00" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState text="Sin datos de horas extra" />
                )}
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Liquidaciones por motivo</Typography>
                {data.liquidaciones.porMotivo.length ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={data.liquidaciones.porMotivo}
                        dataKey="cantidad"
                        nameKey="motivo"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                      >
                        {data.liquidaciones.porMotivo.map((entry) => (
                          <Cell key={entry.motivo} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState text="Sin liquidaciones en el período" />
                )}
              </Paper>
            </Grid>
          </Grid>

          {data.metadata.camposNoDisponibles.length > 0 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Campos no disponibles: {data.metadata.camposNoDisponibles.map((x) => x.campo).join(', ')}
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}
