import { useEffect, useState, useCallback } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
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
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CancelIcon from '@mui/icons-material/Cancel';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { descargarPdfMarcajes } from '../services/reportes.service';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { getMarcajesReporte } from '../services/reportes.service';
import { obtenerEmpleados } from '../services/empleados.service';
import { obtenerDepartamentos } from '../services/departamentos.service';
import { getApiErrorMessage } from '../api/errors';

import type { ReporteMarcajesResponse } from '../interfaces/reporteMarcajes';
import type { Empleado } from '../interfaces/empleados';
import type { Departamento } from '../interfaces/departamentos';

// ── helpers ──────────────────────────────────────────────────────────────────

const hoy = new Date();
const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  .toISOString()
  .slice(0, 10);
const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)
  .toISOString()
  .slice(0, 10);

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

function estadoBadgeColor(
  estado: string
): 'success' | 'warning' | 'error' | 'default' {
  if (estado === 'Puntual') return 'success';
  if (estado === 'Tardanza') return 'warning';
  if (estado.startsWith('Ausent')) return 'error';
  return 'default';
}

const DISTRIBUCION_COLORS: Record<string, string> = {
  Puntual: '#4caf50',
  Tardanza: '#ff9800',
  Ausencia: '#f44336',
  Ausente: '#f44336',
};

// ── component ─────────────────────────────────────────────────────────────────

export default function ReporteMarcajes() {
  const [fechaInicio, setFechaInicio] = useState(primerDia);
  const [fechaFin, setFechaFin] = useState(ultimoDia);
  const [empleadoId, setEmpleadoId] = useState('');
  const [departamentoId, setDepartamentoId] = useState('');

  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);

  const [reporte, setReporte] = useState<ReporteMarcajesResponse | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Cargar dropdowns una sola vez
  useEffect(() => {
    Promise.all([obtenerEmpleados(), obtenerDepartamentos()])
      .then(([emps, deps]) => {
        setEmpleados(emps);
        setDepartamentos(deps);
      })
      .catch(() => {
        // no crítico: los dropdowns quedan vacíos
      });
  }, []);

  const cargarReporte = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const data = await getMarcajesReporte({
        fechaInicio,
        fechaFin,
        ...(empleadoId ? { empleadoId: Number(empleadoId) } : {}),
        ...(departamentoId ? { departamentoId: Number(departamentoId) } : {}),
      });
      setReporte(data);
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Error al cargar el reporte de marcajes')
      );
    } finally {
      setCargando(false);
    }
  }, [fechaInicio, fechaFin, empleadoId, departamentoId]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const resumen = reporte?.resumen;
  const marcajes = reporte?.marcajes ?? [];
  const asistenciaPorDia = reporte?.asistenciaPorDia ?? [];
  const distribucion = reporte?.distribucion ?? [];

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
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Reporte de marcajes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Control de asistencia y puntualidad por empleado
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PictureAsPdfIcon />}
            size="small"
            onClick={() =>
              descargarPdfMarcajes({
                fechaInicio,
                fechaFin,
                ...(empleadoId ? { empleadoId: Number(empleadoId) } : {}),
                ...(departamentoId ? { departamentoId: Number(departamentoId) } : {}),
              })
            }
          >
            PDF
          </Button>
        </Box>
      </Box>

      {/* ── Filtros ── */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Empleado</InputLabel>
              <Select
                label="Empleado"
                value={empleadoId}
                onChange={(e: SelectChangeEvent) => setEmpleadoId(e.target.value)}
              >
                <MenuItem value="">Todos los empleados</MenuItem>
                {empleados.map((emp) => (
                  <MenuItem key={emp.EMP_ID} value={String(emp.EMP_ID)}>
                    {emp.EMP_NOMBRE} {emp.EMP_APELLIDO}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Departamento</InputLabel>
              <Select
                label="Departamento"
                value={departamentoId}
                onChange={(e: SelectChangeEvent) =>
                  setDepartamentoId(e.target.value)
                }
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

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Fecha inicio"
              type="date"
              size="small"
              fullWidth
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Fecha fin"
              type="date"
              size="small"
              fullWidth
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <GroupIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    Total empleados
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>
                  {resumen?.totalEmpleados ?? 0}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <AccessTimeIcon fontSize="small" sx={{ color: 'success.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Puntual
                  </Typography>
                </Box>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
                  {resumen?.puntual ?? 0}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <WarningAmberIcon fontSize="small" sx={{ color: 'warning.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Tardanzas
                  </Typography>
                </Box>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 700 }}>
                  {resumen?.tardanza ?? 0}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CancelIcon fontSize="small" sx={{ color: 'error.main' }} />
                  <Typography variant="body2" color="text.secondary">
                    Ausencias
                  </Typography>
                </Box>
                <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
                  {resumen?.ausencias ?? 0}
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Gráficos */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {/* Barras */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2, height: 300 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Asistencia por día
                </Typography>
                <ResponsiveContainer width="100%" height="85%">
                  <BarChart data={asistenciaPorDia}>
                    <XAxis dataKey="dia" />
                    <YAxis />
                    <RechartsTooltip />
                    <Bar dataKey="total" fill="#1976D2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Paper>
            </Grid>

            {/* Dona */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 2, height: 300 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Distribución de estado
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', height: '85%' }}>
                  <ResponsiveContainer width="55%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribucion}
                        dataKey="total"
                        nameKey="estado"
                        innerRadius="50%"
                        outerRadius="75%"
                      >
                        {distribucion.map((entry) => (
                          <Cell
                            key={entry.estado}
                            fill={DISTRIBUCION_COLORS[entry.estado] ?? '#9e9e9e'}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>

                  <Box sx={{ flex: 1, pl: 1 }}>
                    {distribucion.map((entry) => (
                      <Box
                        key={entry.estado}
                        sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor:
                              DISTRIBUCION_COLORS[entry.estado] ?? '#9e9e9e',
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2">
                          {entry.estado} {entry.porcentaje}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Tabla */}
          <Paper>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Entrada</TableCell>
                    <TableCell>Salida</TableCell>
                    <TableCell>Horas trabajadas</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {marcajes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          Sin registros para el período seleccionado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    marcajes.map((m) => (
                      <TableRow key={m.MAR_ID} hover>
                        <TableCell>
                          <Box
                            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                          >
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                fontSize: 13,
                                bgcolor: hashColor(m.EMPLEADO),
                              }}
                            >
                              {m.INICIALES}
                            </Avatar>
                            <Typography variant="body2">{m.EMPLEADO}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{m.FECHA}</TableCell>
                        <TableCell>{m.ENTRADA}</TableCell>
                        <TableCell>{m.SALIDA}</TableCell>
                        <TableCell>{m.HORAS_TRABAJADAS}</TableCell>
                        <TableCell>
                          <Chip
                            label={m.ESTADO}
                            size="small"
                            color={estadoBadgeColor(m.ESTADO)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Box>
  );
}
