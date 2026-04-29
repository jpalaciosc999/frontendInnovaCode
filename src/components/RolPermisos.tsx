import { useEffect, useMemo, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { RolPermiso, RolPermisoForm } from '../interfaces/rolPermisos';
import type { Rol } from '../interfaces/roles';
import type { Permiso } from '../interfaces/permisos';
import {
  obtenerRolPermisos,
  crearRolPermiso,
  actualizarRolPermiso,
  eliminarRolPermiso
} from '../services/rolPermisos.service';
import { obtenerRoles } from '../services/roles.service';
import { obtenerPermisos } from '../services/permisos.service';

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
  Typography
} from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { normalizeRole } from '../config/roleViews';
import { suggestedPermissionNamesByRole } from '../config/permissionSuggestions';

const initialForm: RolPermisoForm = {
  per_id: '',
  rol_id: ''
};

function RolPermisosView() {
  const [datos, setDatos] = useState<RolPermiso[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rpeId, setRpeId] = useState<number | null>(null);
  const [form, setForm] = useState<RolPermisoForm>(initialForm);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const [relacionesData, rolesData, permisosData] = await Promise.all([
        obtenerRolPermisos(),
        obtenerRoles(),
        obtenerPermisos(),
      ]);
      setDatos(relacionesData);
      setRoles(rolesData);
      setPermisos(permisosData);
    } catch (err: any) {
      setError('Error cargando roles, permisos o relaciones: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const rolesPorId = useMemo(
    () => new Map(roles.map((rol) => [String(rol.ROL_ID), rol])),
    [roles]
  );

  const permisosPorId = useMemo(
    () => new Map(permisos.map((permiso) => [String(permiso.PERMISOS_ID), permiso])),
    [permisos]
  );

  const permisoYaAsignado = (rolId: string, permisoId: string) =>
    datos.some(
      (item) =>
        String(item.ROL_ID) === rolId &&
        String(item.PER_ID) === permisoId &&
        item.RPE_ID !== rpeId
    );

  const handleChange = (e: SelectChangeEvent) => {
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
    if (!form.per_id || !form.rol_id) {
      setError('Debes seleccionar un rol y un permiso');
      return false;
    }

    if (permisoYaAsignado(form.rol_id, form.per_id)) {
      setError('Ese permiso ya esta asignado al rol seleccionado');
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
        setMensaje('Relacion actualizada correctamente');
      } else {
        await crearRolPermiso(form);
        setMensaje('Permiso asignado correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error guardando: ' + (err.response?.data?.error || err.message));
    }
  };

  const asignarPermisosSugeridos = async () => {
    try {
      setError('');
      setMensaje('');

      if (!form.rol_id) {
        setError('Selecciona un rol para asignarle permisos sugeridos');
        return;
      }

      const rol = rolesPorId.get(form.rol_id);
      const rolNormalizado = normalizeRole(rol?.ROL_NOMBRE);

      if (!rolNormalizado) {
        setError('El rol seleccionado no coincide con los roles del sistema');
        return;
      }

      const nombresSugeridos = suggestedPermissionNamesByRole[rolNormalizado];
      const permisosSugeridos = permisos.filter((permiso) =>
        nombresSugeridos.includes(permiso.PER_NOMBRE_PERMISO.trim().toUpperCase())
      );

      const faltantes = permisosSugeridos.filter(
        (permiso) => !permisoYaAsignado(form.rol_id, String(permiso.PERMISOS_ID))
      );

      if (faltantes.length === 0) {
        setMensaje('El rol ya tiene sus permisos sugeridos asignados');
        return;
      }

      await Promise.all(
        faltantes.map((permiso) =>
          crearRolPermiso({
            rol_id: form.rol_id,
            per_id: String(permiso.PERMISOS_ID),
          })
        )
      );

      setMensaje(`Permisos sugeridos asignados: ${faltantes.length}`);
      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error asignando permisos sugeridos: ' + (err.response?.data?.error || err.message));
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
    if (!window.confirm('Deseas eliminar esta relacion rol-permiso?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarRolPermiso(id);
      setMensaje('Relacion eliminada correctamente');
      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando: ' + (err.response?.data?.error || err.message));
    }
  };

  const obtenerNombreRol = (rolId: number | string) =>
    rolesPorId.get(String(rolId))?.ROL_NOMBRE ?? `Rol #${rolId}`;

  const obtenerPermiso = (permisoId: number | string) =>
    permisosPorId.get(String(permisoId));

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
            Asignacion de Permisos por Rol
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Selecciona un rol y un permiso para asignarlos. Tambien puedes aplicar los permisos sugeridos del rol.
        </Alert>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar asignacion' : 'Nueva asignacion'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select name="rol_id" value={form.rol_id} label="Rol" onChange={handleChange}>
                {roles.map((rol) => (
                  <MenuItem key={rol.ROL_ID} value={String(rol.ROL_ID)}>
                    {rol.ROL_NOMBRE}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Permiso</InputLabel>
              <Select name="per_id" value={form.per_id} label="Permiso" onChange={handleChange}>
                {permisos.map((permiso) => (
                  <MenuItem key={permiso.PERMISOS_ID} value={String(permiso.PERMISOS_ID)}>
                    {permiso.PER_NOMBRE_PERMISO} - {permiso.PER_MODULO}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardarRolPermiso}
              >
                {modoEdicion ? 'Actualizar' : 'Asignar permiso'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<AutoFixHighIcon />}
                onClick={asignarPermisosSugeridos}
              >
                Asignar sugeridos al rol
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
                <TableCell><strong>Rol</strong></TableCell>
                <TableCell><strong>Permiso</strong></TableCell>
                <TableCell><strong>Modulo</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? (
                datos.map((item) => {
                  const permiso = obtenerPermiso(item.PER_ID);

                  return (
                    <TableRow key={item.RPE_ID} hover>
                      <TableCell>{item.RPE_ID}</TableCell>
                      <TableCell>{obtenerNombreRol(item.ROL_ID)}</TableCell>
                      <TableCell>
                        <Chip label={permiso?.PER_NOMBRE_PERMISO ?? `Permiso #${item.PER_ID}`} size="small" />
                      </TableCell>
                      <TableCell>{permiso?.PER_MODULO ?? '-'}</TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
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
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No hay relaciones registradas</TableCell>
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
