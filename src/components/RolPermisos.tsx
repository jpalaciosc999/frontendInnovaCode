import { useEffect, useMemo, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { RolPermiso, RolPermisoForm } from '../interfaces/rolPermisos';
import type { Rol } from '../interfaces/roles';
import type { Permiso } from '../interfaces/permisos';
import {
  crearRolPermiso,
  actualizarRolPermiso,
  eliminarRolPermiso
} from '../services/rolPermisos.service';
import { obtenerAdminCatalogo } from '../services/admin.service';

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

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { normalizeRole } from '../config/roleViews';
import { suggestedPermissionNamesByRole } from '../config/permissionSuggestions';
import { useAuth } from '../context/AuthContext';
import { useUnsavedFormGuard } from '../hooks/useUnsavedFormGuard';

const initialForm: RolPermisoForm = {
  per_id: '',
  rol_id: ''
};
const normalizar = (valor: unknown) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const leerCampo = (item: unknown, keys: string[]) => {
  if (!item || typeof item !== 'object') return undefined;
  const record = item as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }

  return undefined;
};

const toFiniteNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

function RolPermisosView() {
  const { user } = useAuth();
  const [datos, setDatos] = useState<RolPermiso[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rpeId, setRpeId] = useState<number | null>(null);
  const [form, setForm] = useState<RolPermisoForm>(initialForm);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const catalogo = await obtenerAdminCatalogo();
      setDatos(catalogo.rolPermisos);
      setRoles(catalogo.roles);
      setPermisos(catalogo.permisos);
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

  const currentUserRolId = useMemo(
    () => toFiniteNumber(leerCampo(user, ['rol_id', 'ROL_ID'])),
    [user]
  );
  const currentRole = useMemo(
    () => roles.find((rol) => String(rol.ROL_ID) === String(currentUserRolId)),
    [currentUserRolId, roles]
  );
  const currentRoleLevel = toFiniteNumber(currentRole?.ROL_NIVEL_ACCESO);
  const currentRoleName = normalizar(
    leerCampo(user, ['rol_nombre', 'ROL_NOMBRE', 'rol', 'role']) ?? currentRole?.ROL_NOMBRE
  );
  const currentRoleIsSupremo = ['supremo', 'root', 'superadmin'].includes(currentRoleName);

  const puedeGestionarRolId = (rolId: string | number | undefined) => {
    if (currentRoleIsSupremo) return true;
    if (rolId === undefined || rolId === '') return false;

    const rol = rolesPorId.get(String(rolId));
    const targetLevel = toFiniteNumber(rol?.ROL_NIVEL_ACCESO);
    if (currentRoleLevel === undefined || targetLevel === undefined) return false;

    return targetLevel < currentRoleLevel;
  };

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

    if (!puedeGestionarRolId(form.rol_id)) {
      setError('No puedes modificar permisos de roles de nivel igual o superior al tuyo');
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

      if (!validarFormulario()) return false;

      if (modoEdicion && rpeId !== null) {
        await actualizarRolPermiso(rpeId, form);
        setMensaje('Relación actualizada correctamente. Cierra sesión y vuelve a entrar para refrescar el menú.');
      } else {
        await crearRolPermiso(form);
        setMensaje('Permiso asignado correctamente. Cierra sesión y vuelve a entrar para refrescar el menú.');
      }

      limpiarFormulario();
      await cargarDatos();
      return true;
    } catch (err: any) {
      setError('Error guardando: ' + (err.response?.data?.error || err.message));
      return false;
    }
  };

  useUnsavedFormGuard(form, initialForm, guardarRolPermiso);

  const asignarPermisosSugeridos = async () => {
    try {
      setError('');
      setMensaje('');

      if (!form.rol_id) {
        setError('Selecciona un rol para asignarle permisos sugeridos');
        return;
      }

      if (!puedeGestionarRolId(form.rol_id)) {
        setError('No puedes asignar permisos a roles de nivel igual o superior al tuyo');
        return;
      }

      const rol = rolesPorId.get(form.rol_id);
      const rolNormalizado = normalizeRole(rol?.ROL_NOMBRE);

      if (!rolNormalizado) {
        setError('El rol seleccionado no coincide con los roles del sistema');
        return;
      }

      const nombresSugeridos = suggestedPermissionNamesByRole[rolNormalizado] ?? [];
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

      setMensaje(`Permisos sugeridos asignados: ${faltantes.length}. Cierra sesión y vuelve a entrar para refrescar el menú.`);
      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error asignando permisos sugeridos: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (item: RolPermiso) => {
    if (!puedeGestionarRolId(item.ROL_ID)) {
      setError('No puedes editar permisos de roles de nivel igual o superior al tuyo');
      return;
    }

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
    const relacion = datos.find((item) => item.RPE_ID === id);
    if (relacion && !puedeGestionarRolId(relacion.ROL_ID)) {
      setError('No puedes quitar permisos de roles de nivel igual o superior al tuyo');
      return;
    }

    if (!window.confirm('¿Deseas quitar esta relación rol-permiso?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarRolPermiso(id);
      setMensaje('Relación eliminada correctamente. Cierra sesión y vuelve a entrar para refrescar el menú.');
      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando: ' + (err.response?.data?.error || err.message));
    }
  };

  const obtenerNombreRol = (rolId: number | string) =>
    rolesPorId.get(String(rolId))?.ROL_NOMBRE ?? `Rol #${rolId}`;

  const obtenerPermiso = (permisoId: number | string) =>
    permisosPorId.get(String(permisoId));

  const relacionesFiltradas = useMemo(() => {
    const texto = normalizar(busqueda);

    return datos.filter((item) => {
      const permiso = obtenerPermiso(item.PER_ID);
      const rol = obtenerNombreRol(item.ROL_ID);
      const contenido = normalizar(`${rol} ${permiso?.PER_NOMBRE_PERMISO} ${permiso?.PER_MODULO}`);
      if (filtroRol && String(item.ROL_ID) !== filtroRol) return false;
      if (filtroModulo && permiso?.PER_MODULO !== filtroModulo) return false;
      if (texto && !contenido.includes(texto)) return false;
      return true;
    });
  }, [busqueda, datos, filtroModulo, filtroRol, permisosPorId, rolesPorId]);

  const modulos = useMemo(
    () => Array.from(new Set(permisos.map((permiso) => permiso.PER_MODULO).filter(Boolean))).sort(),
    [permisos]
  );

  const coberturaRoles = useMemo(
    () =>
      roles.map((rol) => ({
        rol,
        permisos: datos.filter((item) => String(item.ROL_ID) === String(rol.ROL_ID)).length,
      })),
    [datos, roles]
  );

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
            Asignación de Permisos por Rol
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Selecciona un rol y un permiso para asignarlos. También puedes aplicar los permisos sugeridos del rol.
        </Alert>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          <Chip label={`Relaciones: ${datos.length}`} color="primary" />
          <Chip
            label={`Roles sin permisos: ${coberturaRoles.filter((item) => item.permisos === 0).length}`}
            color="warning"
          />
          {coberturaRoles.map((item) => (
            <Chip key={item.rol.ROL_ID} label={`${item.rol.ROL_NOMBRE}: ${item.permisos}`} variant="outlined" />
          ))}
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar asignación' : 'Nueva asignación'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Rol</InputLabel>
              <Select name="rol_id" value={form.rol_id} label="Rol" onChange={handleChange}>
                {roles.map((rol) => {
                  const rolBloqueado = !puedeGestionarRolId(rol.ROL_ID);

                  return (
                    <MenuItem key={rol.ROL_ID} value={String(rol.ROL_ID)} disabled={rolBloqueado}>
                      {rol.ROL_NOMBRE}
                      {rolBloqueado ? ' - Nivel protegido' : ''}
                    </MenuItem>
                  );
                })}
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
          Matriz rol-permiso: {relacionesFiltradas.length} de {datos.length}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar relación"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Rol</InputLabel>
              <Select value={filtroRol} label="Rol" onChange={(event) => setFiltroRol(event.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {roles.map((rol) => (
                  <MenuItem key={rol.ROL_ID} value={String(rol.ROL_ID)}>{rol.ROL_NOMBRE}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Módulo</InputLabel>
              <Select value={filtroModulo} label="Módulo" onChange={(event) => setFiltroModulo(event.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {modulos.map((modulo) => (
                  <MenuItem key={modulo} value={modulo}>{modulo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

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
              {relacionesFiltradas.length > 0 ? (
                relacionesFiltradas.map((item) => {
                  const permiso = obtenerPermiso(item.PER_ID);
                  const rolProtegido = !puedeGestionarRolId(item.ROL_ID);

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
                            disabled={rolProtegido}
                            onClick={() => handleEditar(item)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            disabled={rolProtegido}
                            onClick={() => handleEliminar(item.RPE_ID)}
                          >
                            Quitar
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
