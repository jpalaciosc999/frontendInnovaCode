import { useEffect, useState } from 'react';
import type { Rol, RolForm } from '../interfaces/roles';
import {
  obtenerRoles,
  crearRol,
  actualizarRol,
  eliminarRol
} from '../services/roles.service';

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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const initialForm: RolForm = {
  rol_nombre: '',
  rol_descripcion: '',
  rol_nivel_acceso: '',
  rol_estado: '',
  rol_fecha_creacion: ''
};

function Roles() {
  const [datos, setDatos] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rolId, setRolId] = useState<number | null>(null);
  const [form, setForm] = useState<RolForm>(initialForm);

  const cargarRoles = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerRoles();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando roles: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setRolId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (
      !form.rol_nombre.trim() ||
      !form.rol_descripcion.trim() ||
      !form.rol_nivel_acceso.trim() ||
      !form.rol_estado.trim() ||
      !form.rol_fecha_creacion.trim()
    ) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const guardarRol = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && rolId !== null) {
        await actualizarRol(rolId, form);
        setMensaje('Rol actualizado correctamente');
      } else {
        await crearRol(form);
        setMensaje('Rol creado correctamente');
      }

      limpiarFormulario();
      await cargarRoles();
    } catch (err: any) {
      setError('Error guardando rol: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (rol: Rol) => {
    setModoEdicion(true);
    setRolId(rol.ROL_ID);
    setMensaje('');
    setError('');
    setForm({
      rol_nombre: rol.ROL_NOMBRE || '',
      rol_descripcion: rol.ROL_DESCRIPCION || '',
      rol_nivel_acceso: rol.ROL_NIVEL_ACCESO || '',
      rol_estado: rol.ROL_ESTADO || '',
      rol_fecha_creacion: rol.ROL_FECHA_CREACION
        ? String(rol.ROL_FECHA_CREACION).slice(0, 10)
        : ''
    });
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este rol?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarRol(id);
      setMensaje('Rol eliminado correctamente');
      await cargarRoles();
    } catch (err: any) {
      setError('Error eliminando rol: ' + (err.response?.data?.error || err.message));
    }
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'A') return <Chip label="Activo" color="success" size="small" />;
    if (estado === 'I') return <Chip label="Inactivo" color="default" size="small" />;
    return <Chip label={estado || 'N/A'} size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Cargando roles...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AdminPanelSettingsIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Gestión de Roles
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar rol' : 'Nuevo rol'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre del Rol"
              name="rol_nombre"
              value={form.rol_nombre}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Nivel de Acceso"
              name="rol_nivel_acceso"
              value={form.rol_nivel_acceso}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="rol_estado"
                value={form.rol_estado}
                label="Estado"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione</MenuItem>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              label="Descripción"
              name="rol_descripcion"
              value={form.rol_descripcion}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              type="date"
              label="Fecha de Creación"
              name="rol_fecha_creacion"
              slotProps={{ inputLabel: { shrink: true } }}
              value={form.rol_fecha_creacion}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardarRol}
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
          Listado de roles: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Acceso</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? (
                datos.map((rol) => (
                  <TableRow key={rol.ROL_ID} hover>
                    <TableCell>{rol.ROL_ID}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 'medium' }}>{rol.ROL_NOMBRE}</Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        {rol.ROL_DESCRIPCION}
                      </Typography>
                    </TableCell>
                    <TableCell>{rol.ROL_NIVEL_ACCESO}</TableCell>
                    <TableCell>{obtenerChipEstado(rol.ROL_ESTADO)}</TableCell>
                    <TableCell>
                      {rol.ROL_FECHA_CREACION ? String(rol.ROL_FECHA_CREACION).slice(0, 10) : ''}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(rol)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(rol.ROL_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">No hay roles registrados</TableCell>
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

export default Roles;