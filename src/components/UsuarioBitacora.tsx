import { useEffect, useState } from 'react';
import type { UsuarioBitacora, UsuarioBitacoraForm } from '../interfaces/usuarioBitacora';
import {
  obtenerUsuariosBitacora,
  crearUsuarioBitacora,
  actualizarUsuarioBitacora,
  eliminarUsuarioBitacora
} from '../services/usuarioBitacora.service';

import {
  Alert,
  Box,
  Button,
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
import MenuBookIcon from '@mui/icons-material/MenuBook';

const initialForm: UsuarioBitacoraForm = {
  usu_id: '',
  bit_id: ''
};

function UsuarioBitacoraCRUD() {
  const [datos, setDatos] = useState<UsuarioBitacora[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<UsuarioBitacoraForm>(initialForm);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerUsuariosBitacora();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando usuario bitácora: ' + err.message);
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
    if (!String(form.usu_id).trim() || !String(form.bit_id).trim()) {
      setError('Todos los campos son obligatorios');
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
        await actualizarUsuarioBitacora(id, form);
        setMensaje('Usuario bitácora actualizado correctamente');
      } else {
        await crearUsuarioBitacora(form);
        setMensaje('Usuario bitácora creado correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error guardando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (idEliminar: number) => {
    if (!window.confirm('¿Deseas eliminar este registro?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarUsuarioBitacora(idEliminar);
      setMensaje('Usuario bitácora eliminado correctamente');

      if (id === idEliminar) limpiarFormulario();

      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (u: UsuarioBitacora) => {
    setModoEdicion(true);
    setId(u.USB_ID);
    setMensaje('');
    setError('');
    setForm({
      usu_id: String(u.USU_ID),
      bit_id: String(u.BIT_ID)
    });
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando usuario bitácora...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Formulario */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <MenuBookIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Usuario Bitácora
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar registro' : 'Nuevo registro'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Usuario ID"
              name="usu_id"
              type="number"
              value={form.usu_id}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Bitácora ID"
              name="bit_id"
              type="number"
              value={form.bit_id}
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
          Listado de registros: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>USB ID</strong></TableCell>
                <TableCell><strong>Usuario ID</strong></TableCell>
                <TableCell><strong>Bitácora ID</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((u) => (
                  <TableRow key={u.USB_ID} hover>
                    <TableCell>{u.USB_ID}</TableCell>
                    <TableCell>{u.USU_ID}</TableCell>
                    <TableCell>{u.BIT_ID}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(u)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(u.USB_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No hay registros disponibles
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

export default UsuarioBitacoraCRUD;