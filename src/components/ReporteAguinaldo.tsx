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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SummarizeIcon from '@mui/icons-material/Summarize';
import {
  ComposedChart,
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
} from 'recharts';

import { getReporteAguinaldo, descargarPdfAguinaldo } from '../services/reporte_aguinaldo.service';
import { obtenerDepartamentos } from '../services/departamentos.service';
import { getApiErrorMessage } from '../api/errors';

import type { AguinaldoResponse } from '../interfaces/reporteAguinaldo';
import type { Departamento } from '../interfaces/departamentos';

// ── helpers ───────────────────────────────────────────────────────────────────

const ANOS = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

const AVATAR_COLORS = [
  '#1976D2','#388E3C','#F57C00','#7B1FA2',
  '#C62828','#0097A7','#558B2F','#E91E63',
];

function hashColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function fmtQ(v: number) {
  return `Q ${v.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtQDec(v: number) {
  return `Q ${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function estadoChipColor(estado: string): 'success' | 'warning' | 'default' {
  if (estado === 'En curso')   return 'warning';
  if (estado === 'Completado') return 'success';
  return 'default';
}

const ESTADO_COLORS: Record<string, string> = {
  'En curso':   '#F57C00',
  'Completado': '#388E3C',
  'Pendiente':  '#9E9E9E',
};

// ── component ─────────────────────────────────────────────────────────────────

export default function ReporteAguinaldo() {
  const [tabActual, setTabActual]           = useState(0);
  const [anio, setAnio]                     = useState(new Date().getFullYear());
  const [departamentoId, setDepartamentoId] = useState('');
  const [estadoFiltro, setEstadoFiltro]     = useState('');

  const [departamentos, setDepartamentos]   = useState<Departamento[]>([]);
  const [reporteAg, setReporteAg]           = useState<AguinaldoResponse | null>(null);
  const [reporteB14, setReporteB14]         = useState<AguinaldoResponse | null>(null);
  const [cargando, setCargando]             = useState(false);
  const [error, setError]                   = useState('');

  useEffect(() => {
    obtenerDepartamentos().then(setDepartamentos).catch(() => {});
  }, []);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const base = {
        anio,
        ...(departamentoId ? { departamentoId: Number(departamentoId) } : {}),
        ...(estadoFiltro   ? { estado: estadoFiltro }                  : {}),
      };
      const [ag, b14] = await Promise.all([
        getReporteAguinaldo({ ...base, tipo: 'aguinaldo' }),
        getReporteAguinaldo({ ...base, tipo: 'bono14' }),
      ]);
      setReporteAg(ag);
      setReporteB14(b14);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar el reporte'));
    } finally {
      setCargando(false);
    }
  }, [anio, departamentoId, estadoFiltro]);

  useEffect(() => { cargar(); }, [cargar]);

  // Active dataset based on selected tab
  const reporte = tabActual === 0 ? reporteAg : tabActual === 1 ? reporteB14 : null;
  const resumen  = reporte?.resumen;
  const empleados = reporte?.empleados ?? [];
  const mensual   = reporte?.mensual   ?? [];
  const avancePorDep = reporte?.avancePorDep ?? [];

  // Estado distribution data for pie
  const estadoData = (['En curso', 'Completado', 'Pendiente'] as const).map((e) => ({
    name: e,
    value: empleados.filter((emp) => emp.ESTADO === e).length,
    color: ESTADO_COLORS[e],
  })).filter((d) => d.value > 0);
  const estadoTotal = estadoData.reduce((s, d) => s + d.value, 0);

  // Comparativo: side-by-side per department
  const comparativoData = (() => {
    const deps = [...new Set([
      ...(reporteAg?.empleados  ?? []).map((e) => e.DEPARTAMENTO),
      ...(reporteB14?.empleados ?? []).map((e) => e.DEPARTAMENTO),
    ])].filter((d) => d !== '—');

    return deps.map((dep) => ({
      departamento: dep.length > 10 ? dep.slice(0, 10) + '.' : dep,
      aguinaldo: (reporteAg?.empleados  ?? []).filter((e) => e.DEPARTAMENTO === dep).reduce((s, e) => s + e.PROYECCION_TOTAL, 0),
      bono14:    (reporteB14?.empleados ?? []).filter((e) => e.DEPARTAMENTO === dep).reduce((s, e) => s + e.PROYECCION_TOTAL, 0),
    }));
  })();

  const tipoLabel  = tabActual === 0 ? 'Aguinaldo (dic)' : 'Bono 14 (jul)';
  const periodoStr = resumen ? `${resumen.periodoInicio} - ${resumen.periodoFin}` : '';

  return (
    <Box>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SummarizeIcon sx={{ color: 'primary.main', fontSize: 34 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Aguinaldo y Bono 14</Typography>
            <Typography variant="body2" color="text.secondary">
              Provision mensual y liquidacion · Codigo de Trabajo Guatemala
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          startIcon={<PictureAsPdfIcon />}
          size="small"
          onClick={() =>
            descargarPdfAguinaldo({
              tipo: tabActual === 0 ? 'aguinaldo' : 'bono14',
              anio,
              ...(departamentoId ? { departamentoId: Number(departamentoId) } : {}),
              ...(estadoFiltro   ? { estado: estadoFiltro } : {}),
            })
          }
        >
          Descargar PDF
        </Button>
      </Box>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabActual} onChange={(_, v) => setTabActual(v)} sx={{ px: 2 }}>
          <Tab label="Aguinaldo (dic)" />
          <Tab label="Bono 14 (jul)"   />
          <Tab label="Comparativo"     />
        </Tabs>
      </Paper>

      {/* ── Filtros ─────────────────────────────────────────────────────────── */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Año</InputLabel>
              <Select label="Año" value={String(anio)} onChange={(e: SelectChangeEvent) => setAnio(Number(e.target.value))}>
                {ANOS.map((a) => <MenuItem key={a} value={String(a)}>{a}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Departamento</InputLabel>
              <Select label="Departamento" value={departamentoId} onChange={(e: SelectChangeEvent) => setDepartamentoId(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {departamentos.map((d) => (
                  <MenuItem key={d.DEP_ID} value={String(d.DEP_ID)}>{d.DEP_NOMBRE}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {tabActual < 2 && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Estado</InputLabel>
                <Select label="Estado" value={estadoFiltro} onChange={(e: SelectChangeEvent) => setEstadoFiltro(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  <MenuItem value="En curso">En curso</MenuItem>
                  <MenuItem value="Completado">Completado</MenuItem>
                  <MenuItem value="Pendiente">Pendiente</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {cargando && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TABS 0 & 1 — Aguinaldo / Bono 14
      ══════════════════════════════════════════════════════════════════════ */}
      {!cargando && reporte && tabActual < 2 && (
        <>
          {/* KPI cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Provision acumulada ({resumen?.mesesTranscurridos} meses)
                </Typography>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {fmtQ(resumen?.provisionAcumulada ?? 0)}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">Proyeccion total {tabActual === 0 ? 'dic' : 'jul'}</Typography>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {fmtQ(resumen?.proyeccionTotal ?? 0)}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">Empleados con derecho</Typography>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {resumen?.empleadosConDerecho ?? 0}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">% del año transcurrido</Typography>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {(resumen?.pctAnioTranscurrido ?? 0).toFixed(1)}%
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* ── Grafico 1: Provision mensual (Bar) + Panel legal ─────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Provision mensual acumulada
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Avance {periodoStr} vs proyeccion total
                </Typography>
                <ResponsiveContainer width="100%" height={270}>
                  <ComposedChart data={mensual} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) => v >= 1000 ? `Q${(v / 1000).toFixed(0)}k` : `Q${v}`}
                    />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        fmtQDec(Number(value)),
                        name === 'provisionado' ? 'Provisionado' : 'Proyectado',
                      ]}
                    />
                    <Legend
                      formatter={(v: string) => v === 'provisionado' ? 'Provisionado' : 'Proyectado'}
                    />
                    <Bar dataKey="provisionado" stackId="a" fill="#388E3C" name="provisionado" radius={[0,0,0,0]} />
                    <Bar dataKey="proyectado"   stackId="a" fill="#BBDEFB" name="proyectado"   radius={[3,3,0,0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Panel legal */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Parametros legales
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Decreto 76-78 y Codigo de Trabajo
                </Typography>

                {[
                  { label: 'Aguinaldo equivale a', value: '1 salario mensual' },
                  { label: 'Periodo de computo',   value: `Dic ${anio - 1} - Nov ${anio}` },
                  { label: 'Fecha de pago',         value: '1a quincena dic' },
                  { label: 'Bono 14 equivale a',   value: '1 salario mensual' },
                  { label: 'Periodo bono 14',       value: `Jul ${anio - 1} - Jun ${anio}` },
                  { label: 'Fecha pago bono 14',    value: '1a quincena jul' },
                ].map(({ label, value }, i) => (
                  <Box key={i}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25 }}>
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{value}</Typography>
                    </Box>
                    {i < 5 && <Divider />}
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>

          {/* ── Grafico 2: Estado (Donut / Pie) ──────────────────────────────── */}
          {estadoTotal > 0 && (
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Distribucion por estado — {tipoLabel}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Clasificacion de empleados segun avance en el periodo
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <ResponsiveContainer width={220} height={210}>
                      <PieChart>
                        <Pie
                          data={estadoData}
                          cx="50%"
                          cy="50%"
                          innerRadius={58}
                          outerRadius={92}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {estadoData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(v) => [`${v} empleado(s)`]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {estadoData.map((d) => (
                        <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                          <Box sx={{ width: 13, height: 13, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {d.value} empleado(s) · {((d.value / estadoTotal) * 100).toFixed(1)}%
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              {/* ── Grafico 3: Avance por departamento (RadialBar) ────────────── */}
              {avancePorDep.length > 0 && (
                <Grid size={{ xs: 12, md: 7 }}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                      Avance por departamento — {tipoLabel}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Porcentaje promedio de avance en provision por area
                    </Typography>
                    <ResponsiveContainer width="100%" height={210}>
                      <RadialBarChart
                        cx="50%"
                        cy="50%"
                        innerRadius="15%"
                        outerRadius="90%"
                        data={avancePorDep}
                        startAngle={90}
                        endAngle={-270}
                      >
                        <RadialBar
                          dataKey="avance"
                          background={{ fill: '#f5f5f5' }}
                          label={{ position: 'insideStart', fill: '#fff', fontSize: 11, fontWeight: 700 }}
                        />
                        <RechartsTooltip formatter={(v) => [`${v}%`, 'Avance']} />
                        <Legend
                          iconSize={10}
                          layout="vertical"
                          verticalAlign="middle"
                          align="right"
                          formatter={(_v, entry) => {
                            const payload = entry.payload as { departamento?: string; avance?: number } | undefined;
                            return `${payload?.departamento ?? ''} (${payload?.avance ?? 0}%)`;
                          }}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Grid>
              )}
            </Grid>
          )}

          {/* ── Tabla de empleados ────────────────────────────────────────────── */}
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell align="right">Salario base</TableCell>
                  <TableCell align="center">Meses laborados</TableCell>
                  <TableCell align="right">Provision acum.</TableCell>
                  <TableCell align="right">Proyeccion total</TableCell>
                  <TableCell align="center" sx={{ minWidth: 120 }}>Avance</TableCell>
                  <TableCell align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {empleados.map((emp) => (
                  <TableRow key={emp.EMP_ID} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: 13, bgcolor: hashColor(emp.EMPLEADO) }}>
                          {emp.INICIALES}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>{emp.EMPLEADO}</Typography>
                          <Typography variant="caption" color="text.secondary">{emp.DEPARTAMENTO}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{fmtQDec(emp.SALARIO_BASE)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{emp.MESES_LABORADOS} / 12</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{fmtQDec(emp.PROVISION_ACUM)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmtQDec(emp.PROYECCION_TOTAL)}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 120 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ flex: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={emp.AVANCE_PCT}
                            sx={{
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#e0e0e0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: emp.AVANCE_PCT >= 100 ? 'success.main' : 'primary.main',
                                borderRadius: 3,
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ minWidth: 34 }}>
                          {emp.AVANCE_PCT.toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={emp.ESTADO} size="small" color={estadoChipColor(emp.ESTADO)} />
                    </TableCell>
                  </TableRow>
                ))}
                {empleados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No hay datos para los filtros seleccionados
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2 — Comparativo Aguinaldo vs Bono 14
      ══════════════════════════════════════════════════════════════════════ */}
      {!cargando && tabActual === 2 && reporteAg && reporteB14 && (
        <>
          {/* KPI comparativo */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { label: 'Proyeccion Aguinaldo',  value: fmtQ(reporteAg.resumen.proyeccionTotal),  color: 'primary.main' },
              { label: 'Proyeccion Bono 14',    value: fmtQ(reporteB14.resumen.proyeccionTotal), color: 'warning.main' },
              { label: 'Total obligacion',      value: fmtQ(reporteAg.resumen.proyeccionTotal + reporteB14.resumen.proyeccionTotal), color: 'error.main' },
              { label: 'Empleados beneficiados',value: String(Math.max(reporteAg.resumen.empleadosConDerecho, reporteB14.resumen.empleadosConDerecho)), color: 'success.main' },
            ].map(({ label, value, color }) => (
              <Grid key={label} size={{ xs: 12, sm: 6, md: 3 }}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color, mt: 0.5 }}>{value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Grafico comparativo: barras agrupadas por departamento */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              Comparativo Aguinaldo vs Bono 14 por departamento
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Proyeccion total de pago por area — año {anio}
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={comparativoData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="departamento" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => v >= 1000 ? `Q${(v / 1000).toFixed(0)}k` : `Q${v}`}
                />
                <RechartsTooltip
                  formatter={(v, name) => [
                    fmtQDec(Number(v)),
                    name === 'aguinaldo' ? 'Aguinaldo' : 'Bono 14',
                  ]}
                />
                <Legend formatter={(v: string) => v === 'aguinaldo' ? 'Aguinaldo (dic)' : 'Bono 14 (jul)'} />
                <Bar dataKey="aguinaldo" fill="#1976D2" name="aguinaldo" radius={[4,4,0,0]} />
                <Bar dataKey="bono14"    fill="#FF9800" name="bono14"    radius={[4,4,0,0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </Paper>

          {/* Tabla comparativa */}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Departamento</TableCell>
                  <TableCell align="right">Empleados</TableCell>
                  <TableCell align="right">Proyeccion Aguinaldo</TableCell>
                  <TableCell align="right">Proyeccion Bono 14</TableCell>
                  <TableCell align="right">Total obligacion</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparativoData.map((row) => (
                  <TableRow key={row.departamento} hover>
                    <TableCell><Typography variant="body2" sx={{ fontWeight: 500 }}>{row.departamento}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">
                        {reporteAg.empleados.filter((e) => e.DEPARTAMENTO.startsWith(row.departamento.replace('.',''))).length}
                      </Typography>
                    </TableCell>
                    <TableCell align="right"><Typography variant="body2">{fmtQDec(row.aguinaldo)}</Typography></TableCell>
                    <TableCell align="right"><Typography variant="body2">{fmtQDec(row.bono14)}</Typography></TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{fmtQDec(row.aguinaldo + row.bono14)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {comparativoData.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        Sin datos disponibles
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
