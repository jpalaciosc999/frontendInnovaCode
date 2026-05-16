import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  TextField,
  Typography,
} from '@mui/material';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonIcon from '@mui/icons-material/Person';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  Legend,
  ReferenceLine,
} from 'recharts';

import {
  getReporteHorasExtra,
  descargarPdfHorasExtra,
} from '../services/reporte_horas_extra.service';
import { obtenerDepartamentos } from '../services/departamentos.service';
import { getApiErrorMessage } from '../api/errors';

import type {
  HorasExtraResponse,
  HorasExtraParams,
} from '../interfaces/reporteHorasExtra';
import type { Departamento } from '../interfaces/departamentos';

// ── date helpers ──────────────────────────────────────────────────────────────

const hoy = new Date();
const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  .toISOString()
  .slice(0, 10);
const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  .toISOString()
  .slice(0, 10);

// ── styling helpers ───────────────────────────────────────────────────────────

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

function fmtQ(v: number): string {
  return `Q ${v.toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── KPI card sub-component ────────────────────────────────────────────────────

interface KpiCardProps {
  icon: ReactNode;
  iconColor: string;
  label: string;
  value: string | number;
  sub: string;
  valueColor?: string;
}

function KpiCard({ icon, iconColor, label, value, sub, valueColor }: KpiCardProps) {
  return (
    <Paper sx={{ p: 2.5, height: '100%' }} elevation={1}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Box sx={{ color: iconColor, display: 'flex' }}>{icon}</Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
      <Typography
        variant="h4"
        sx={{ fontWeight: 700, color: valueColor ?? 'text.primary', mb: 0.5 }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {sub}
      </Typography>
    </Paper>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export default function ReporteHorasExtra() {
  const [fechaInicio, setFechaInicio] = useState(primerDia);
  const [fechaFin, setFechaFin] = useState(ultimoDia);
  const [departamentoId, setDepartamentoId] = useState('');

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [data, setData] = useState<HorasExtraResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    obtenerDepartamentos()
      .then(setDepartamentos)
      .catch(() => {});
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: HorasExtraParams = {
        fechaInicio,
        fechaFin,
        ...(departamentoId ? { departamentoId: Number(departamentoId) } : {}),
      };
      const result = await getReporteHorasExtra(params);
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar el reporte de horas extra'));
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, departamentoId]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handlePdf = async () => {
    setPdfLoading(true);
    try {
      await descargarPdfHorasExtra({
        fechaInicio,
        fechaFin,
        ...(departamentoId ? { departamentoId: Number(departamentoId) } : {}),
      });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <MoreTimeIcon color="primary" />
            Reporte de Horas Extra
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Control de horas adicionales para nómina
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          startIcon={<PictureAsPdfIcon />}
          onClick={handlePdf}
          disabled={pdfLoading || !data}
        >
          Descargar PDF
        </Button>
      </Box>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <Paper
        sx={{ p: 2, mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}
        elevation={1}
      >
        <TextField
          label="Fecha Inicio"
          type="date"
          size="small"
          value={fechaInicio}
          onChange={(e) => setFechaInicio(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Fecha Fin"
          type="date"
          size="small"
          value={fechaFin}
          onChange={(e) => setFechaFin(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Departamento</InputLabel>
          <Select
            value={departamentoId}
            label="Departamento"
            onChange={(e) => setDepartamentoId(e.target.value)}
          >
            <MenuItem value="">Todos</MenuItem>
            {departamentos.map((d) => (
              <MenuItem key={d.DEP_ID} value={String(d.DEP_ID)}>
                {d.DEP_NOMBRE}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* ── Error / Loading ────────────────────────────────────────────────── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && data && (
        <>
          {/* ── KPI Cards ─────────────────────────────────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                icon={<MoreTimeIcon />}
                iconColor="#5C6BC0"
                label="Total Horas Extra"
                value={data.resumen.totalHoras}
                sub="En el período"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                icon={<AttachMoneyIcon />}
                iconColor="#388E3C"
                label="Costo Total"
                value={fmtQ(data.resumen.costoTotal)}
                sub="Al 150% del valor hora"
                valueColor="#388E3C"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                icon={<PersonIcon />}
                iconColor="#F57C00"
                label="Prom. por Empleado"
                value={data.resumen.promedioPorEmpleado}
                sub="Horas en el período"
                valueColor="#F57C00"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <KpiCard
                icon={<WarningAmberIcon />}
                iconColor="#C62828"
                label="Empleados >20 Hrs"
                value={data.resumen.empleadosAlerta}
                sub="Requieren atención"
                valueColor={data.resumen.empleadosAlerta > 0 ? '#C62828' : undefined}
              />
            </Grid>
          </Grid>

          {/* ── Row 1: Día de semana + Departamento ───────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }} elevation={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Horas Extra por Día de la Semana
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data.porDia} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dia" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      formatter={(value) => [`${value} hrs`, 'Horas Extra']}
                    />
                    <Bar dataKey="horas" fill="#5C6BC0" radius={[4, 4, 0, 0]} maxBarSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2 }} elevation={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Horas Extra por Departamento
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={data.porDepartamento}
                    margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="departamento" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} />
                    <RechartsTooltip
                      formatter={(value) => [`${value} hrs`, 'Horas Extra']}
                    />
                    <Bar dataKey="horas" radius={[4, 4, 0, 0]} maxBarSize={60}>
                      {data.porDepartamento.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>
          </Grid>

          {/* ── Row 2: Por Empleado + Avance ──────────────────────────────── */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Horizontal bar: top employees */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 2 }} elevation={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Horas Extra por Empleado
                </Typography>
                {data.porEmpleado.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    Sin datos
                  </Typography>
                ) : (
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(220, data.porEmpleado.length * 38)}
                  >
                    <BarChart
                      layout="vertical"
                      data={data.porEmpleado}
                      margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" unit=" hrs" axisLine={false} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="empleado"
                        width={140}
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <RechartsTooltip
                        formatter={(value, name) => [
                          `${value} hrs`,
                          String(name),
                        ]}
                      />
                      <ReferenceLine x={20} stroke="#C62828" strokeDasharray="4 4" label={{ value: 'Límite 20h', position: 'top', fontSize: 11, fill: '#C62828' }} />
                      <Bar dataKey="horas" radius={[0, 4, 4, 0]} maxBarSize={24}>
                        {data.porEmpleado.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.horas > 20 ? '#C62828' : '#5C6BC0'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>

            {/* Line chart: avance acumulado */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 2 }} elevation={1}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Avance de Horas Extra
                </Typography>
                {data.avance.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                    Sin datos en el período
                  </Typography>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                      data={data.avance}
                      margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11 }}
                        interval="preserveStartEnd"
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <RechartsTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="horas"
                        stroke="#5C6BC0"
                        dot={false}
                        name="Horas del día"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="acumulado"
                        stroke="#388E3C"
                        dot={false}
                        name="Acumulado"
                        strokeDasharray="5 5"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </Paper>
            </Grid>
          </Grid>

          {/* ── Table ─────────────────────────────────────────────────────── */}
          <Paper sx={{ p: 2 }} elevation={1}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Detalle por Empleado
              </Typography>
              <Chip
                label={`${data.filas.length} empleados`}
                size="small"
                variant="outlined"
              />
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ '& th': { fontWeight: 700, whiteSpace: 'nowrap' } }}>
                    <TableCell>EMPLEADO</TableCell>
                    <TableCell>DEPARTAMENTO</TableCell>
                    <TableCell align="right">SALARIO HORA NORMAL</TableCell>
                    <TableCell align="right">HORAS EXTRA</TableCell>
                    <TableCell align="right">VALOR X HORA EXTRA</TableCell>
                    <TableCell align="right">TOTAL A PAGAR</TableCell>
                    <TableCell align="center">ALERTA</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.filas.map((fila) => (
                    <TableRow key={fila.EMP_ID} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              fontSize: 13,
                              bgcolor: hashColor(fila.EMPLEADO),
                            }}
                          >
                            {fila.INICIALES}
                          </Avatar>
                          {fila.EMPLEADO}
                        </Box>
                      </TableCell>
                      <TableCell>{fila.DEPARTAMENTO}</TableCell>
                      <TableCell align="right">{fmtQ(fila.SALARIO_HORA)}</TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 700 }}>
                          {fila.HORAS_EXTRA.toFixed(1)} hrs
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{fmtQ(fila.VALOR_HORA_EXTRA)}</TableCell>
                      <TableCell align="right">
                        <Typography sx={{ fontWeight: 700, color: '#388E3C' }}>
                          {fmtQ(fila.TOTAL_A_PAGAR)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {fila.ALERTA && (
                          <Chip
                            label="> 20 hrs"
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.filas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography color="text.secondary" sx={{ py: 3 }}>
                          No hay registros de horas extra en el período seleccionado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {data.filas.length > 0 && (
              <Box
                sx={{
                  mt: 1.5,
                  pt: 1.5,
                  borderTop: '2px solid',
                  borderColor: 'divider',
                  display: 'flex',
                  gap: 4,
                  px: 1,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Total: {data.resumen.totalHoras.toFixed(1)} hrs
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#388E3C' }}>
                  Costo total: {fmtQ(data.resumen.costoTotal)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {data.resumen.empleadosAlerta} empleado
                  {data.resumen.empleadosAlerta !== 1 ? 's' : ''} sobre el límite de 20 hrs
                </Typography>
              </Box>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
}
