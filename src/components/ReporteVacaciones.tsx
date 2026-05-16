import { useEffect, useState, useCallback } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

import { getReporteVacaciones, descargarPdfVacaciones } from '../services/reporte_vacaciones.service';
import { obtenerDepartamentos } from '../services/departamentos.service';
import { getApiErrorMessage } from '../api/errors';

import type { VacacionesResponse, VacacionesEstado, VacacionesParams } from '../interfaces/reporteVacaciones';
import type { Departamento } from '../interfaces/departamentos';

// ── helpers ───────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  '#1976D2', '#388E3C', '#F57C00', '#7B1FA2',
  '#C62828', '#0097A7', '#558B2F', '#E91E63',
];

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function estadoColor(estado: VacacionesEstado): 'success' | 'warning' | 'error' | 'info' {
  if (estado === 'Al día')    return 'success';
  if (estado === 'Pendiente') return 'warning';
  if (estado === 'Alerta')    return 'error';
  return 'info';
}

const ESTADO_PIE_COLORS: Record<string, string> = {
  'Al día':    '#388E3C',
  'Pendiente': '#F57C00',
  'Alerta':    '#C62828',
  'En proceso':'#1976D2',
};

const ANTIGUEDAD_OPTIONS = [
  { value: 0,  label: 'Todos' },
  { value: 1,  label: '1+ año' },
  { value: 2,  label: '2+ años' },
  { value: 3,  label: '3+ años' },
  { value: 5,  label: '5+ años' },
];

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, color = 'inherit',
}: { label: string; value: string | number; color?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h4" fontWeight={700} color={color}>
        {value}
      </Typography>
    </Paper>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ReporteVacaciones() {
  const [data, setData]                     = useState<VacacionesResponse | null>(null);
  const [loading, setLoading]               = useState(false);
  const [error, setError]                   = useState('');
  const [departamentos, setDepartamentos]   = useState<Departamento[]>([]);

  // filters
  const [depId, setDepId]                   = useState<number | ''>('');
  const [estado, setEstado]                 = useState<VacacionesEstado | ''>('');
  const [antiguedadMin, setAntiguedadMin]   = useState<number>(0);

  // load departments once
  useEffect(() => {
    obtenerDepartamentos()
      .then(setDepartamentos)
      .catch(() => setDepartamentos([]));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: VacacionesParams = {
        departamentoId: depId !== '' ? depId : undefined,
        estado:         estado !== '' ? estado : undefined,
        antiguedadMin:  antiguedadMin > 0 ? antiguedadMin : undefined,
      };
      const result = await getReporteVacaciones(params);
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [depId, estado, antiguedadMin]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── derived ─────────────────────────────────────────────────────────────────

  const estadoPieData = (() => {
    if (!data) return [];
    const counts: Record<string, number> = {};
    data.empleados.forEach((e) => {
      counts[e.ESTADO] = (counts[e.ESTADO] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  return (
    <Box>
      {/* ── header ──────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BeachAccessIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Reporte de vacaciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Dias acumulados, disfrutados y pendientes · Minimo 15 dias habiles anuales
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          onClick={() => descargarPdfVacaciones({ departamentoId: depId !== '' ? depId : undefined })}
        >
          Descargar PDF
        </Button>
      </Box>

      {/* ── alerta empleados críticos ───────────────────────────────────────── */}
      {data && data.resumen.empleadosConAlerta > 0 && (
        <Alert
          severity="warning"
          icon={<WarningAmberIcon />}
          sx={{ mb: 3 }}
        >
          <strong>{data.resumen.empleadosConAlerta} empleados</strong> tienen vacaciones pendientes de
          mas de 12 meses. Segun el Articulo 130 del Codigo de Trabajo, las vacaciones son
          irrenunciables y deben otorgarse.
        </Alert>
      )}

      {/* ── filters ─────────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Departamento</InputLabel>
              <Select
                label="Departamento"
                value={depId}
                onChange={(e: SelectChangeEvent<number | ''>) =>
                  setDepId(e.target.value === '' ? '' : Number(e.target.value))
                }
              >
                <MenuItem value="">Todos</MenuItem>
                {departamentos.map((d) => (
                  <MenuItem key={d.DEP_ID} value={d.DEP_ID}>{d.DEP_NOMBRE}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                label="Estado"
                value={estado}
                onChange={(e: SelectChangeEvent<VacacionesEstado | ''>) =>
                  setEstado(e.target.value as VacacionesEstado | '')
                }
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Al día">Al dia</MenuItem>
                <MenuItem value="Pendiente">Pendiente</MenuItem>
                <MenuItem value="Alerta">Alerta</MenuItem>
                <MenuItem value="En proceso">En proceso</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Antiguedad minima</InputLabel>
              <Select
                label="Antiguedad minima"
                value={antiguedadMin}
                onChange={(e: SelectChangeEvent<number>) =>
                  setAntiguedadMin(Number(e.target.value))
                }
              >
                {ANTIGUEDAD_OPTIONS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* ── loading / error ─────────────────────────────────────────────────── */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {data && !loading && (
        <>
          {/* ── KPI cards ─────────────────────────────────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <KpiCard label="Total dias acumulados" value={data.resumen.totalAcumulados} />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <KpiCard label="Dias disfrutados" value={data.resumen.totalDisfrutados} color="#388E3C" />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <KpiCard label="Dias pendientes" value={data.resumen.totalPendientes} color="#F57C00" />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <KpiCard
                label="Empleados con alerta"
                value={data.resumen.empleadosConAlerta}
                color={data.resumen.empleadosConAlerta > 0 ? '#C62828' : 'inherit'}
              />
            </Grid>
          </Grid>

          {/* ── Row 1: Bar chart + Legal panel ────────────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Bar chart: pendientes por departamento */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Vacaciones pendientes por departamento
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Dias habiles pendientes de disfrutar por area
                </Typography>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={data.porDepartamento}
                    margin={{ top: 12, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="departamento" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="disfrutados" name="Disfrutados" stackId="a" fill="#388E3C" />
                    <Bar dataKey="pendientes"  name="Pendientes"  stackId="a" fill="#FFF8E1" stroke="#F57C00" strokeWidth={1} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Marco legal */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Marco legal aplicable
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Codigo de Trabajo — Articulo 130
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                {[
                  ['Dias minimos anuales', '15 dias habiles'],
                  ['Antiguedad requerida', '1 año continuo'],
                  ['Son compensables', 'Solo al liquidar'],
                  ['Son renunciables', <Typography component="span" color="error" variant="body2" key="ren">No — irrenunciables</Typography>],
                  ['Pago vacaciones', 'Salario + 30%'],
                  ['Notificacion previa', '15 dias antes'],
                ].map(([label, value], i) => (
                  <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                    <Typography variant="body2" color="text.secondary">{label}</Typography>
                    {typeof value === 'string'
                      ? <Typography variant="body2" fontWeight={600}>{value}</Typography>
                      : value}
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>

          {/* ── Row 2: Estado pie + Area chart ────────────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Pie chart: distribución por estado */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Distribucion por estado
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Al dia, Pendiente, Alerta, En proceso
                </Typography>
                {estadoPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie
                        data={estadoPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelLine={false}
                      >
                        {estadoPieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={ESTADO_PIE_COLORS[entry.name] ?? '#9E9E9E'}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          `${value} empleados`, name,
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                    <Typography color="text.secondary" variant="body2">Sin datos</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Area chart: dias pendientes por departamento */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Tendencia de dias pendientes por departamento
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Comparativa de dias disfrutados vs pendientes por area
                </Typography>
                <ResponsiveContainer width="100%" height={228}>
                  <AreaChart
                    data={data.porDepartamento}
                    margin={{ top: 12, right: 16, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="gradDisfrutados" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#388E3C" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#388E3C" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gradPendientes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#F57C00" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F57C00" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="departamento" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <RechartsTooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="disfrutados"
                      name="Disfrutados"
                      stroke="#388E3C"
                      strokeWidth={2}
                      fill="url(#gradDisfrutados)"
                    />
                    <Area
                      type="monotone"
                      dataKey="pendientes"
                      name="Pendientes"
                      stroke="#F57C00"
                      strokeWidth={2}
                      fill="url(#gradPendientes)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* ── Employee table ────────────────────────────────────────────── */}
          <Paper variant="outlined">
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Empleado</strong></TableCell>
                    <TableCell><strong>Departamento</strong></TableCell>
                    <TableCell><strong>Antiguedad</strong></TableCell>
                    <TableCell align="center"><strong>Dias acumulados</strong></TableCell>
                    <TableCell align="center"><strong>Disfrutados</strong></TableCell>
                    <TableCell align="center"><strong>Pendientes</strong></TableCell>
                    <TableCell align="center" sx={{ minWidth: 100 }}><strong>Uso</strong></TableCell>
                    <TableCell align="center"><strong>Estado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.empleados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No hay empleados con los filtros seleccionados
                      </TableCell>
                    </TableRow>
                  )}
                  {data.empleados.map((emp) => (
                    <TableRow key={emp.EMP_ID} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            sx={{ width: 30, height: 30, fontSize: 11, bgcolor: hashColor(emp.EMPLEADO) }}
                          >
                            {emp.INICIALES}
                          </Avatar>
                          <Typography variant="body2">{emp.EMPLEADO}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{emp.DEPARTAMENTO}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{emp.ANTIGUEDAD_LABEL}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" fontWeight={600}>{emp.DIAS_ACUMULADOS}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color="#388E3C">{emp.DIAS_DISFRUTADOS}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" color={emp.DIAS_PENDIENTES > 0 ? '#F57C00' : 'inherit'}>
                          {emp.DIAS_PENDIENTES}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 100 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={emp.USO_PCT}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#E0E0E0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: emp.USO_PCT >= 80 ? '#388E3C' : emp.USO_PCT >= 40 ? '#F57C00' : '#C62828',
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ minWidth: 32 }}>
                            {emp.USO_PCT}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={emp.ESTADO}
                          color={estadoColor(emp.ESTADO)}
                          size="small"
                          variant="outlined"
                          icon={emp.ESTADO === 'Alerta' ? <WarningAmberIcon fontSize="small" /> : undefined}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
}
