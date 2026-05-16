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
import ContentCutIcon from '@mui/icons-material/ContentCut';
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

import { getReporteDescuentos, descargarPdfDescuentos } from '../services/reporte_descuentos.service';
import { obtenerDepartamentos } from '../services/departamentos.service';
import { getApiErrorMessage } from '../api/errors';

import type { DescuentoResponse, DescuentoEstado, DescuentoParams } from '../interfaces/reporteDescuentos';
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

function estadoColor(estado: DescuentoEstado): 'success' | 'warning' | 'error' {
  if (estado === 'Normal')        return 'success';
  if (estado === 'Descuento alto') return 'warning';
  return 'error';
}

function fmtQ(v: number): string {
  return `Q ${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtQShort(v: number): string {
  if (v >= 1_000_000) return `Q ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `Q ${(v / 1_000).toFixed(1)}K`;
  return `Q ${v.toFixed(0)}`;
}

const ESTADO_PIE_COLORS: Record<string, string> = {
  'Normal':         '#388E3C',
  'Descuento alto': '#F57C00',
  'Alerta':         '#C62828',
};

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

function QTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
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

// ── component ─────────────────────────────────────────────────────────────────

export default function ReporteDescuentos() {
  const [data, setData]                   = useState<DescuentoResponse | null>(null);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  // filters
  const [depId, setDepId]     = useState<number | ''>('');
  const [estado, setEstado]   = useState<DescuentoEstado | ''>('');

  useEffect(() => {
    obtenerDepartamentos()
      .then(setDepartamentos)
      .catch(() => setDepartamentos([]));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: DescuentoParams = {
        departamentoId: depId !== '' ? depId : undefined,
        estado:         estado !== '' ? estado : undefined,
      };
      const result = await getReporteDescuentos(params);
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar los datos'));
    } finally {
      setLoading(false);
    }
  }, [depId, estado]);

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
          <ContentCutIcon sx={{ fontSize: 32, color: 'error.main' }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Reporte de descuentos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Control de descuentos aplicados en nomina por empleado
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<PictureAsPdfIcon />}
          onClick={() => descargarPdfDescuentos({ departamentoId: depId !== '' ? depId : undefined })}
        >
          Descargar PDF
        </Button>
      </Box>

      {/* ── filters ─────────────────────────────────────────────────────────── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                label="Estado"
                value={estado}
                onChange={(e: SelectChangeEvent<DescuentoEstado | ''>) =>
                  setEstado(e.target.value as DescuentoEstado | '')
                }
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Normal">Normal</MenuItem>
                <MenuItem value="Descuento alto">Descuento alto</MenuItem>
                <MenuItem value="Alerta">Alerta</MenuItem>
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
              <KpiCard
                label="Total descuentos"
                value={fmtQ(data.resumen.totalDescuentosMes)}
                sub={data.resumen.periodoLabel}
                color="#C62828"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <KpiCard
                label="IGSS Laboral (4.83%)"
                value={fmtQ(data.resumen.igssLaboralTotal)}
                sub="Descuento obligatorio"
                color="#F57C00"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <KpiCard
                label="ISR retenido"
                value={fmtQ(data.resumen.isrRetenidoTotal)}
                sub="Retencion mensual"
                color="#1976D2"
              />
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <KpiCard
                label="Salario liquido total"
                value={fmtQ(data.resumen.salarioLiquidoTotal)}
                sub="Neto a pagar empleados"
                color="#388E3C"
              />
            </Grid>
          </Grid>

          {/* ── Row 1: Descuentos por tipo + Evolución ────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Bar horizontal: descuentos por tipo */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                  Descuentos por tipo
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Monto total acumulado por categoria
                </Typography>
                {data.porTipo.length > 0 ? (
                  <ResponsiveContainer width="100%" height={255}>
                    <BarChart
                      layout="vertical"
                      data={data.porTipo}
                      margin={{ top: 8, right: 24, left: 80, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => fmtQShort(v)}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis
                        dataKey="nombre"
                        type="category"
                        tick={{ fontSize: 11 }}
                        width={80}
                      />
                      <RechartsTooltip content={<QTooltip />} />
                      <Bar dataKey="total" name="Total" radius={[0, 4, 4, 0]}>
                        {data.porTipo.map((entry) => (
                          <Cell key={entry.nombre} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
                    <Typography color="text.secondary" variant="body2">Sin datos de detalles</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* Line chart: evolución de descuentos */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 320 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                  Evolucion de descuentos
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Ultimos periodos — IGSS, ISR y prestamos
                </Typography>
                {data.evolucion.length > 0 ? (
                  <ResponsiveContainer width="100%" height={255}>
                    <LineChart
                      data={data.evolucion}
                      margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => fmtQShort(v)} tick={{ fontSize: 10 }} />
                      <RechartsTooltip content={<QTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="total"     name="Total"    stroke="#C62828" strokeWidth={2} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="igss"      name="IGSS"     stroke="#F57C00" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
                      <Line type="monotone" dataKey="isr"       name="ISR"      stroke="#1976D2" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
                      <Line type="monotone" dataKey="prestamos" name="Prestamos" stroke="#7B1FA2" strokeWidth={2} dot={{ r: 3 }} strokeDasharray="5 3" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240 }}>
                    <Typography color="text.secondary" variant="body2">Sin historial de nominas</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* ── Row 2: Estado pie + Salario vs Descuentos por dpto ───────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Donut: distribución por estado */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                  Distribucion por estado
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Normal, Descuento alto, Alerta
                </Typography>
                {estadoPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
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
                        formatter={(value, name) => [
                          `${value ?? 0} empleados`, String(name),
                        ]}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                    <Typography color="text.secondary" variant="body2">Sin datos</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>

            {/* BarChart agrupado: Salario bruto / Descuentos / Liquido por dpto */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper variant="outlined" sx={{ p: 2, height: 300 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700 }}>
                  Salario liquido vs total de descuentos por departamento
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Comparacion entre salario bruto, descuentos aplicados y neto recibido
                </Typography>
                {data.porDepartamento.length > 0 ? (
                  <ResponsiveContainer width="100%" height={228}>
                    <BarChart
                      data={data.porDepartamento}
                      margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      barCategoryGap="20%"
                      barGap={2}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="departamento"
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                        height={36}
                      />
                      <YAxis
                        tickFormatter={(v) => fmtQShort(v)}
                        tick={{ fontSize: 10 }}
                        width={56}
                      />
                      <RechartsTooltip content={<QTooltip />} />
                      <Legend />
                      <Bar
                        dataKey="salarioBruto"
                        name="Salario bruto"
                        fill="#1976D2"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey="totalDescuentos"
                        name="Total descuentos"
                        fill="#C62828"
                        radius={[3, 3, 0, 0]}
                      />
                      <Bar
                        dataKey="salarioLiquido"
                        name="Salario liquido"
                        fill="#388E3C"
                        radius={[3, 3, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                    <Typography color="text.secondary" variant="body2">Sin datos por departamento</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* ── Employee table ────────────────────────────────────────────── */}
          <Paper variant="outlined">
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Detalle de descuentos por empleado
              </Typography>
              <Chip
                label={`${data.empleados.length} empleados`}
                size="small"
                sx={{ bgcolor: 'grey.100' }}
              />
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    <TableCell><strong>Empleado</strong></TableCell>
                    <TableCell><strong>Departamento</strong></TableCell>
                    <TableCell align="right"><strong>Salario bruto</strong></TableCell>
                    <TableCell align="right"><strong>IGSS Laboral</strong></TableCell>
                    <TableCell align="right"><strong>ISR retenido</strong></TableCell>
                    <TableCell align="right"><strong>Cuota prestamo</strong></TableCell>
                    <TableCell align="right"><strong>Otros</strong></TableCell>
                    <TableCell align="right"><strong>Total desc.</strong></TableCell>
                    <TableCell align="right"><strong>Sal. liquido</strong></TableCell>
                    <TableCell align="center" sx={{ minWidth: 100 }}><strong>% Desc.</strong></TableCell>
                    <TableCell align="center"><strong>Estado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.empleados.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No hay registros con los filtros seleccionados
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
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {fmtQ(emp.SALARIO_BRUTO)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="#F57C00" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {emp.IGSS_LABORAL > 0 ? fmtQ(emp.IGSS_LABORAL) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="#1976D2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {emp.ISR_RETENIDO > 0 ? fmtQ(emp.ISR_RETENIDO) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="#7B1FA2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {emp.CUOTA_PRESTAMO > 0 ? fmtQ(emp.CUOTA_PRESTAMO) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {emp.OTROS_DESCUENTOS > 0 ? fmtQ(emp.OTROS_DESCUENTOS) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: 'error.main' }}>
                          {fmtQ(emp.TOTAL_DESCUENTOS)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: '#388E3C' }}>
                          {fmtQ(emp.SALARIO_LIQUIDO)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center" sx={{ minWidth: 100 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(emp.PCT_DESCUENTO, 100)}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: '#E0E0E0',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: emp.PCT_DESCUENTO > 55
                                  ? '#C62828'
                                  : emp.PCT_DESCUENTO > 35
                                  ? '#F57C00'
                                  : '#388E3C',
                              },
                            }}
                          />
                          <Typography variant="caption" sx={{ minWidth: 32 }}>
                            {emp.PCT_DESCUENTO}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={emp.ESTADO}
                          color={estadoColor(emp.ESTADO)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Summary footer */}
            {data.empleados.length > 0 && (
              <>
                <Divider />
                <Box sx={{ p: 1.5, bgcolor: 'grey.50', display: 'flex', gap: 4, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <Typography variant="caption" color="text.secondary">
                    Total descuentos: <strong style={{ color: '#C62828' }}>{fmtQ(data.resumen.totalDescuentosMes)}</strong>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Salario liquido total: <strong style={{ color: '#388E3C' }}>{fmtQ(data.resumen.salarioLiquidoTotal)}</strong>
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
