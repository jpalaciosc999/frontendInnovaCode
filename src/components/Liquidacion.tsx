import { useEffect, useState } from 'react';
import type { Liquidacion, LiquidacionForm } from '../interfaces/liquidacion';
import {
  obtenerLiquidaciones,
  crearLiquidacion,
  actualizarLiquidacion,
  eliminarLiquidacion
} from '../services/liquidacion.service';

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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const initialForm: LiquidacionForm = {
  liq_fecha_salida: '',
  liq_tipo_retiro: '',
  liq_dias_trabajado: '',
  liq_indemnizacion: '',
  liq_vacaciones_pagadas: '',
  liq_aguinaldo_proporcional: '',
  liq_bono14_proporcional: '',
  liq_liquidacion: '',
  liq_fecha_registro: '',
  emp_id: ''
};

function LiquidacionCRUD() {
  const [datos, setDatos] = useState<Liquidacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [liqId, setLiqId] = useState<number | null>(null);
  const [form, setForm] = useState<LiquidacionForm>(initialForm);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerLiquidaciones();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando liquidaciones: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cálculo automático del total de liquidación
  useEffect(() => {
    const total =
      Number(form.liq_indemnizacion || 0) +
      Number(form.liq_vacaciones_pagadas || 0) +
      Number(form.liq_aguinaldo_proporcional || 0) +
      Number(form.liq_bono14_proporcional || 0);

    setForm((prev) => ({
      ...prev,
      liq_liquidacion: total.toString()
    }));
  }, [
    form.liq_indemnizacion,
    form.liq_vacaciones_pagadas,
    form.liq_aguinaldo_proporcional,
    form.liq_bono14_proporcional
  ]);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setLiqId(null);
    setError('');
  };

  const validar = () => {
    if (
      !form.liq_fecha_salida.trim() ||
      !form.liq_tipo_retiro.trim() ||
      !String(form.emp_id).trim()
    ) {
      setError('Fecha de salida, tipo de retiro y empleado ID son obligatorios');
      return false;
    }
    return true;
  };

  const guardar = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validar()) return;

      if (modoEdicion && liqId !== null) {
        await actualizarLiquidacion(liqId, form);
        setMensaje('Liquidación actualizada correctamente');
      } else {
        await crearLiquidacion(form);
        setMensaje('Liquidación creada correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error guardando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (idEliminar: number) => {
    if (!window.confirm('¿Deseas eliminar esta liquidación?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarLiquidacion(idEliminar);
      setMensaje('Liquidación eliminada correctamente');

      if (liqId === idEliminar) limpiarFormulario();

      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (l: Liquidacion) => {
    setModoEdicion(true);
    setLiqId(l.LIQ_ID);
    setMensaje('');
    setError('');
    setForm({
      liq_fecha_salida: l.LIQ_FECHA_SALIDA
        ? String(l.LIQ_FECHA_SALIDA).split('T')[0]
        : '',
      liq_tipo_retiro: l.LIQ_TIPO_RETIRO,
      liq_dias_trabajado: String(l.LIQ_DIAS_TRABAJADO || ''),
      liq_indemnizacion: String(l.LIQ_INDEMNIZACION || ''),
      liq_vacaciones_pagadas: String(l.LIQ_VACACIONES_PAGADAS || ''),
      liq_aguinaldo_proporcional: String(l.LIQ_AGUINALDO_PROPORCIONAL || ''),
      liq_bono14_proporcional: String(l.LIQ_BONO14_PROPORCIONAL || ''),
      liq_liquidacion: String(l.LIQ_LIQUIDACION || ''),
      liq_fecha_registro: l.LIQ_FECHA_REGISTRO
        ? String(l.LIQ_FECHA_REGISTRO).split('T')[0]
        : '',
      emp_id: String(l.EMP_ID || '')
    });
  };

  const obtenerChipTipoRetiro = (tipo: string) => {
    const lower = tipo?.toLowerCase() || '';
    if (lower.includes('voluntar')) return <Chip label={tipo} color="info" size="small" />;
    if (lower.includes('despido')) return <Chip label={tipo} color="error" size="small" />;
    if (lower.includes('mutuo')) return <Chip label={tipo} color="success" size="small" />;
    return <Chip label={tipo || '—'} color="default" size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando liquidaciones...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Formulario */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AccountBalanceWalletIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Gestión de Liquidaciones
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar liquidación' : 'Nueva liquidación'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha de salida"
              name="liq_fecha_salida"
              type="date"
              value={form.liq_fecha_salida}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo de retiro</InputLabel>
              <Select
                name="liq_tipo_retiro"
                value={form.liq_tipo_retiro}
                label="Tipo de retiro"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione tipo</MenuItem>
                <MenuItem value="Voluntario">Voluntario</MenuItem>
                <MenuItem value="Despido">Despido</MenuItem>
                <MenuItem value="Mutuo acuerdo">Mutuo acuerdo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Días trabajados"
              name="liq_dias_trabajado"
              type="number"
              value={form.liq_dias_trabajado}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Indemnización"
              name="liq_indemnizacion"
              type="number"
              value={form.liq_indemnizacion}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Vacaciones pagadas"
              name="liq_vacaciones_pagadas"
              type="number"
              value={form.liq_vacaciones_pagadas}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Aguinaldo proporcional"
              name="liq_aguinaldo_proporcional"
              type="number"
              value={form.liq_aguinaldo_proporcional}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Bono 14 proporcional"
              name="liq_bono14_proporcional"
              type="number"
              value={form.liq_bono14_proporcional}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha de registro"
              name="liq_fecha_registro"
              type="date"
              value={form.liq_fecha_registro}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Empleado ID"
              name="emp_id"
              type="number"
              value={form.emp_id}
              onChange={handleChange}
            />
          </Grid>

          {/* Total calculado automáticamente */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Total liquidación (calculado)"
              value={`Q ${Number(form.liq_liquidacion).toLocaleString('es-GT')}`}
              slotProps={{ input: { readOnly: true } }}
              sx={{ backgroundColor: '#f5f5f5' }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardar}
              >
                {modoEdicion ? 'Actualizar' : 'Guardar'}
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={<CleaningServicesIcon />}
                onClick={limpiarFormulario}
              >
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listado de liquidaciones: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Empleado ID</strong></TableCell>
                <TableCell><strong>Tipo Retiro</strong></TableCell>
                <TableCell><strong>Días Trabajados</strong></TableCell>
                <TableCell><strong>Total Liquidación</strong></TableCell>
                <TableCell><strong>Fecha Salida</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((l) => (
                  <TableRow key={l.LIQ_ID} hover>
                    <TableCell>{l.LIQ_ID}</TableCell>
                    <TableCell>{l.EMP_ID}</TableCell>
                    <TableCell>{obtenerChipTipoRetiro(l.LIQ_TIPO_RETIRO)}</TableCell>
                    <TableCell>{l.LIQ_DIAS_TRABAJADO}</TableCell>
                    <TableCell>
                      Q{Number(l.LIQ_LIQUIDACION).toLocaleString('es-GT')}
                    </TableCell>
                    <TableCell>
                      {l.LIQ_FECHA_SALIDA
                        ? new Date(l.LIQ_FECHA_SALIDA).toLocaleDateString('es-GT')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(l)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(l.LIQ_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay liquidaciones registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Snackbars */}
      <Snackbar
        open={!!mensaje}
        autoHideDuration={3000}
        onClose={() => setMensaje('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setMensaje('')} sx={{ width: '100%' }}>
          {mensaje}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default LiquidacionCRUD;