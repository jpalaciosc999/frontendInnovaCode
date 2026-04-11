import { useEffect, useState } from 'react';
import type { TipoContrato, TipoContratoForm } from '../interfaces/tipoContrato';
import {
  obtenerTiposContrato,
  crearTipoContrato,
  actualizarTipoContrato,
  eliminarTipoContrato
} from '../services/tipoContrato.service';

import {
  Alert,
  Box,
  Button,
  Chip,
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
import DescriptionIcon from '@mui/icons-material/Description';

const initialForm: TipoContratoForm = {
  tic_nombre: '',
  tic_numero: '',
  tic_descripcion: '',
  tic_tipo_jornada: '',
  tic_fecha_modificacion: '',
  emp_id: ''
};

function TipoContratoCRUD() {
  const [datos, setDatos] = useState<TipoContrato[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<TipoContratoForm>(initialForm);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerTiposContrato();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando tipos de contrato: ' + err.message);
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

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setId(null);
    setError('');
  };

  const validar = () => {
    if (
      !form.tic_nombre.trim() ||
      !form.tic_numero.trim() ||
      !form.tic_tipo_jornada.trim() ||
      !String(form.emp_id).trim()
    ) {
      setError('Todos los campos obligatorios deben completarse');
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
        await actualizarTipoContrato(id, form);
        setMensaje('Tipo de contrato actualizado correctamente');
      } else {
        await crearTipoContrato(form);
        setMensaje('Tipo de contrato creado correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error guardando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (idEliminar: number) => {
    if (!window.confirm('¿Deseas eliminar este tipo de contrato?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarTipoContrato(idEliminar);
      setMensaje('Tipo de contrato eliminado correctamente');

      if (id === idEliminar) limpiarFormulario();

      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (t: TipoContrato) => {
    setModoEdicion(true);
    setId(t.TIC_ID);
    setMensaje('');
    setError('');
    setForm({
      tic_nombre: t.TIC_NOMBRE,
      tic_numero: t.TIC_NUMERO,
      tic_descripcion: t.TIC_DESCRIPCION || '',
      tic_tipo_jornada: t.TIC_TIPO_JORNADA,
      tic_fecha_modificacion: t.TIC_FECHA_MODIFICACION
        ? String(t.TIC_FECHA_MODIFICACION).split('T')[0]
        : '',
      emp_id: String(t.EMP_ID)
    });
  };

  const obtenerChipJornada = (jornada: string) => {
    const colores: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
      Diurna: 'success',
      diurna: 'success',
      Nocturna: 'warning',
      nocturna: 'warning',
      Mixta: 'info',
      mixta: 'info'
    };
    const color = colores[jornada] ?? 'primary';
    return <Chip label={jornada} color={color} size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando tipos de contrato...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Formulario */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <DescriptionIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Tipo de Contrato
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar tipo de contrato' : 'Nuevo tipo de contrato'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre"
              name="tic_nombre"
              value={form.tic_nombre}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Número"
              name="tic_numero"
              value={form.tic_numero}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Descripción"
              name="tic_descripcion"
              value={form.tic_descripcion}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Tipo de jornada"
              name="tic_tipo_jornada"
              value={form.tic_tipo_jornada}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha de modificación"
              name="tic_fecha_modificacion"
              type="date"
              value={form.tic_fecha_modificacion}
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
          Listado de tipos de contrato: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Número</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell><strong>Tipo Jornada</strong></TableCell>
                <TableCell><strong>Fecha Modificación</strong></TableCell>
                <TableCell><strong>Empleado ID</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((t) => (
                  <TableRow key={t.TIC_ID} hover>
                    <TableCell>{t.TIC_ID}</TableCell>
                    <TableCell>{t.TIC_NOMBRE}</TableCell>
                    <TableCell>{t.TIC_NUMERO}</TableCell>
                    <TableCell>{t.TIC_DESCRIPCION}</TableCell>
                    <TableCell>{obtenerChipJornada(t.TIC_TIPO_JORNADA)}</TableCell>
                    <TableCell>
                      {t.TIC_FECHA_MODIFICACION
                        ? new Date(t.TIC_FECHA_MODIFICACION).toLocaleDateString('es-GT')
                        : '—'}
                    </TableCell>
                    <TableCell>{t.EMP_ID}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(t)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(t.TIC_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay tipos de contrato registrados
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

export default TipoContratoCRUD;