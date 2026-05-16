// pages/Periodos.tsx
import { useEffect, useState } from 'react';
import type { Periodo, PeriodoForm } from '../interfaces/periodo';
import {
  obtenerPeriodos,
  crearPeriodo,
  actualizarPeriodo,
  eliminarPeriodo
} from '../services/periodo.service';
import { getApiErrorMessage } from '../api/errors';

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
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

const initialForm: PeriodoForm = {
  fecha_inicio: '',
  fecha_fin: '',
  fecha_pago: '',
  estado: ''
};

const toInputDate = (value?: string) => {
  if (!value) return '';

  const isoMatch = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const oracleMatch = String(value).match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (oracleMatch) return `${oracleMatch[3]}-${oracleMatch[2]}-${oracleMatch[1]}`;

  return String(value).slice(0, 10);
};

const diffDaysInclusive = (fechaInicio: string, fechaFin: string) => {
  if (!fechaInicio || !fechaFin) return 0;

  const inicio = new Date(`${fechaInicio}T00:00:00Z`);
  const fin = new Date(`${fechaFin}T00:00:00Z`);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) return 0;

  return Math.floor((fin.getTime() - inicio.getTime()) / 86400000) + 1;
};

const tipoPeriodoPorDias = (dias: number) => {
  if (dias >= 14 && dias <= 16) return 'Quincenal';
  if (dias >= 28 && dias <= 31) return 'Mensual';
  return '';
};

function Periodos() {
  const [datos, setDatos] = useState<Periodo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [perId, setPerId] = useState<number | null>(null);
  const [form, setForm] = useState<PeriodoForm>(initialForm);

  const cargarPeriodos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerPeriodos();
      setDatos(data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error cargando periodos'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarPeriodos(); }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name as string]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setPerId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!form.fecha_inicio || !form.fecha_fin || !form.fecha_pago || !form.estado.trim()) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    if (new Date(form.fecha_fin) < new Date(form.fecha_inicio)) {
      setError('La fecha fin no puede ser anterior a la fecha inicio');
      return false;
    }

    const diasPeriodo = diffDaysInclusive(form.fecha_inicio, form.fecha_fin);
    if (!tipoPeriodoPorDias(diasPeriodo)) {
      setError('Solo puedes crear periodos quincenales de 14 a 16 dias o mensuales de 28 a 31 dias');
      return false;
    }

    return true;
  };

  const guardarPeriodo = async () => {
    try {
      setError('');
      setMensaje('');
      if (!validarFormulario()) return;

      if (modoEdicion && perId !== null) {
        await actualizarPeriodo(perId, form);
        setMensaje('Periodo actualizado correctamente');
      } else {
        await crearPeriodo(form);
        setMensaje('Periodo creado correctamente');
      }
      limpiarFormulario();
      await cargarPeriodos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error guardando periodo'));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este periodo?')) return;
    try {
      setError('');
      setMensaje('');
      await eliminarPeriodo(id);
      setMensaje('Periodo eliminado correctamente');
      if (perId === id) limpiarFormulario();
      await cargarPeriodos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error eliminando periodo'));
    }
  };

  const handleEditar = (per: Periodo) => {
    setModoEdicion(true);
    setPerId(per.PER_ID);
    setMensaje('');
    setError('');
    setForm({
      fecha_inicio: toInputDate(per.PER_FECHA_INICIO),
      fecha_fin: toInputDate(per.PER_FECHA_FIN),
      fecha_pago: toInputDate(per.PER_FECHA_PAGO),
      estado: per.PER_ESTADO || ''
    });
  };

  const obtenerChipEstado = (estado: string) => {
    return estado === 'A'
      ? <Chip label="Activo" color="success" size="small" />
      : <Chip label="Inactivo" color="default" size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Cargando periodos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <CalendarMonthIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Periodos de Planilla
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar Periodo' : 'Nuevo Periodo'}
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          La nomina calcula salario, bonificaciones, prestamos, IGSS, ISR y liquido segun el rango: quincenal o mensual.
        </Alert>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label="Fecha Inicio"
              name="fecha_inicio"
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.fecha_inicio}
              onChange={handleChange}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label="Fecha Fin"
              name="fecha_fin"
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.fecha_fin}
              onChange={handleChange}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              type="date"
              label="Fecha de Pago"
              name="fecha_pago"
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.fecha_pago}
              onChange={handleChange}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="estado"
                value={form.estado}
                label="Estado"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione</MenuItem>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {form.fecha_inicio && form.fecha_fin && (
            <Grid size={{ xs: 12 }}>
              <Chip
                color={tipoPeriodoPorDias(diffDaysInclusive(form.fecha_inicio, form.fecha_fin)) ? 'primary' : 'error'}
                label={
                  tipoPeriodoPorDias(diffDaysInclusive(form.fecha_inicio, form.fecha_fin))
                    ? `${tipoPeriodoPorDias(diffDaysInclusive(form.fecha_inicio, form.fecha_fin))} - ${diffDaysInclusive(form.fecha_inicio, form.fecha_fin)} dias`
                    : `${diffDaysInclusive(form.fecha_inicio, form.fecha_fin)} dias - rango no permitido`
                }
              />
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardarPeriodo}
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

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Historial de Periodos: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Rango de Fechas</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Dias</strong></TableCell>
                <TableCell><strong>Fecha Pago</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? (
                datos.map((per) => (
                  <TableRow key={per.PER_ID} hover>
                    <TableCell>{per.PER_ID}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {per.PER_FECHA_INICIO?.slice(0, 10)} ⮕ {per.PER_FECHA_FIN?.slice(0, 10)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={per.TIPO_PERIODO === 'M' ? 'primary' : per.TIPO_PERIODO === 'Q' ? 'info' : 'warning'}
                        label={per.TIPO_PERIODO === 'M' ? 'Mensual' : per.TIPO_PERIODO === 'Q' ? 'Quincenal' : 'Revisar'}
                      />
                    </TableCell>
                    <TableCell>{per.DIAS_PERIODO || '-'}</TableCell>
                    <TableCell>{per.PER_FECHA_PAGO?.slice(0, 10)}</TableCell>
                    <TableCell>{obtenerChipEstado(per.PER_ESTADO)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(per)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(per.PER_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">No hay periodos registrados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar
        open={!!mensaje}
        autoHideDuration={3000}
        onClose={() => setMensaje('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setMensaje('')}>
          {mensaje}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setError('')}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Periodos;
