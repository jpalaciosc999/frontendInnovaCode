import { useEffect, useState } from 'react';
import type { Horario, HorarioForm } from '../interfaces/horario';
import {
  obtenerHorarios,
  crearHorario,
  actualizarHorario,
  eliminarHorario
} from '../services/horario.service';

import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
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

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ScheduleIcon from '@mui/icons-material/Schedule';

const initialForm: HorarioForm = {
  hor_descripcion: '',
  hor_hora_inicio: '',
  hor_hora_fin: '',
  hor_lunes: 0,
  hor_martes: 0,
  hor_miercoles: 0,
  hor_jueves: 0,
  hor_viernes: 0,
  hor_sabado: 0,
  hor_domingo: 0
};

function HorarioCRUD() {
  const [datos, setDatos] = useState<Horario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<HorarioForm>(initialForm);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerHorarios();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando horarios: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: checked ? 1 : 0
    }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setId(null);
    setError('');
  };

  const validarHora = (hora: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora);

  const validar = () => {
    if (!form.hor_descripcion.trim() || !form.hor_hora_inicio || !form.hor_hora_fin) {
      setError('Descripción, hora inicio y hora fin son obligatorias');
      return false;
    }

    if (!validarHora(form.hor_hora_inicio) || !validarHora(form.hor_hora_fin)) {
      setError('Las horas deben tener el formato HH:MM');
      return false;
    }

    const alMenosUnDia =
      form.hor_lunes ||
      form.hor_martes ||
      form.hor_miercoles ||
      form.hor_jueves ||
      form.hor_viernes ||
      form.hor_sabado ||
      form.hor_domingo;

    if (!alMenosUnDia) {
      setError('Debes seleccionar al menos un día');
      return false;
    }

    return true;
  };

  const guardar = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validar()) return;

      if (modoEdicion && id !== null) {
        await actualizarHorario(id, form);
        setMensaje('Horario actualizado correctamente');
      } else {
        await crearHorario(form);
        setMensaje('Horario creado correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error guardando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (idEliminar: number) => {
    if (!window.confirm('¿Deseas eliminar este horario?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarHorario(idEliminar);
      setMensaje('Horario eliminado correctamente');

      if (id === idEliminar) limpiarFormulario();

      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (h: Horario) => {
    setModoEdicion(true);
    setId(h.HOR_ID);
    setMensaje('');
    setError('');
    setForm({
      hor_descripcion: h.HOR_DESCRIPCION,
      hor_hora_inicio: h.HOR_HORA_INICIO,
      hor_hora_fin: h.HOR_HORA_FIN,
      hor_lunes: h.HOR_LUNES,
      hor_martes: h.HOR_MARTES,
      hor_miercoles: h.HOR_MIERCOLES,
      hor_jueves: h.HOR_JUEVES,
      hor_viernes: h.HOR_VIERNES,
      hor_sabado: h.HOR_SABADO,
      hor_domingo: h.HOR_DOMINGO
    });
  };

  const diasTexto = (h: Horario) => {
    const dias: string[] = [];
    if (h.HOR_LUNES) dias.push('Lun');
    if (h.HOR_MARTES) dias.push('Mar');
    if (h.HOR_MIERCOLES) dias.push('Mié');
    if (h.HOR_JUEVES) dias.push('Jue');
    if (h.HOR_VIERNES) dias.push('Vie');
    if (h.HOR_SABADO) dias.push('Sáb');
    if (h.HOR_DOMINGO) dias.push('Dom');
    return dias.join(', ');
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando horarios...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <ScheduleIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Horarios
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar horario' : 'Nuevo horario'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Descripción"
              name="hor_descripcion"
              value={form.hor_descripcion}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Hora inicio"
              name="hor_hora_inicio"
              type="time"
              value={form.hor_hora_inicio}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Hora fin"
              name="hor_hora_fin"
              type="time"
              value={form.hor_hora_fin}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Días del horario
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.hor_lunes === 1}
                    onChange={handleCheckChange}
                    name="hor_lunes"
                  />
                }
                label="Lunes"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.hor_martes === 1}
                    onChange={handleCheckChange}
                    name="hor_martes"
                  />
                }
                label="Martes"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.hor_miercoles === 1}
                    onChange={handleCheckChange}
                    name="hor_miercoles"
                  />
                }
                label="Miércoles"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.hor_jueves === 1}
                    onChange={handleCheckChange}
                    name="hor_jueves"
                  />
                }
                label="Jueves"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.hor_viernes === 1}
                    onChange={handleCheckChange}
                    name="hor_viernes"
                  />
                }
                label="Viernes"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.hor_sabado === 1}
                    onChange={handleCheckChange}
                    name="hor_sabado"
                  />
                }
                label="Sábado"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.hor_domingo === 1}
                    onChange={handleCheckChange}
                    name="hor_domingo"
                  />
                }
                label="Domingo"
              />
            </Box>
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

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listado de horarios: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell><strong>Hora inicio</strong></TableCell>
                <TableCell><strong>Hora fin</strong></TableCell>
                <TableCell><strong>Días</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((h) => (
                  <TableRow key={h.HOR_ID} hover>
                    <TableCell>{h.HOR_ID}</TableCell>
                    <TableCell>{h.HOR_DESCRIPCION}</TableCell>
                    <TableCell>{h.HOR_HORA_INICIO}</TableCell>
                    <TableCell>{h.HOR_HORA_FIN}</TableCell>
                    <TableCell>{diasTexto(h)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(h)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(h.HOR_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay horarios registrados
                  </TableCell>
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

export default HorarioCRUD;