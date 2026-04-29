import { useEffect, useState } from 'react';
import type { Permiso, PermisoForm } from '../interfaces/permisos';
import {
  obtenerPermisos,
  crearPermiso,
  actualizarPermiso,
  eliminarPermiso
} from '../services/permisos.service';

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
import KeyIcon from '@mui/icons-material/Key';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { suggestedPermissions } from '../config/permissionSuggestions';

const initialForm: PermisoForm = {
  per_nombre_permiso: '',
  per_modulo: '',
  per_descripcion: ''
};

function Permisos() {
  const [datos, setDatos] = useState<Permiso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [permisoId, setPermisoId] = useState<number | null>(null);
  const [form, setForm] = useState<PermisoForm>(initialForm);

  const cargarPermisos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerPermisos();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando permisos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPermisos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setPermisoId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (
      !form.per_nombre_permiso.trim() ||
      !form.per_modulo.trim() ||
      !form.per_descripcion.trim()
    ) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const guardarPermiso = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && permisoId !== null) {
        await actualizarPermiso(permisoId, form);
        setMensaje('Permiso actualizado correctamente');
      } else {
        await crearPermiso(form);
        setMensaje('Permiso creado correctamente');
      }

      limpiarFormulario();
      await cargarPermisos();
    } catch (err: any) {
      setError('Error guardando permiso: ' + (err.response?.data?.error || err.message));
    }
  };

  const crearPermisosSugeridos = async () => {
    try {
      setError('');
      setMensaje('');

      const permisosExistentes = new Set(
        datos.map((permiso) => permiso.PER_NOMBRE_PERMISO.trim().toUpperCase())
      );

      const faltantes = suggestedPermissions.filter(
        (permiso) => !permisosExistentes.has(permiso.nombre)
      );

      if (faltantes.length === 0) {
        setMensaje('Todos los permisos sugeridos ya existen');
        return;
      }

      await Promise.all(
        faltantes.map((permiso) =>
          crearPermiso({
            per_nombre_permiso: permiso.nombre,
            per_modulo: permiso.modulo,
            per_descripcion: permiso.descripcion,
          })
        )
      );

      setMensaje(`Permisos sugeridos creados: ${faltantes.length}`);
      await cargarPermisos();
    } catch (err: any) {
      setError('Error creando permisos sugeridos: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (permiso: Permiso) => {
    setModoEdicion(true);
    setPermisoId(permiso.PERMISOS_ID);
    setMensaje('');
    setError('');
    setForm({
      per_nombre_permiso: permiso.PER_NOMBRE_PERMISO || '',
      per_modulo: permiso.PER_MODULO || '',
      per_descripcion: permiso.PER_DESCRIPCION || ''
    });
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este permiso?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarPermiso(id);
      setMensaje('Permiso eliminado correctamente');
      await cargarPermisos();
    } catch (err: any) {
      setError('Error eliminando permiso: ' + (err.response?.data?.error || err.message));
    }
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Cargando permisos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <KeyIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Gestión de Permisos
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar permiso' : 'Nuevo permiso'}
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          Puedes crear permisos manualmente o generar el catalogo sugerido para los roles del sistema.
        </Alert>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre del Permiso"
              name="per_nombre_permiso"
              value={form.per_nombre_permiso}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Módulo"
              name="per_modulo"
              value={form.per_modulo}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Descripción"
              name="per_descripcion"
              multiline
              rows={2}
              value={form.per_descripcion}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardarPermiso}
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
              <Button
                variant="outlined"
                startIcon={<AutoFixHighIcon />}
                onClick={crearPermisosSugeridos}
              >
                Crear permisos sugeridos
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listado de permisos registrados: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Módulo</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? (
                datos.map((permiso) => (
                  <TableRow key={permiso.PERMISOS_ID} hover>
                    <TableCell>{permiso.PERMISOS_ID}</TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>{permiso.PER_NOMBRE_PERMISO}</TableCell>
                    <TableCell>{permiso.PER_MODULO}</TableCell>
                    <TableCell>{permiso.PER_DESCRIPCION}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(permiso)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(permiso.PERMISOS_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No hay permisos registrados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Alertas */}
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

export default Permisos;
