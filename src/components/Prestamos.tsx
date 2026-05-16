import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';
import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

import type { Prestamo, PrestamoForm } from '../interfaces/prestamos';
import type { Empleado } from '../interfaces/empleados';
import {
  obtenerPrestamos,
  crearPrestamo,
  actualizarPrestamo,
  eliminarPrestamo
} from '../services/prestamos.service';
import { obtenerEmpleados } from '../services/empleados.service';
import { getApiErrorMessage } from '../api/errors';
import { formatearFecha, formatearMoneda, obtenerNombreEmpleado } from '../utils/relations';

const initialForm: PrestamoForm = {
  emp_id: '',
  pre_monto_total: '',
  pre_interes: '0',
  pre_plazo: '',
  pre_cuota_mensual: '',
  pre_saldo_pendiente: '',
  pre_fecha_inicio: '',
  pre_estado: 'A',
};

const numero = (valor: number | string | undefined) => Number(valor || 0);
const normalizarLista = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  const record = value as { value?: unknown };
  return Array.isArray(record?.value) ? record.value as T[] : [];
};

function PrestamoCRUD() {
  const [datos, setDatos] = useState<Prestamo[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<PrestamoForm>(initialForm);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const [prestamosResult, empleadosResult] = await Promise.allSettled([
        obtenerPrestamos(),
        obtenerEmpleados()
      ]);

      if (prestamosResult.status === 'fulfilled') {
        setDatos(normalizarLista<Prestamo>(prestamosResult.value));
      } else {
        setDatos([]);
        setError(getApiErrorMessage(prestamosResult.reason, 'Error cargando prestamos'));
      }

      if (empleadosResult.status === 'fulfilled') {
        setEmpleados(normalizarLista<Empleado>(empleadosResult.value));
      } else {
        setEmpleados([]);
        setError(getApiErrorMessage(empleadosResult.reason, 'Error cargando empleados'));
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error cargando prestamos'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const empleadosPorId = useMemo(
    () => new Map(empleados.map((empleado) => [String(empleado.EMP_ID), empleado])),
    [empleados]
  );

  const cuotaMensualCalculada =
    form.pre_monto_total && form.pre_plazo
      ? numero(form.pre_monto_total) / numero(form.pre_plazo)
      : 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setId(null);
    setError('');
  };

  const validar = () => {
    if (
      !String(form.emp_id).trim() ||
      !form.pre_monto_total.trim() ||
      !String(form.pre_plazo).trim() ||
      !form.pre_fecha_inicio.trim()
    ) {
      setError('Empleado, monto, cuotas y fecha son obligatorios');
      return false;
    }
    if (numero(form.pre_plazo) <= 0) {
      setError('El numero de cuotas debe ser mayor a 0');
      return false;
    }
    return true;
  };

  const obtenerPayload = (): PrestamoForm => {
    const monto = numero(form.pre_monto_total);
    const cuotas = numero(form.pre_plazo);
    const cuota = cuotas > 0 ? monto / cuotas : 0;

    return {
      emp_id: String(form.emp_id),
      pre_monto_total: monto.toFixed(2),
      pre_interes: String(form.pre_interes ?? '0'),
      pre_plazo: String(form.pre_plazo || ''),
      pre_cuota_mensual: cuota.toFixed(2),
      pre_saldo_pendiente: String(form.pre_saldo_pendiente || monto.toFixed(2)),
      pre_fecha_inicio: form.pre_fecha_inicio,
      pre_estado: form.pre_estado,
    };
  };

  const guardar = async () => {
    try {
      setError('');
      setMensaje('');
      if (!validar()) return;

      const payload = obtenerPayload();
      if (modoEdicion && id !== null) {
        await actualizarPrestamo(id, payload);
        setMensaje('Prestamo actualizado correctamente');
      } else {
        await crearPrestamo(payload);
        setMensaje('Prestamo registrado correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error guardando prestamo'));
    }
  };

  const handleEliminar = async (idEliminar: number) => {
    if (!window.confirm('Deseas eliminar este prestamo?')) return;
    try {
      setError('');
      setMensaje('');
      await eliminarPrestamo(idEliminar);
      setMensaje('Prestamo eliminado correctamente');
      if (id === idEliminar) limpiarFormulario();
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error eliminando prestamo'));
    }
  };

  const handleEditar = (p: Prestamo) => {
    const totalCuotas = p.PRE_PLAZO ?? '';

    setModoEdicion(true);
    setId(p.PRE_ID);
    setMensaje('');
    setError('');
    setForm({
      emp_id: p.EMP_ID ? String(p.EMP_ID) : '',
      pre_monto_total: String(p.PRE_MONTO_TOTAL),
      pre_interes: String(p.PRE_INTERES ?? '0'),
      pre_plazo: String(totalCuotas),
      pre_cuota_mensual: String(p.PRE_CUOTA_MENSUAL),
      pre_saldo_pendiente: String(p.PRE_SALDO_PENDIENTE),
      pre_fecha_inicio: formatearFecha(p.PRE_FECHA_INICIO),
      pre_estado: p.PRE_ESTADO,
    });
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'A') return <Chip label="Activo" color="warning" size="small" />;
    if (estado === 'F') return <Chip label="Finalizado" color="success" size="small" />;
    if (estado === 'S') return <Chip label="Suspendido" color="error" size="small" />;
    return <Chip label={estado} size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando prestamos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AccountBalanceIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Prestamos de Empleados
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Registra el prestamo maestro del empleado. Nomina descuenta la cuota del periodo automaticamente cuando el prestamo esta activo y tiene saldo pendiente.
        </Alert>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar prestamo' : 'Nuevo prestamo'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Empleado</InputLabel>
              <Select name="emp_id" value={String(form.emp_id ?? '')} label="Empleado" onChange={handleChange}>
                <MenuItem value="">Seleccione empleado</MenuItem>
                {empleados.map((empleado) => (
                  <MenuItem key={empleado.EMP_ID} value={String(empleado.EMP_ID)}>
                    {obtenerNombreEmpleado(empleado) || `Empleado #${empleado.EMP_ID}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {empleados.length === 0 && (
              <Typography variant="caption" color="error">
                No se pudieron cargar empleados. Revisa el endpoint /empleados.
              </Typography>
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Monto total (Q)" name="pre_monto_total"
              type="number" value={form.pre_monto_total} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Numero de cuotas" name="pre_plazo"
              type="number" value={form.pre_plazo ?? ''} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Cuota mensual (calculada)"
              value={cuotaMensualCalculada > 0 ? formatearMoneda(cuotaMensualCalculada) : ''}
              slotProps={{ input: { readOnly: true } }}
              sx={{ backgroundColor: '#f5f5f5' }} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Fecha de inicio" name="pre_fecha_inicio"
              type="date" value={form.pre_fecha_inicio} onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select name="pre_estado" value={form.pre_estado}
                label="Estado" onChange={handleChange}>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="S">Suspendido</MenuItem>
                <MenuItem value="F">Finalizado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={guardar}>
                {modoEdicion ? 'Actualizar' : 'Guardar'}
              </Button>
              <Button variant="outlined" color="secondary"
                startIcon={<CleaningServicesIcon />} onClick={limpiarFormulario}>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listado de prestamos: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Monto Total</strong></TableCell>
                <TableCell><strong>Cuota Mensual</strong></TableCell>
                <TableCell><strong>Cuotas</strong></TableCell>
                <TableCell><strong>Saldo Pendiente</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? datos.map((p) => {
                const empleado = empleadosPorId.get(String(p.EMP_ID));
                const totalCuotas = numero(p.PRE_PLAZO);
                const montoTotal = numero(p.PRE_MONTO_TOTAL);
                const saldoPendiente = numero(p.PRE_SALDO_PENDIENTE);
                const porcentaje = montoTotal > 0 ? ((montoTotal - saldoPendiente) / montoTotal) * 100 : 0;

                return (
                  <TableRow key={p.PRE_ID} hover>
                    <TableCell>{p.PRE_ID}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{obtenerNombreEmpleado(empleado) || `Empleado #${p.EMP_ID ?? '-'}`}</Typography>
                      <Typography variant="caption" color="text.secondary">ID: {p.EMP_ID ?? '-'}</Typography>
                    </TableCell>
                    <TableCell>{formatearMoneda(p.PRE_MONTO_TOTAL)}</TableCell>
                    <TableCell>{formatearMoneda(p.PRE_CUOTA_MENSUAL)}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={porcentaje}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }} />
                        <Typography variant="caption">
                          {totalCuotas || '-'}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: saldoPendiente > 0 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                      {formatearMoneda(p.PRE_SALDO_PENDIENTE)}
                    </TableCell>
                    <TableCell>{obtenerChipEstado(p.PRE_ESTADO)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button size="small" variant="outlined" startIcon={<EditIcon />}
                          onClick={() => handleEditar(p)}>Editar</Button>
                        <Button size="small" variant="contained" color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(p.PRE_ID)}>Eliminar</Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">No hay prestamos registrados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setMensaje('')} sx={{ width: '100%' }}>
          {mensaje}
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default PrestamoCRUD;
