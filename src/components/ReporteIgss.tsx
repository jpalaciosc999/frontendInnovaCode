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
import SummarizeIcon from '@mui/icons-material/Summarize';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import {
  getReporteIgss,
  descargarPdfIgss,
  descargarCsvIgss,
  subirReciboIgss,
  registrarNumeroRecibo,
} from '../services/reporte_igss.service';
import { obtenerPeriodos } from '../services/periodo.service';
import { obtenerDepartamentos } from '../services/departamentos.service';
import { getApiErrorMessage } from '../api/errors';

import type { ReporteIgssResponse } from '../interfaces/reporteIgss';
import type { Periodo } from '../interfaces/periodo';
import type { Departamento } from '../interfaces/departamentos';

// ── helpers ───────────────────────────────────────────────────────────────────

const TASA_PATRONAL = 0.1267;
const TASA_LABORAL = 0.0483;

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

function periodoLabel(p: Periodo): string {
  const d = new Date(p.PER_FECHA_INICIO.slice(0, 10) + 'T00:00:00');
  const label = d.toLocaleString('es-GT', { month: 'long', year: 'numeric' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function fmtQ(v: number): string {
  return `Q ${v.toLocaleString('es-GT', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtQDec(v: number): string {
  return `Q ${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtFecha(fecha: string): string {
  if (!fecha) return '—';
  const d = new Date(fecha.slice(0, 10) + 'T00:00:00');
  return d.toLocaleDateString('es-GT');
}

// ── component ─────────────────────────────────────────────────────────────────

export default function ReporteIgss() {
  const [periodoId, setPeriodoId] = useState('');
  const [departamentoId, setDepartamentoId] = useState('');
  const [estado, setEstado] = useState('');

  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  const [reporte, setReporte] = useState<ReporteIgssResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([obtenerPeriodos(), obtenerDepartamentos()])
      .then(([pers, deps]) => {
        setPeriodos(pers);
        setDepartamentos(deps);
      })
      .catch(() => {});
  }, []);

  const cargarReporte = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const data = await getReporteIgss({
        ...(periodoId ? { periodoId: Number(periodoId) } : {}),
        ...(departamentoId ? { departamentoId: Number(departamentoId) } : {}),
        ...(estado ? { estado } : {}),
      });
      setReporte(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Error al cargar el reporte de IGSS'));
    } finally {
      setCargando(false);
    }
  }, [periodoId, departamentoId, estado]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const periodoSeleccionado = periodos.find((p) => String(p.PER_ID) === periodoId);
  const resumen = reporte?.resumen;
  const empleados = reporte?.empleados ?? [];
  const porDepartamento = reporte?.porDepartamento ?? [];

  const subtitulo = periodoSeleccionado
    ? `Cuotas patronal ${(TASA_PATRONAL * 100).toFixed(2)}% y laboral ${(TASA_LABORAL * 100).toFixed(2)}% · ${periodoLabel(periodoSeleccionado)}`
    : `Cuotas patronal ${(TASA_PATRONAL * 100).toFixed(2)}% y laboral ${(TASA_LABORAL * 100).toFixed(2)}%`;

  const pdfParams = {
    ...(periodoId ? { periodoId: Number(periodoId) } : {}),
    ...(departamentoId ? { departamentoId: Number(departamentoId) } : {}),
    ...(estado ? { estado } : {}),
  };

  const [reciboMode, setReciboMode] = useState('');
  const [manualRecibo, setManualRecibo] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [guardandoNumero, setGuardandoNumero] = useState(false);

  return (
    <Box>
      {/* ── Header ── */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <SummarizeIcon sx={{ color: 'primary.main', fontSize: 34 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Reporte IGSS
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitulo}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            size="small"
            onClick={() => descargarPdfIgss(pdfParams)}
          >
            Descargar PDF
          </Button>

          <Button
            variant="outlined"
            size="small"
            onClick={() => descargarCsvIgss(pdfParams)}
          >
            Descargar CSV
          </Button>

          <Button
            variant="contained"
            size="small"
            onClick={() => {
              const input = document.getElementById('igss-recibo-file') as HTMLInputElement | null;
              input?.click();
            }}
          >
            Adjuntar factura de pago
          </Button>
        </Box>
      </Box>

      {/* ── Filtros ── */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Período</InputLabel>
              <Select
                label="Período"
                value={periodoId}
                onChange={(e: SelectChangeEvent) => setPeriodoId(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {periodos.map((p) => (
                  <MenuItem key={p.PER_ID} value={String(p.PER_ID)}>
                    {periodoLabel(p)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Departamento</InputLabel>
              <Select
                label="Departamento"
                value={departamentoId}
                onChange={(e: SelectChangeEvent) => setDepartamentoId(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {departamentos.map((dep) => (
                  <MenuItem key={dep.DEP_ID} value={String(dep.DEP_ID)}>
                    {dep.DEP_NOMBRE}
                  </MenuItem>
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
                onChange={(e: SelectChangeEvent) => setEstado(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="Pendiente">Pendiente</MenuItem>
                <MenuItem value="Pagado">Pagado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <input
        id="igss-recibo-file"
        type="file"
        accept="application/pdf,image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0] ?? null;
          setSelectedFile(f);
        }}
      />

      {selectedFile && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle2">Archivo seleccionado: {selectedFile.name}</Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
            <Button
              size="small"
              onClick={async () => {
                if (!periodoId) {
                  setError('Selecciona un período antes de subir el recibo');
                  return;
                }
                try {
                  setSubiendo(true);
                  setError('');
                  await subirReciboIgss(Number(periodoId), selectedFile);
                  setSelectedFile(null);
                } catch (err) {
                  setError(getApiErrorMessage(err, 'Error al subir el recibo'));
                } finally {
                  setSubiendo(false);
                }
              }}
            >
              {subiendo ? 'Subiendo...' : 'Subir recibo'}
            </Button>

            <Button size="small" onClick={() => setSelectedFile(null)}>
              Cancelar
            </Button>
          </Box>
        </Paper>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Número de recibo IGSS</InputLabel>
              <Select
                label="Número de recibo IGSS"
                value={reciboMode}
                onChange={(e: SelectChangeEvent) => setReciboMode(e.target.value)}
              >
                <MenuItem value="">Ninguno</MenuItem>
                <MenuItem value="manual">Ingresar manualmente</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {reciboMode === 'manual' && (
            <Grid size={{ xs: 12, sm: 6, md: 8 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <input
                  placeholder="Número de recibo"
                  value={manualRecibo}
                  onChange={(e) => setManualRecibo(e.target.value)}
                  style={{ flex: 1, padding: '8px 10px', borderRadius: 4, border: '1px solid #ccc' }}
                />
                <Button
                  variant="contained"
                  size="small"
                  onClick={async () => {
                    if (!periodoId) {
                      setError('Selecciona un período antes de registrar el número de recibo');
                      return;
                    }
                    try {
                      setGuardandoNumero(true);
                      setError('');
                      await registrarNumeroRecibo(Number(periodoId), manualRecibo);
                    } catch (err) {
                      setError(getApiErrorMessage(err, 'Error al registrar número de recibo'));
                    } finally {
                      setGuardandoNumero(false);
                    }
                  }}
                >
                  {guardandoNumero ? 'Guardando...' : 'Guardar'}
                </Button>
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* ── Error ── */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* ── Loading ── */}
      {cargando && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ── Contenido ── */}
      {!cargando && reporte && (
        <>
          {/* Tarjetas de resumen */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total salarios base
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {fmtQ(resumen?.totalSalariosBase ?? 0)}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  IGSS patronal (12.67%)
                </Typography>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {fmtQ(resumen?.igssPatronal ?? 0)}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  IGSS laboral (4.83%)
                </Typography>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {fmtQ(resumen?.igssLaboral ?? 0)}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total a enterar al IGSS
                </Typography>
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 700, mt: 0.5 }}>
                  {fmtQ(resumen?.totalIgss ?? 0)}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Gráfico + Resumen de obligación */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Gráfico de barras por departamento */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  IGSS por departamento
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Patronal vs laboral este período
                </Typography>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={porDepartamento}
                    margin={{ top: 4, right: 8, left: 0, bottom: 0 }}
                  >
                    <XAxis dataKey="departamento" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `Q ${(v / 1000).toFixed(0)}k` : `Q ${v}`
                      }
                    />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        fmtQDec(Number(value)),
                        name === 'patronal' ? 'Patronal 12.67%' : 'Laboral 4.83%',
                      ]}
                    />
                    <Legend
                      formatter={(value: string) =>
                        value === 'patronal' ? 'Patronal 12.67%' : 'Laboral 4.83%'
                      }
                    />
                    <Bar dataKey="patronal" fill="#1976D2" name="patronal" />
                    <Bar dataKey="laboral" fill="#FF9800" name="laboral" />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Resumen de obligación */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Resumen de obligación
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Detalle de cuotas a pagar
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25 }}>
                  <Typography variant="body2" color="text.secondary">Base imponible</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {fmtQ(resumen?.totalSalariosBase ?? 0)}
                  </Typography>
                </Box>
                <Divider />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.25,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">Patronal 12.67%</Typography>
                    <Chip label="Empresa" size="small" color="success" variant="outlined" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {fmtQ(resumen?.igssPatronal ?? 0)}
                  </Typography>
                </Box>
                <Divider />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.25,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">Laboral 4.83%</Typography>
                    <Chip label="Empleados" size="small" color="info" variant="outlined" />
                  </Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {fmtQ(resumen?.igssLaboral ?? 0)}
                  </Typography>
                </Box>
                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25 }}>
                  <Typography variant="body2" color="text.secondary">Total IGSS</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {fmtQ(resumen?.totalIgss ?? 0)}
                  </Typography>
                </Box>
                <Divider />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1.25 }}>
                  <Typography variant="body2" color="text.secondary">Fecha límite pago</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {fmtFecha(resumen?.fechaLimitePago ?? '')}
                  </Typography>
                </Box>
                <Divider />

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1.25,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">Estado</Typography>
                  <Chip
                    label={resumen?.estado ?? '—'}
                    size="small"
                    color={resumen?.estado === 'Pagado' ? 'success' : 'warning'}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Grafico distribucion de estados IGSS */}
          {(() => {
            const estadoData = [
              { name: 'Pagado',    value: empleados.filter((e) => e.ESTADO === 'Pagado').length,    color: '#388E3C' },
              { name: 'Pendiente', value: empleados.filter((e) => e.ESTADO === 'Pendiente').length, color: '#F57C00' },
            ].filter((d) => d.value > 0);
            const total = estadoData.reduce((s, d) => s + d.value, 0);
            return total > 0 ? (
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Distribucion de empleados por estado IGSS
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Cuotas pagadas vs pendientes en el periodo seleccionado
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
                  <ResponsiveContainer width={260} height={220}>
                    <PieChart>
                      <Pie
                        data={estadoData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={95}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
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

          {/* Tabla de empleados */}
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Empleado</TableCell>
                  <TableCell>DPI</TableCell>
                  <TableCell>Puesto</TableCell>
                  <TableCell align="right">Días trabajados</TableCell>
                  <TableCell align="right">Salario base</TableCell>
                  <TableCell align="right">Patr. 12.67%</TableCell>
                  <TableCell align="right">Laboral 4.83%</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {empleados.map((emp: any) => (
                  <TableRow key={emp.EMP_ID} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: 13,
                            bgcolor: hashColor(emp.EMPLEADO),
                          }}
                        >
                          {emp.INICIALES}
                        </Avatar>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2">{emp.EMPLEADO}</Typography>
                          {emp.SUSPENDIDO && (
                            <Typography variant="caption" color="warning.main">Suspendido</Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{emp.EMP_DPI ?? '—'}</Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">{emp.PUESTO}</Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2">{emp.DIAS_TRABAJADOS ?? '—'}</Typography>
                    </TableCell>

                    <TableCell align="right">
                      <Typography variant="body2">{fmtQDec(emp.SALARIO_BASE)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{fmtQDec(emp.IGSS_PATRONAL)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{fmtQDec(emp.IGSS_LABORAL)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {fmtQDec(emp.TOTAL_IGSS)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={emp.ESTADO}
                        size="small"
                        color={emp.ESTADO === 'Pagado' ? 'success' : 'warning'}
                      />
                    </TableCell>
                  </TableRow>
                ))}

                {empleados.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                        No hay datos para el período seleccionado
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
