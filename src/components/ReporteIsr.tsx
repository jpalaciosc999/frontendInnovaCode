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
  Tooltip,
  Typography,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SummarizeIcon from '@mui/icons-material/Summarize';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import {
  getReporteIsr,
  getReporteIsrProyeccion,
  descargarPdfIsr,
  descargarPdfIsrProyeccion,
} from '../services/reporte_isr.service';
import { obtenerDepartamentos } from '../services/departamentos.service';
import { obtenerPeriodos } from '../services/periodo.service';
import { getApiErrorMessage } from '../api/errors';

import type {
  ReporteIsrResponse,
  ReporteIsrProyeccionResponse,
} from '../interfaces/reporteIsr';
import type { Departamento } from '../interfaces/departamentos';
import type { Periodo } from '../interfaces/periodo';

// â”€â”€ helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const ANOS_DISPONIBLES = Array.from({ length: 4 }, (_, i) => new Date().getFullYear() - i);

const AVATAR_COLORS = [
  '#1976D2', '#388E3C', '#F57C00', '#7B1FA2',
  '#C62828', '#0097A7', '#558B2F', '#E91E63',
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

function estadoColor(estado: string): 'success' | 'warning' | 'default' {
  if (estado === 'Al día') return 'success';
  if (estado === 'Diferencia') return 'warning';
  return 'default';
}

// â”€â”€ component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ReporteIsr() {
  const [anioFiscal, setAnioFiscal] = useState(new Date().getFullYear());
  const [departamentoId, setDepartamentoId] = useState('');
  const [periodoId, setPeriodoId] = useState('');
  const [tipoRenta, setTipoRenta] = useState('Relacion de dependencia');
  const [estado, setEstado] = useState('');

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [reporte, setReporte] = useState<ReporteIsrResponse | null>(null);
  const [proyeccion, setProyeccion] = useState<ReporteIsrProyeccionResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [cargandoProyeccion, setCargandoProyeccion] = useState(false);
  const [error, setError] = useState('');
  const [errorProyeccion, setErrorProyeccion] = useState('');

  useEffect(() => {
    obtenerDepartamentos().then(setDepartamentos).catch(() => {});
    obtenerPeriodos().then(setPeriodos).catch(() => {});
  }, []);

  const cargarProyeccion = useCallback(async () => {
    if (!periodoId) {
      setProyeccion(null);
      setErrorProyeccion('');
      return;
    }

    try {
      setCargandoProyeccion(true);
      setErrorProyeccion('');
      const data = await getReporteIsrProyeccion({ periodoId: Number(periodoId) });
      setProyeccion(data);
    } catch (err) {
      setErrorProyeccion(getApiErrorMessage(err, 'Error al cargar la proyección ISR'));
      setProyeccion(null);
    } finally {
      setCargandoProyeccion(false);
    }
  }, [periodoId]);

  useEffect(() => { cargarProyeccion(); }, [cargarProyeccion]);

  const cargarReporte = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const data = await getReporteIsr({
        anioFiscal,
        ...(departamentoId ? { departamentoId: Number(departamentoId) } : {}),
        tipoRenta,
        ...(estado ? { estado } : {}),
      });
      setReporte(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar el reporte de ISR'));
    } finally {
      setCargando(false);
    }
  }, [anioFiscal, departamentoId, tipoRenta, estado]);

  useEffect(() => { cargarReporte(); }, [cargarReporte]);

  const resumen  = reporte?.resumen;
  const empleados = reporte?.empleados ?? [];
  const mensual   = reporte?.mensual ?? [];

  const pdfParams = {
    anioFiscal,
    ...(departamentoId ? { departamentoId: Number(departamentoId) } : {}),
    tipoRenta,
    ...(estado ? { estado } : {}),
  };

  return (
    <Box>
      {/* â”€â”€ Header â”€â”€ */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SummarizeIcon sx={{ color: 'primary.main', fontSize: 34 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>Reporte ISR Anual</Typography>
            <Typography variant="body2" color="text.secondary">
              Retenciones acumuladas · Decreto 10-2012 SAT · Periodo fiscal {anioFiscal}
            </Typography>
          </Box>
        </Box>
        <Button variant="outlined" startIcon={<PictureAsPdfIcon />} size="small"
          onClick={() => descargarPdfIsr(pdfParams)}>
          Descargar PDF
        </Button>
      </Box>

      {/* â”€â”€ Filtros â”€â”€ */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Año fiscal</InputLabel>
              <Select label="Año fiscal" value={String(anioFiscal)}
                onChange={(e: SelectChangeEvent) => setAnioFiscal(Number(e.target.value))}>
                {ANOS_DISPONIBLES.map((a) => (
                  <MenuItem key={a} value={String(a)}>{a}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Departamento</InputLabel>
              <Select label="Departamento" value={departamentoId}
                onChange={(e: SelectChangeEvent) => setDepartamentoId(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {departamentos.map((d) => (
                  <MenuItem key={d.DEP_ID} value={String(d.DEP_ID)}>{d.DEP_NOMBRE}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Periodo</InputLabel>
              <Select label="Periodo" value={periodoId}
                onChange={(e: SelectChangeEvent) => setPeriodoId(e.target.value)}>
                <MenuItem value="">Seleccione un periodo</MenuItem>
                {periodos.map((periodo) => (
                  <MenuItem key={periodo.PER_ID} value={String(periodo.PER_ID)}>
                    {`${periodo.PER_FECHA_INICIO} al ${periodo.PER_FECHA_FIN} (${periodo.PER_ESTADO})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de renta</InputLabel>
              <Select label="Tipo de renta" value={tipoRenta}
                onChange={(e: SelectChangeEvent) => setTipoRenta(e.target.value)}>
                <MenuItem value="Relacion de dependencia">Relacion de dependencia</MenuItem>
                <MenuItem value="Actividades lucrativas">Actividades lucrativas</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select label="Estado" value={estado}
                onChange={(e: SelectChangeEvent) => setEstado(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Al día">Al dia</MenuItem>
                <MenuItem value="Diferencia">Diferencia</MenuItem>
                <MenuItem value="No afecto">No afecto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {cargando && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {!cargando && reporte && (
        <>
          {/* â”€â”€ KPI cards â”€â”€ */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">Total renta imponible</Typography>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {fmtQ(resumen?.totalRentaImponible ?? 0)}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">ISR retenido acumulado</Typography>
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {fmtQ(resumen?.totalIsrRetenido ?? 0)}
                </Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">Empleados afectos</Typography>
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {resumen?.empleadosAfectos ?? 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">Superan el minimo exento</Typography>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">Empleados no afectos</Typography>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {resumen?.empleadosNoAfectos ?? 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">No alcanzan el umbral</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Proyección anual por empleado</Typography>
                <Typography variant="body2" color="text.secondary">
                  Renta acumulada y retención proyectada para el periodo seleccionado.
                </Typography>
              </Box>
              <Button
                variant="outlined"
                startIcon={<PictureAsPdfIcon />}
                size="small"
                disabled={!periodoId || cargandoProyeccion || !proyeccion?.empleados?.length}
                onClick={() => periodoId && descargarPdfIsrProyeccion({ periodoId: Number(periodoId) })}
              >
                Descargar constancia ISR
              </Button>
            </Box>

            {errorProyeccion && <Alert severity="error" sx={{ mb: 2 }}>{errorProyeccion}</Alert>}

            {!periodoId ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Seleccione un periodo para ver la proyección anual ISR por empleado.
              </Alert>
            ) : cargandoProyeccion ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : proyeccion?.empleados?.length ? (
              <>
                {proyeccion.resumen ? (
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">Empleados</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{proyeccion.resumen.totalEmpleados}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">Renta acumulada</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{fmtQDec(proyeccion.resumen.totalRentaAcumulada)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">ISR proyectado año</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{fmtQDec(proyeccion.resumen.totalIsrProyectado)}</Typography>
                      </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                      <Paper sx={{ p: 2 }}>
                        <Typography variant="body2" color="text.secondary">ISR pendiente</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>{fmtQDec(proyeccion.resumen.totalIsrPendiente)}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                ) : null}

                <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 900 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Empleado</TableCell>
                        <TableCell align="right">Renta acumulada</TableCell>
                        <TableCell align="right">Renta proyectada anual</TableCell>
                        <TableCell align="right">ISR proyectado año</TableCell>
                        <TableCell align="right">ISR retenido a la fecha</TableCell>
                        <TableCell align="right">ISR pendiente</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {proyeccion.empleados.map((fila) => (
                        <TableRow key={fila.EMP_ID} hover>
                          <TableCell>{fila.EMPLEADO}</TableCell>
                          <TableCell align="right">{fmtQDec(fila.RENTA_ACUMULADA)}</TableCell>
                          <TableCell align="right">{fmtQDec(fila.RENTA_PROYECTADA_ANUAL)}</TableCell>
                          <TableCell align="right">{fmtQDec(fila.ISR_PROYECTADO_ANIO)}</TableCell>
                          <TableCell align="right">{fmtQDec(fila.ISR_RETENIDO_A_LA_FECHA)}</TableCell>
                          <TableCell align="right">{fmtQDec(fila.ISR_PENDIENTE)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <Alert severity="warning">No hay datos de proyección para el periodo seleccionado.</Alert>
            )}
          </Paper>

          {/* â”€â”€ GrÃ¡fico mensual + Panel legal â”€â”€ */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* GrÃ¡fico barras + lÃ­nea */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  ISR retenido por mes · {anioFiscal}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Retencion mensual (barras) e ISR acumulado (linea)
                </Typography>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={mensual} margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `Q${(v / 1000).toFixed(0)}k` : `Q${v}`
                      }
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `Q${(v / 1000).toFixed(0)}k` : `Q${v}`
                      }
                    />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        fmtQDec(Number(value)),
                        name === 'isr_mensual' ? 'ISR mensual retenido' : 'Acumulado',
                      ]}
                    />
                    <Legend
                      formatter={(value: string) =>
                        value === 'isr_mensual' ? 'ISR mensual retenido' : 'Acumulado'
                      }
                    />
                    <Bar yAxisId="left" dataKey="isr_mensual" fill="#1976D2" name="isr_mensual" radius={[3,3,0,0]} />
                    <Line yAxisId="right" type="monotone" dataKey="isr_acumulado"
                      stroke="#E91E63" name="isr_acumulado" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Panel legal Tramos ISR */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <InfoOutlinedIcon fontSize="small" color="primary" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Tramos ISR Guatemala {anioFiscal}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Regimen opcional simplificado · Decreto 10-2012
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25 }}>
                  <Typography variant="body2" color="text.secondary">Hasta Q 300,000</Typography>
                  <Chip label="5%" size="small" color="info" />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25 }}>
                  <Typography variant="body2" color="text.secondary">Excedente Q 300,000</Typography>
                  <Chip label="7%" size="small" color="warning" />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25 }}>
                  <Typography variant="body2" color="text.secondary">Minimo vital exento</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Q 48,000</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25 }}>
                  <Typography variant="body2" color="text.secondary">Credito IVA facturas</Typography>
                  <Chip label="Deducible" size="small" color="success" variant="outlined" />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25 }}>
                  <Typography variant="body2" color="text.secondary">IGSS laboral (4.83%)</Typography>
                  <Chip label="Deducible" size="small" color="success" variant="outlined" />
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25 }}>
                  <Typography variant="body2" color="text.secondary">Fecha declaracion SAT</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Marzo {anioFiscal + 1}</Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25 }}>
                  <Typography variant="body2" color="text.secondary">Periodo fiscal</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    01/01/{anioFiscal} - 31/12/{anioFiscal}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* -- Grafico distribucion de estados -- */}
          {(() => {
            const estadoData = [
              { name: 'Al dia', value: empleados.filter((e) => e.ESTADO === 'Al día').length, color: '#388E3C' },
              { name: 'Diferencia', value: empleados.filter((e) => e.ESTADO === 'Diferencia').length, color: '#F57C00' },
              { name: 'No afecto', value: empleados.filter((e) => e.ESTADO === 'No afecto').length, color: '#9E9E9E' },
            ].filter((d) => d.value > 0);
            const total = estadoData.reduce((s, d) => s + d.value, 0);
            return total > 0 ? (
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Distribucion de empleados por estado ISR
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Clasificacion segun situacion fiscal en {anioFiscal}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width={300} height={250}>
                    <PieChart>
                      <Pie
                        data={estadoData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(((percent ?? 0) * 100).toFixed(0))}%`}
                        labelLine={false}
                      >
                        {estadoData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => [`${value} empleado(s)`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {estadoData.map((d) => (
                      <Box key={d.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: d.color, flexShrink: 0 }} />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{d.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {d.value} empleado(s) · {((d.value / total) * 100).toFixed(1)}%
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Paper>
            ) : null;
          })()}

          {/* -- Tabla detalle por empleado -- */}
          <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell align="center">Meses</TableCell>
                  <TableCell align="right">Renta anual</TableCell>
                  <TableCell align="right">
                    <Tooltip title="IGSS laboral + Credito IVA + Minimo vital" arrow>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, cursor: 'help' }}>
                        Deducciones <InfoOutlinedIcon sx={{ fontSize: 14 }} />
                      </Box>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">Renta imponible</TableCell>
                  <TableCell align="center">Tasa</TableCell>
                  <TableCell align="right">ISR calculado</TableCell>
                  <TableCell align="right">ISR retenido</TableCell>
                  <TableCell align="right">Diferencia</TableCell>
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
                          <Typography variant="caption" color="text.secondary">
                            NIT: {emp.NIT} · {emp.DEPARTAMENTO}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{emp.MESES_LABORADOS}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{fmtQDec(emp.RENTA_ANUAL)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip
                        arrow
                        title={
                          <Box>
                            <Typography variant="caption" sx={{ display: 'block' }}>IGSS laboral: {fmtQDec(emp.IGSS_LABORAL)}</Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>Crédito IVA: {fmtQDec(emp.CREDITO_IVA)}</Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>Mínimo vital: {fmtQDec(emp.MINIMO_VITAL)}</Typography>
                          </Box>
                        }
                      >
                        <Typography variant="body2" sx={{ cursor: 'help', textDecoration: 'underline dotted', color: 'text.secondary' }}>
                          {fmtQDec(emp.TOTAL_DEDUCCIONES)}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{fmtQDec(emp.RENTA_IMPONIBLE)}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={emp.TASA}
                        size="small"
                        color={emp.TASA === 'No afecto' ? 'default' : emp.TASA === '5%' ? 'info' : 'warning'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {fmtQDec(emp.ISR_CALCULADO)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{fmtQDec(emp.ISR_RETENIDO)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography
                        variant="body2"
                        sx={{ color: emp.DIFERENCIA !== 0 ? 'warning.main' : 'text.primary', fontWeight: emp.DIFERENCIA !== 0 ? 600 : 400 }}
                      >
                        {fmtQDec(emp.DIFERENCIA)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={emp.ESTADO} size="small" color={estadoColor(emp.ESTADO)} />
                    </TableCell>
                  </TableRow>
                ))}

                {empleados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center">
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
    </Box>
  );
}
