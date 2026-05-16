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
import GavelIcon from '@mui/icons-material/Gavel';
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
  LineChart,
  Line,
} from 'recharts';

import { getReporteLiquidacion } from '../services/reporte_liquidacion.service';
import { obtenerDepartamentos } from '../services/departamentos.service';
import { getApiErrorMessage } from '../api/errors';

import type {
  LiquidacionResponse,
  LiquidacionParams,
} from '../interfaces/reporteLiquidacion';
import type { Departamento } from '../interfaces/departamentos';

// ── constants ─────────────────────────────────────────────────────────────────

const ANOS_DISPONIBLES = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const AVATAR_COLORS = [
  '#1976D2', '#388E3C', '#F57C00', '#7B1FA2',
  '#C62828', '#0097A7', '#558B2F', '#E91E63',
];

const COMPONENTE_COLORS: Record<string, string> = {
  indemnizacion: '#1976D2',
  vacaciones:    '#388E3C',
  aguinaldo:     '#F57C00',
  bono14:        '#7B1FA2',
};

const ESTADO_COLORS: Record<string, string> = {
  Activo:   '#388E3C',
  Inactivo: '#C62828',
};

// ── helpers ───────────────────────────────────────────────────────────────────

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function fmtQ(v: number): string {
  return `Q ${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtQShort(v: number): string {
  if (v >= 1_000_000) return `Q ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `Q ${(v / 1_000).toFixed(1)}K`;
  return `Q ${v.toFixed(0)}`;
}

function fmtDate(fecha: string): string {
  if (!fecha) return '—';
  return new Date(fecha).toLocaleDateString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color = 'inherit',
}: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, wordBreak: 'break-word', color }}>
        {value}
      </Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Paper>
  );
}

// ── custom tooltip ────────────────────────────────────────────────────────────

function QTooltip({
  active, payload, label,
}: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Typography variant="caption" sx={{ fontWeight: 700 }}>{label}</Typography>
      {payload.map((p) => (
        <Box key={p.name} sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.color, mt: 0.3 }} />
          <Typography variant="caption">{p.name}: {fmtQ(p.value)}</Typography>
        </Box>
      ))}
    </Paper>
  );
}

// ── pie label ─────────────────────────────────────────────────────────────────

function renderPieLabel({
  cx, cy, midAngle, innerRadius, outerRadius, percent,
}: {
  cx?: number; cy?: number; midAngle?: number;
  innerRadius?: number; outerRadius?: number;
  percent?: number;
}) {
  if ((percent ?? 0) < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const safeCx = cx ?? 0;
  const safeCy = cy ?? 0;
  const safeMid = midAngle ?? 0;
  const safeInner = innerRadius ?? 0;
  const safeOuter = outerRadius ?? 0;
  const radius = safeInner + (safeOuter - safeInner) * 0.5;
  const x = safeCx + radius * Math.cos(-safeMid * RADIAN);
  const y = safeCy + radius * Math.sin(-safeMid * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${((percent ?? 0) * 100).toFixed(0)}%`}
    </text>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ReporteLiquidacion() {
  const [data, setData]                   = useState<LiquidacionResponse | null>(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  // filters
  const [anio, setAnio]               = useState<number | ''>(new Date().getFullYear());
  const [depId, setDepId]             = useState<number | ''>('');
  const [motivoFiltro, setMotivoFiltro] = useState<string>('');

  useEffect(() => {
    obtenerDepartamentos()
      .then(setDepartamentos)
      .catch(() => setDepartamentos([]));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: LiquidacionParams = {
        anio:           anio !== '' ? anio : undefined,
        departamentoId: depId !== '' ? depId : undefined,
        motivoSalida:   motivoFiltro !== '' ? motivoFiltro : undefined,
      };
      const result = await getReporteLiquidacion(params);
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar los datos de liquidaciones'));
    } finally {
      setLoading(false);
    }
  }, [anio, depId, motivoFiltro]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── derived chart data ────────────────────────────────────────────────────

  const componentesData = (data?.empleados ?? [])
    .slice()
    .sort((a, b) => b.TOTAL_LIQUIDACION - a.TOTAL_LIQUIDACION)
    .slice(0, 10)
    .map((e) => ({
      empleado:      e.EMPLEADO.split(' ')[0] + ' ' + (e.EMPLEADO.split(' ')[1]?.[0] ?? '') + '.',
      indemnizacion: e.INDEMNIZACION,
      vacaciones:    e.VACACIONES_PAGADAS,
      aguinaldo:     e.AGUINALDO_PROPORCIONAL,
      bono14:        e.BONO14_PROPORCIONAL,
    }));

  return (
    <Box>
      {/* ── header ──────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <GavelIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Reporte de Liquidaciones
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Resumen de liquidaciones por empleado, motivo de salida y componentes
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<PictureAsPdfIcon />}
          disabled
        >
          Descargar PDF
        </Button>
      </Box>

      {/* ── filters ─────────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Año</InputLabel>
              <Select
                label="Año"
                value={anio}
                onChange={(e: SelectChangeEvent<number | ''>) =>
                  setAnio(e.target.value === '' ? '' : Number(e.target.value))
                }
              >
                <MenuItem value="">Todos</MenuItem>
                {ANOS_DISPONIBLES.map((a) => (
                  <MenuItem key={a} value={a}>{a}</MenuItem>
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
                {departamentos.map((d) => (
                  <MenuItem key={d.DEP_ID} value={d.DEP_ID}>{d.DEP_NOMBRE}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Motivo de salida</InputLabel>
              <Select
                label="Motivo de salida"
                value={motivoFiltro}
                onChange={(e: SelectChangeEvent<string>) => setMotivoFiltro(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {(data?.motivos ?? []).map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* ── loading / error ──────────────────────────────────────────────────── */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {!loading && data && (
        <>
          {/* ── KPI cards ─────────────────────────────────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                label="Total liquidaciones"
                value={data.resumen.totalLiquidaciones}
                sub={data.resumen.anioLabel}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                label="Monto total liquidado"
                value={fmtQ(data.resumen.montoTotal)}
                color="#C62828"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                label="Promedio por liquidación"
                value={fmtQ(data.resumen.promedioPorLiquidacion)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                label="Días trabajados promedio"
                value={`${data.resumen.promedioDiasTrabajados} días`}
              />
            </Grid>
          </Grid>

          {/* ── charts row 1 ──────────────────────────────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Motivo de salida - pie */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Liquidaciones por motivo de salida
                </Typography>
                {data.porMotivo.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                    <Typography variant="body2" color="text.secondary">Sin datos</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={data.porMotivo}
                        dataKey="cantidad"
                        nameKey="motivo"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        labelLine={false}
                        label={renderPieLabel as never}
                      >
                        {data.porMotivo.map((entry) => (
                          <Cell key={entry.motivo} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <Paper variant="outlined" sx={{ p: 1.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>{d.motivo}</Typography>
                              <Typography variant="caption" sx={{ display: 'block' }}>Cantidad: {d.cantidad}</Typography>
                              <Typography variant="caption" sx={{ display: 'block' }}>Total: {fmtQ(d.montoTotal)}</Typography>
                            </Paper>
                          );
                        }}
                      />
                      <Legend
                        formatter={(value) => (
                          <Typography component="span" variant="caption">{value}</Typography>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>

            {/* Estado del empleado - pie */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Estado del empleado
                </Typography>
                {data.porEstado.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                    <Typography variant="body2" color="text.secondary">Sin datos</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie
                        data={data.porEstado}
                        dataKey="cantidad"
                        nameKey="estado"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        labelLine={false}
                        label={renderPieLabel as never}
                      >
                        {data.porEstado.map((entry) => (
                          <Cell
                            key={entry.estado}
                            fill={ESTADO_COLORS[entry.estado] ?? '#90A4AE'}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <Paper variant="outlined" sx={{ p: 1.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>{d.estado}</Typography>
                              <Typography variant="caption" sx={{ display: 'block' }}>Cantidad: {d.cantidad}</Typography>
                            </Paper>
                          );
                        }}
                      />
                      <Legend
                        formatter={(value) => (
                          <Typography component="span" variant="caption">{value}</Typography>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>

            {/* Liquidaciones por departamento - bar */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Monto por departamento
                </Typography>
                {data.porDepartamento.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                    <Typography variant="body2" color="text.secondary">Sin datos</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart
                      data={data.porDepartamento}
                      layout="vertical"
                      margin={{ left: 8, right: 24 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={fmtQShort} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="departamento" width={90} tick={{ fontSize: 10 }} />
                      <RechartsTooltip content={<QTooltip />} />
                      <Bar dataKey="montoTotal" name="Total liquidado" fill="#1976D2" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* ── charts row 2 ──────────────────────────────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Evolución mensual */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 280 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Evolución mensual de liquidaciones
                </Typography>
                {data.evolucion.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                    <Typography variant="body2" color="text.secondary">Sin datos para el periodo seleccionado</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data.evolucion} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis yAxisId="monto" tickFormatter={fmtQShort} tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="cnt" orientation="right" allowDecimals={false} tick={{ fontSize: 10 }} />
                      <RechartsTooltip
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <Paper variant="outlined" sx={{ p: 1.5 }}>
                              <Typography variant="caption" sx={{ fontWeight: 700 }}>{label}</Typography>
                              {payload.map((p) => (
                                <Box key={p.name} sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: p.color as string, mt: 0.3 }} />
                                  <Typography variant="caption">
                                    {p.name}: {p.name === 'Monto' ? fmtQ(p.value as number) : p.value}
                                  </Typography>
                                </Box>
                              ))}
                            </Paper>
                          );
                        }}
                      />
                      <Legend />
                      <Line yAxisId="monto" type="monotone" dataKey="montoTotal" name="Monto" stroke="#1976D2" strokeWidth={2} dot={{ r: 4 }} />
                      <Line yAxisId="cnt"   type="monotone" dataKey="cantidad"   name="Cantidad" stroke="#F57C00" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>

            {/* Componentes por empleado - stacked bar (top 10) */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 280 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                  Componentes por empleado (top 10 por monto)
                </Typography>
                {componentesData.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                    <Typography variant="body2" color="text.secondary">Sin datos</Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={componentesData} margin={{ left: 8, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="empleado" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={40} />
                      <YAxis tickFormatter={fmtQShort} tick={{ fontSize: 10 }} />
                      <RechartsTooltip content={<QTooltip />} />
                      <Legend />
                      <Bar dataKey="indemnizacion" name="Indemnización" stackId="a" fill={COMPONENTE_COLORS.indemnizacion} />
                      <Bar dataKey="vacaciones"    name="Vacaciones"    stackId="a" fill={COMPONENTE_COLORS.vacaciones} />
                      <Bar dataKey="aguinaldo"     name="Aguinaldo"     stackId="a" fill={COMPONENTE_COLORS.aguinaldo} />
                      <Bar dataKey="bono14"        name="Bono 14"       stackId="a" fill={COMPONENTE_COLORS.bono14} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          {/* ── detail table ──────────────────────────────────────────────── */}
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
            Detalle por empleado
          </Typography>

          {data.empleados.length === 0 ? (
            <Alert severity="info">No hay liquidaciones para los filtros seleccionados.</Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Empleado</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Departamento</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Fecha salida</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Motivo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Días trab.</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Indemnización</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Vacaciones</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Aguinaldo</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Bono 14</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Total</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.empleados.map((row) => (
                    <TableRow key={row.LIQ_ID} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            sx={{
                              width: 30, height: 30, fontSize: 12, fontWeight: 700,
                              bgcolor: hashColor(row.EMPLEADO),
                            }}
                          >
                            {row.INICIALES}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                              {row.EMPLEADO}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{row.DEPARTAMENTO}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{fmtDate(row.FECHA_SALIDA)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.MOTIVO_SALIDA}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{row.DIAS_TRABAJADOS.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{fmtQ(row.INDEMNIZACION)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{fmtQ(row.VACACIONES_PAGADAS)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{fmtQ(row.AGUINALDO_PROPORCIONAL)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{fmtQ(row.BONO14_PROPORCIONAL)}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
                          {fmtQ(row.TOTAL_LIQUIDACION)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={row.EMP_ESTADO === 'A' ? 'Activo' : 'Inactivo'}
                          color={row.EMP_ESTADO === 'A' ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Box>
  );
}
