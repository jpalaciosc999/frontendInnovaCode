import { useEffect, useMemo, useState } from 'react';
import type {
  PrestamoDetalle,
  PrestamoDetalleForm
} from '../interfaces/prestamoDetalle';
import type { Prestamo } from '../interfaces/prestamos';
import {
  obtenerPrestamoDetalles,
  crearPrestamoDetalle,
  actualizarPrestamoDetalle,
  eliminarPrestamoDetalle
} from '../services/prestamoDetalle.service';
import { actualizarPrestamo, obtenerPrestamos } from '../services/prestamos.service';
import { getApiErrorMessage } from '../api/errors';
import { formatearFecha, formatearMoneda } from '../utils/relations';

import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
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
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { useUnsavedFormGuard } from '../hooks/useUnsavedFormGuard';

const initialForm: PrestamoDetalleForm = {
  pde_numero_cuota: '',
  pde_fecha_pago: '',
  pde_monto: '',
  pde_saldo_restante: '',
  pde_estado: '',
  pre_id: ''
};

const numero = (valor: number | string | undefined) => Number(valor || 0);

function PrestamoDetalleView() {
  const [datos, setDatos] = useState<PrestamoDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [form, setForm] = useState<PrestamoDetalleForm>(initialForm);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);

  const cargarPrestamoDetalles = async () => {
    try {
      setCargando(true);
      setError('');
      const [detallesData, prestamosData] = await Promise.all([
        obtenerPrestamoDetalles(),
        obtenerPrestamos()
      ]);
      setDatos(detallesData);
      setPrestamos(prestamosData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error cargando detalles'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPrestamoDetalles();
  }, []);

  const prestamosPorId = useMemo(
    () => new Map(prestamos.map((prestamo) => [String(prestamo.PRE_ID), prestamo])),
    [prestamos]
  );

  const obtenerEtiquetaPrestamo = (prestamo?: Prestamo) =>
    prestamo
      ? `Prestamo #${prestamo.PRE_ID} - ${formatearMoneda(prestamo.PRE_MONTO_TOTAL)} - saldo ${formatearMoneda(prestamo.PRE_SALDO_PENDIENTE)}`
      : '';

  const detallesDePrestamo = (preId: string | number) =>
    datos.filter((detalle) => String(detalle.PRE_ID) === String(preId));

  const calcularSiguienteCuota = (preId: string | number) => {
    const cuotas = detallesDePrestamo(preId).map((detalle) => numero(detalle.PDE_NUMERO_CUOTA));
    return cuotas.length > 0 ? Math.max(...cuotas) + 1 : 1;
  };

  const calcularSaldoDespuesDePago = (prestamo: Prestamo, monto: number) =>
    Math.max(0, numero(prestamo.PRE_SALDO_PENDIENTE) - monto);

  const crearPayloadPrestamo = (prestamo: Prestamo, cuotasPagadas: number, saldoPendiente: number) => {
    const totalCuotas = numero(prestamo.PRE_PLAZO);

    return {
      emp_id: prestamo.EMP_ID ? String(prestamo.EMP_ID) : '',
      pre_monto_total: String(prestamo.PRE_MONTO_TOTAL),
      pre_interes: String(prestamo.PRE_INTERES ?? '0'),
      pre_plazo: String(prestamo.PRE_PLAZO ?? totalCuotas),
      pre_cuota_mensual: String(prestamo.PRE_CUOTA_MENSUAL),
      pre_saldo_pendiente: saldoPendiente.toFixed(2),
      pre_fecha_inicio: formatearFecha(prestamo.PRE_FECHA_INICIO),
      pre_estado: saldoPendiente <= 0 || cuotasPagadas >= totalCuotas ? 'F' : 'A',
    };
  };

  const sincronizarPrestamo = async (preId: string | number) => {
    const prestamo = prestamosPorId.get(String(preId));
    if (!prestamo) return;

    const detallesActualizados = await obtenerPrestamoDetalles();
    const pagosCancelados = detallesActualizados.filter(
      (detalle) => String(detalle.PRE_ID) === String(preId) && detalle.PDE_ESTADO === 'C'
    );
    const totalPagado = pagosCancelados.reduce((total, detalle) => total + numero(detalle.PDE_MONTO), 0);
    const saldoPendiente = Math.max(0, numero(prestamo.PRE_MONTO_TOTAL) - totalPagado);

    await actualizarPrestamo(prestamo.PRE_ID, crearPayloadPrestamo(prestamo, pagosCancelados.length, saldoPendiente));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    if (name === 'pre_id') {
      const prestamo = prestamosPorId.get(String(value));
      const montoCuota = numero(prestamo?.PRE_CUOTA_MENSUAL);
      setForm((prev) => ({
        ...prev,
        pre_id: value,
        pde_numero_cuota: value ? String(calcularSiguienteCuota(value)) : '',
        pde_monto: montoCuota ? montoCuota.toFixed(2) : '',
        pde_saldo_restante: prestamo ? calcularSaldoDespuesDePago(prestamo, montoCuota).toFixed(2) : '',
        pde_estado: 'C'
      }));
      return;
    }

    if (name === 'pde_monto') {
      const prestamo = prestamosPorId.get(String(form.pre_id));
      const monto = numero(value);
      setForm((prev) => ({
        ...prev,
        pde_monto: value,
        pde_saldo_restante: prestamo ? calcularSaldoDespuesDePago(prestamo, monto).toFixed(2) : prev.pde_saldo_restante
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setDetalleId(null);
    setError('');
  };

  const validarFormulario = () => {
    const fields = Object.values(form);
    if (fields.some(f => !f.toString().trim())) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const guardarPrestamoDetalle = async () => {
    try {
      setError('');
      setMensaje('');
      if (!validarFormulario()) return false;

      const detalleAnterior = detalleId !== null
        ? datos.find((detalle) => detalle.PDE_ID === detalleId)
        : undefined;

      if (modoEdicion && detalleId !== null) {
        await actualizarPrestamoDetalle(detalleId, form);
        setMensaje('Cuota actualizada correctamente');
      } else {
        await crearPrestamoDetalle(form);
        setMensaje('Cuota registrada correctamente');
      }

      const prestamosASincronizar = Array.from(
        new Set([detalleAnterior?.PRE_ID, form.pre_id].filter(Boolean).map(String))
      );
      await Promise.all(prestamosASincronizar.map((preId) => sincronizarPrestamo(preId)));

      limpiarFormulario();
      await cargarPrestamoDetalles();
      return true;
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error al guardar'));
      return false;
    }
  };

  useUnsavedFormGuard(form, initialForm, guardarPrestamoDetalle);

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este detalle?')) return;
    try {
      setError('');
      setMensaje('');
      const detalleAnterior = datos.find((detalle) => detalle.PDE_ID === id);
      await eliminarPrestamoDetalle(id);
      if (detalleAnterior?.PRE_ID) await sincronizarPrestamo(detalleAnterior.PRE_ID);
      setMensaje('Detalle eliminado correctamente');
      if (detalleId === id) limpiarFormulario();
      await cargarPrestamoDetalles();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error al eliminar'));
    }
  };

  const handleEditar = (detalle: PrestamoDetalle) => {
    setModoEdicion(true);
    setDetalleId(detalle.PDE_ID);
    setMensaje('');
    setError('');
    setForm({
      pde_numero_cuota: String(detalle.PDE_NUMERO_CUOTA || ''),
      pde_fecha_pago: detalle.PDE_FECHA_PAGO ? formatearFecha(detalle.PDE_FECHA_PAGO) : '',
      pde_monto: String(detalle.PDE_MONTO || ''),
      pde_saldo_restante: String(detalle.PDE_SALDO_RESTANTE || ''),
      pde_estado: detalle.PDE_ESTADO || '',
      pre_id: String(detalle.PRE_ID || '')
    });
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'C') return <Chip label="Cancelado" color="success" size="small" variant="filled" />;
    if (estado === 'P') return <Chip label="Pendiente" color="warning" size="small" variant="outlined" />;
    return <Chip label={estado} size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Cargando detalles de pagos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <ReceiptLongIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Plan de Pagos / Detalle
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar Cuota' : 'Registrar Pago / Cuota'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Prestamo</InputLabel>
              <Select name="pre_id" value={form.pre_id} label="Prestamo" onChange={handleChange}>
                <MenuItem value="">Seleccione prestamo</MenuItem>
                {prestamos.map((prestamo) => (
                  <MenuItem key={prestamo.PRE_ID} value={String(prestamo.PRE_ID)}>
                    {obtenerEtiquetaPrestamo(prestamo)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth type="number" label="No. Cuota" name="pde_numero_cuota" value={form.pde_numero_cuota} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth type="date" label="Fecha de Pago" name="pde_fecha_pago" slotProps={{ inputLabel: { shrink: true } }} value={form.pde_fecha_pago} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select name="pde_estado" value={form.pde_estado} label="Estado" onChange={handleChange}>
                <MenuItem value="">Seleccione</MenuItem>
                <MenuItem value="P">Pendiente</MenuItem>
                <MenuItem value="C">Cancelado</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth type="number" label="Monto de Cuota" name="pde_monto" value={form.pde_monto} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth type="number" label="Saldo Restante" name="pde_saldo_restante" value={form.pde_saldo_restante} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarPrestamoDetalle}>
                {modoEdicion ? 'Actualizar' : 'Guardar'}
              </Button>
              <Button variant="outlined" color="secondary" startIcon={<CleaningServicesIcon />} onClick={limpiarFormulario}>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Historial de Cuotas: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Préstamo</strong></TableCell>
                <TableCell><strong>Cuota #</strong></TableCell>
                <TableCell><strong>Fecha Pago</strong></TableCell>
                <TableCell><strong>Monto</strong></TableCell>
                <TableCell><strong>Saldo Rest.</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? (
                datos.map((detalle) => (
                  <TableRow key={detalle.PDE_ID} hover>
                    <TableCell>{detalle.PDE_ID}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {obtenerEtiquetaPrestamo(prestamosPorId.get(String(detalle.PRE_ID))) || `Prestamo #${detalle.PRE_ID}`}
                    </TableCell>
                    <TableCell>{detalle.PDE_NUMERO_CUOTA}</TableCell>
                    <TableCell>{detalle.PDE_FECHA_PAGO ? String(detalle.PDE_FECHA_PAGO).slice(0, 10) : ''}</TableCell>
                    <TableCell>{formatearMoneda(detalle.PDE_MONTO)}</TableCell>
                    <TableCell>{formatearMoneda(detalle.PDE_SALDO_RESTANTE)}</TableCell>
                    <TableCell>{obtenerChipEstado(detalle.PDE_ESTADO)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleEditar(detalle)}>Editar</Button>
                        <Button size="small" variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => handleEliminar(detalle.PDE_ID)}>Eliminar</Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">No hay detalles registrados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setMensaje('')}>{mensaje}</Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" variant="filled" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
    </Box>
  );
}

export default PrestamoDetalleView;
