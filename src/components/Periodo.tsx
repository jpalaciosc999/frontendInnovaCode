// pages/Periodos.tsx
import { useEffect, useState } from 'react';
import type { Periodo, PeriodoForm } from '../interfaces/periodo';
import {
  obtenerPeriodos,
  crearPeriodo,
  actualizarPeriodo,
  eliminarPeriodo
} from '../services/periodo.service';

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
    } catch (err: any) {
      setError('Error cargando periodos: ' + err.message);
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
    } catch (err: any) {
      setError('Error guardando periodo: ' + (err.response?.data?.error || err.message));
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
    } catch (err: any) {
      setError('Error eliminando periodo: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (per: Periodo) => {
    setModoEdicion(true);
    setPerId(per.PER_ID);
    setMensaje('');
    setError('');
    setForm({
      fecha_inicio: per.PER_FECHA_INICIO?.slice(0, 10) || '',
      fecha_fin: per.PER_FECHA_FIN?.slice(0, 10) || '',
      fecha_pago: per.PER_FECHA_PAGO?.slice(0, 10) || '',
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
                  <TableCell colSpan={5} align="center">No hay periodos registrados</TableCell>
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