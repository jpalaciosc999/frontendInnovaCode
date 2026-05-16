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
import AssessmentIcon      from '@mui/icons-material/Assessment';
import PictureAsPdfIcon    from '@mui/icons-material/PictureAsPdf';
import EmojiEventsIcon     from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon      from '@mui/icons-material/TrendingUp';
import TrendingDownIcon    from '@mui/icons-material/TrendingDown';
import HourglassEmptyIcon  from '@mui/icons-material/HourglassEmpty';

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
  RadialBarChart,
  RadialBar,
  ReferenceLine,
} from 'recharts';

import { getReporteKpi, descargarPdfKpi } from '../services/reporte_kpi.service';
import { obtenerKPIs }         from '../services/kpi.service';
import { obtenerEmpleados }    from '../services/empleados.service';
import { obtenerDepartamentos } from '../services/departamentos.service';
import { getApiErrorMessage }  from '../api/errors';

import type { KpiResponse, KpiEstado, KpiParams } from '../interfaces/reporteKpi';
import type { KPI }         from '../interfaces/kpi';
import type { Empleado }    from '../interfaces/empleados';
import type { Departamento } from '../interfaces/departamentos';

// ── paleta ────────────────────────────────────────────────────────────────────

const COLOR_SUPERADO    = '#388E3C';
const COLOR_EN_PROCESO  = '#F57C00';
const COLOR_NO_ALCANZADO = '#C62828';

const ESTADO_COLORS: Record<string, string> = {
  Superado:       COLOR_SUPERADO,
  'En proceso':   COLOR_EN_PROCESO,
  'No alcanzado': COLOR_NO_ALCANZADO,
};

const AVATAR_COLORS = ['#1976D2','#388E3C','#F57C00','#7B1FA2','#C62828','#0097A7','#558B2F','#E91E63'];

// ── helpers ───────────────────────────────────────────────────────────────────

function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function estadoChipColor(estado: KpiEstado): 'success' | 'warning' | 'error' {
  if (estado === 'Superado')       return 'success';
  if (estado === 'En proceso')     return 'warning';
  return 'error';
}

function barColor(pct: number): string {
  if (pct >= 100) return COLOR_SUPERADO;
  if (pct >= 70)  return COLOR_EN_PROCESO;
  return COLOR_NO_ALCANZADO;
}

function fmtPct(v: number): string {
  return `${v}%`;
}

function fmtNum(v: number): string {
  return v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPeriodoLabel(key: string): string {
  const [year, monthStr] = key.split('-');
  const date = new Date(parseInt(year), parseInt(monthStr) - 1, 1);
  const label = date.toLocaleString('es-GT', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ── sub-components ────────────────────────────────────────────────────────────

function MetricCard({
  label, value, color, icon, sub,
}: {
  label: string;
  value: string | number;
  color: string;
  icon: React.ReactNode;
  sub?: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Box sx={{ color, opacity: 0.7 }}>{icon}</Box>
      </Box>
      <Typography variant="h4" sx={{ fontWeight: 700, color, mt: 0.5 }}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Paper>
  );
}

function PctTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 700 }}>{label}</Typography>
      <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
        Promedio: {payload[0].value}%
      </Typography>
    </Paper>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function ReporteKpi() {
  const [data,          setData]          = useState<KpiResponse | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [kpis,          setKpis]          = useState<KPI[]>([]);
  const [empleados,     setEmpleados]     = useState<Empleado[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  // filters
  const [periodo,  setPeriodo]  = useState<string>('');
  const [depId,    setDepId]    = useState<number | ''>('');
  const [kpiId,    setKpiId]    = useState<number | ''>('');
  const [empId,    setEmpId]    = useState<number | ''>('');

  // load selectors
  useEffect(() => {
    Promise.all([
      obtenerKPIs(),
      obtenerEmpleados(),
      obtenerDepartamentos(),
    ]).then(([k, e, d]) => {
      setKpis(k);
      setEmpleados(e);
      setDepartamentos(d);
    }).catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: KpiParams = {
        periodo:        periodo  || undefined,
        departamentoId: depId   !== '' ? depId   : undefined,
        kpiId:          kpiId   !== '' ? kpiId   : undefined,
        empleadoId:     empId   !== '' ? empId   : undefined,
      };
      const result = await getReporteKpi(params);
      setData(result);
      // auto-set most recent period on first load
      if (!periodo && result.periodos.length > 0) {
        setPeriodo(result.periodos[0]);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar el reporte de KPIs'));
    } finally {
      setLoading(false);
    }
  }, [periodo, depId, kpiId, empId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── derived ──────────────────────────────────────────────────────────────────

  const estadoPieData = (() => {
    if (!data) return [];
    const counts: Record<string, number> = {};
    data.filas.forEach(f => {
      counts[f.ESTADO] = (counts[f.ESTADO] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  })();

  // When a specific employee is selected, change left chart to their KPIs
  const empleadoSeleccionado = empId !== '' ? empleados.find(e => e.EMP_ID === empId) : undefined;

  const leftChartData = empleadoSeleccionado && data
    ? data.filas.map(f => ({ name: f.KPI_NOMBRE, promedio: f.CUMPLIMIENTO }))
    : data?.porDepartamento.map(d => ({ name: d.departamento, promedio: d.promedio })) ?? [];

  const leftChartLabel = empleadoSeleccionado
    ? `Indicadores de ${empleadoSeleccionado.EMP_NOMBRE} ${empleadoSeleccionado.EMP_APELLIDO}`
    : 'Cumplimiento por departamento';

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssessmentIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>KPIs por empleado</Typography>
            <Typography variant="body2" color="text.secondary">
              Resultados vs metas por periodo y departamento
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          onClick={() => descargarPdfKpi({ periodo: periodo || undefined })}
        >
          PDF
        </Button>
      </Box>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Periodo</InputLabel>
              <Select
                label="Periodo"
                value={periodo}
                onChange={(e: SelectChangeEvent<string>) => setPeriodo(e.target.value)}
              >
                <MenuItem value="">Todos los periodos</MenuItem>
                {(data?.periodos ?? []).map(p => (
                  <MenuItem key={p} value={p}>{formatPeriodoLabel(p)}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

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
                {departamentos.map(d => (
                  <MenuItem key={d.DEP_ID} value={d.DEP_ID}>{d.DEP_NOMBRE}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Indicador (KPI)</InputLabel>
              <Select
                label="Indicador (KPI)"
                value={kpiId}
                onChange={(e: SelectChangeEvent<number | ''>) =>
                  setKpiId(e.target.value === '' ? '' : Number(e.target.value))
                }
              >
                <MenuItem value="">Todos los indicadores</MenuItem>
                {kpis.map(k => (
                  <MenuItem key={k.KPI_ID} value={k.KPI_ID}>{k.KPI_NOMBRE}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Empleado</InputLabel>
              <Select
                label="Empleado"
                value={empId}
                onChange={(e: SelectChangeEvent<number | ''>) =>
                  setEmpId(e.target.value === '' ? '' : Number(e.target.value))
                }
              >
                <MenuItem value="">Todos los empleados</MenuItem>
                {empleados.map(e => (
                  <MenuItem key={e.EMP_ID} value={e.EMP_ID}>
                    {`${e.EMP_NOMBRE} ${e.EMP_APELLIDO}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* ── Loading / error ─────────────────────────────────────────────────── */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {data && !loading && (
        <>
          {/* ── Employee profile card (only when filtered by employee) ─────── */}
          {empleadoSeleccionado && (
            <Paper variant="outlined" sx={{ p: 2, mb: 3, borderColor: 'primary.light', bgcolor: 'primary.50' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <Avatar
                  sx={{ width: 56, height: 56, bgcolor: hashColor(`${empleadoSeleccionado.EMP_NOMBRE} ${empleadoSeleccionado.EMP_APELLIDO}`), fontSize: 20 }}
                >
                  {(empleadoSeleccionado.EMP_NOMBRE.charAt(0) + empleadoSeleccionado.EMP_APELLIDO.charAt(0)).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
                    {empleadoSeleccionado.EMP_NOMBRE} {empleadoSeleccionado.EMP_APELLIDO}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {departamentos.find(d => d.DEP_ID === empleadoSeleccionado.DEP_ID)?.DEP_NOMBRE ?? 'Sin departamento'} · {data.resumen.total} indicadores evaluados
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Chip label={`Promedio ${data.resumen.promedioCumplimiento}%`} color="primary" />
                  {data.resumen.superaronMeta > 0 && (
                    <Chip label={`${data.resumen.superaronMeta} superados`} color="success" size="small" />
                  )}
                  {data.resumen.noAlcanzaron > 0 && (
                    <Chip label={`${data.resumen.noAlcanzaron} no alcanzados`} color="error" size="small" />
                  )}
                </Box>
              </Box>
            </Paper>
          )}

          {/* ── KPI metric cards ─────────────────────────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, sm: 3 }}>
              <MetricCard
                label="Promedio cumplimiento"
                value={`${data.resumen.promedioCumplimiento}%`}
                color="#1976D2"
                icon={<TrendingUpIcon />}
                sub={data.resumen.periodoLabel}
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <MetricCard
                label="Superaron meta"
                value={data.resumen.superaronMeta}
                color={COLOR_SUPERADO}
                icon={<EmojiEventsIcon />}
                sub="Cumplimiento ≥ 100%"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <MetricCard
                label="En proceso"
                value={data.resumen.enProceso}
                color={COLOR_EN_PROCESO}
                icon={<HourglassEmptyIcon />}
                sub="Cumplimiento 70–99%"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <MetricCard
                label="No alcanzaron meta"
                value={data.resumen.noAlcanzaron}
                color={COLOR_NO_ALCANZADO}
                icon={<TrendingDownIcon />}
                sub="Cumplimiento < 70%"
              />
            </Grid>
          </Grid>

          {/* ── Row 1: Horizontal bar + Incumplidos panel ─────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Horizontal BarChart: cumplimiento por departamento / empleado */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 340 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                  {leftChartLabel}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Promedio de cumplimiento (%)
                </Typography>
                {leftChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={275}>
                    <BarChart
                      layout="vertical"
                      data={leftChartData}
                      margin={{ top: 8, right: 40, left: 20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 120]}
                        tickFormatter={v => `${v}%`}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        tick={{ fontSize: 11 }}
                        width={110}
                      />
                      <ReferenceLine x={100} stroke="#999" strokeDasharray="4 2" label={{ value: 'Meta', fontSize: 10, fill: '#999' }} />
                      <RechartsTooltip content={<PctTooltip />} />
                      <Bar dataKey="promedio" name="Cumplimiento" radius={[0, 4, 4, 0]}>
                        {leftChartData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={barColor(entry.promedio)}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                    <Typography variant="body2" color="text.secondary">Sin datos</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* KPIs más incumplidos panel */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 340 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                  KPIs mas incumplidos
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Indicadores con menor promedio de cumplimiento
                </Typography>
                <Box sx={{ mt: 1.5 }}>
                  {data.masIncumplidos.length === 0 && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      Todos los KPIs superaron la meta
                    </Typography>
                  )}
                  {data.masIncumplidos.map((kpi, i) => (
                    <Box
                      key={kpi.kpiNombre}
                      sx={{ mb: i < data.masIncumplidos.length - 1 ? 2 : 0 }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {kpi.kpiNombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {kpi.empleadosBajoMeta} empleado{kpi.empleadosBajoMeta !== 1 ? 's' : ''} bajo meta
                          </Typography>
                        </Box>
                        <Chip
                          label={`${kpi.promedio}%`}
                          size="small"
                          sx={{
                            bgcolor: barColor(kpi.promedio),
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: 12,
                          }}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min(kpi.promedio, 100)}
                        sx={{
                          height: 5,
                          borderRadius: 3,
                          bgcolor: '#E0E0E0',
                          '& .MuiLinearProgress-bar': { bgcolor: barColor(kpi.promedio) },
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* ── Row 2: Estado donut + Avance por indicador (radial) ─────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Donut: distribución por estado */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                  Distribucion por estado
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Superado · En proceso · No alcanzado
                </Typography>
                {estadoPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={estadoPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {estadoPieData.map(entry => (
                          <Cell key={entry.name} fill={ESTADO_COLORS[entry.name] ?? '#9E9E9E'} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        formatter={(value, name) => [`${value ?? 0} resultados`, String(name)]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                    <Typography variant="body2" color="text.secondary">Sin datos</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* RadialBarChart: avance por indicador */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                  Avance por indicador
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Promedio de cumplimiento (%) por tipo de KPI
                </Typography>
                {data.avancePorIndicador.length > 0 ? (
                  <ResponsiveContainer width="100%" height={258}>
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius={20}
                      outerRadius={110}
                      barSize={14}
                      data={data.avancePorIndicador.map(d => ({
                        name:     d.kpiNombre,
                        promedio: Math.min(d.promedio, 120),
                        fill:     d.fill,
                      }))}
                      startAngle={180}
                      endAngle={0}
                    >
                      <RadialBar
                        dataKey="promedio"
                        cornerRadius={6}
                        label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
                      />
                      <RechartsTooltip
                        formatter={(value, name) => [`${value}%`, String(name)]}
                      />
                      <Legend
                        iconSize={10}
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        formatter={(value) => (
                          <Typography component="span" variant="caption">{value}</Typography>
                        )}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
                    <Typography variant="body2" color="text.secondary">Sin datos de indicadores</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* ── Table ──────────────────────────────────────────────────────── */}
          <Paper variant="outlined">
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Resultados por empleado
              </Typography>
              <Chip label={`${data.filas.length} registros`} size="small" sx={{ bgcolor: 'grey.100' }} />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Empleado</strong></TableCell>
                    <TableCell><strong>Departamento</strong></TableCell>
                    <TableCell><strong>KPI</strong></TableCell>
                    <TableCell align="right"><strong>Meta</strong></TableCell>
                    <TableCell align="right"><strong>Resultado</strong></TableCell>
                    <TableCell align="center" sx={{ minWidth: 130 }}><strong>Cumplimiento</strong></TableCell>
                    <TableCell align="center"><strong>Estado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.filas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No hay registros con los filtros seleccionados
                      </TableCell>
                    </TableRow>
                  )}
                  {data.filas.map(fila => (
                    <TableRow key={fila.KRE_ID} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 30, height: 30, fontSize: 11, bgcolor: hashColor(fila.EMPLEADO) }}>
                            {fila.INICIALES}
                          </Avatar>
                          <Box>
                            <Typography variant="body2">{fila.EMPLEADO}</Typography>
                            <Typography variant="caption" color="text.secondary">{fila.KPI_TIPO}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{fila.DEPARTAMENTO}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{fila.KPI_NOMBRE}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {fila.META > 0 ? `Q ${fmtNum(fila.META)}` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {fila.RESULTADO > 0 ? `Q ${fmtNum(fila.RESULTADO)}` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 130 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(fila.CUMPLIMIENTO, 100)}
                            sx={{
                              flex: 1,
                              height: 7,
                              borderRadius: 4,
                              bgcolor: '#E0E0E0',
                              '& .MuiLinearProgress-bar': { bgcolor: barColor(fila.CUMPLIMIENTO) },
                            }}
                          />
                          <Typography
                            variant="caption"
                            sx={{ minWidth: 38, fontWeight: 600, color: barColor(fila.CUMPLIMIENTO) }}
                          >
                            {fmtPct(fila.CUMPLIMIENTO)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={fila.ESTADO}
                          color={estadoChipColor(fila.ESTADO)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Footer summary */}
            {data.filas.length > 0 && (
              <>
                <Divider />
                <Box sx={{ p: 1.5, bgcolor: 'grey.50', display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">
                    Promedio general:{' '}
                    <strong style={{ color: barColor(data.resumen.promedioCumplimiento) }}>
                      {data.resumen.promedioCumplimiento}%
                    </strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Superaron meta:{' '}
                    <strong style={{ color: COLOR_SUPERADO }}>{data.resumen.superaronMeta}</strong>
                    {' / '}
                    <strong>{data.resumen.total}</strong>
                  </Typography>
                </Box>
              </>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}
