import { useEffect, useState } from 'react';
import type { RolPermiso, RolPermisoForm } from '../interfaces/rolPermisos';
import {
  obtenerRolPermisos,
  crearRolPermiso,
  actualizarRolPermiso,
  eliminarRolPermiso
} from '../services/rolPermisos.service';

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
import SecurityIcon from '@mui/icons-material/Security';

const initialForm: RolPermisoForm = {
  per_id: '',
  rol_id: ''
};

function RolPermisosView() {
  const [datos, setDatos] = useState<RolPermiso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rpeId, setRpeId] = useState<number | null>(null);
  const [form, setForm] = useState<RolPermisoForm>(initialForm);

  const cargarRolPermisos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerRolPermisos();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando rol-permisos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRolPermisos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setRpeId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!form.per_id.toString().trim() || !form.rol_id.toString().trim()) {
      setError('Los IDs de permiso y rol son obligatorios');
      return false;
    }
    return true;
  };

  const guardarRolPermiso = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && rpeId !== null) {
        await actualizarRolPermiso(rpeId, form);
        setMensaje('Relación actualizada correctamente');
      } else {
        await crearRolPermiso(form);
        setMensaje('Relación creada correctamente');
      }

      limpiarFormulario();
      await cargarRolPermisos();
    } catch (err: any) {
      setError('Error guardando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (item: RolPermiso) => {
    setModoEdicion(true);
    setRpeId(item.RPE_ID);
    setMensaje('');
    setError('');
    setForm({
      per_id: String(item.PER_ID || ''),
      rol_id: String(item.ROL_ID || '')
    });
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar esta relación rol-permiso?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarRolPermiso(id);
      setMensaje('Relación eliminada correctamente');
      await cargarRolPermisos();
    } catch (err: any) {
      setError('Error eliminando: ' + (err.response?.data?.error || err.message));
    }
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Cargando relaciones...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <SecurityIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Asignación de Rol-Permisos
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar relación' : 'Nueva relación'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="ID Permiso"
              name="per_id"
              value={form.per_id}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              type="number"
              label="ID Rol"
              name="rol_id"
              value={form.rol_id}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardarRolPermiso}
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
          Relaciones registradas: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Permiso ID</strong></TableCell>
                <TableCell><strong>Rol ID</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? (
                datos.map((item) => (
                  <TableRow key={item.RPE_ID} hover>
                    <TableCell>{item.RPE_ID}</TableCell>
                    <TableCell>{item.PER_ID}</TableCell>
                    <TableCell>{item.ROL_ID}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(item)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(item.RPE_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">No hay relaciones registradas</TableCell>
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

export default RolPermisosView;