import { useEffect, useMemo, useState } from 'react';
import type { Rol, RolForm } from '../interfaces/roles';
import type { RolPermiso } from '../interfaces/rolPermisos';
import type { Usuario } from '../interfaces/usuario';
import {
  crearRol,
  actualizarRol,
  eliminarRol
} from '../services/roles.service';
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

import type { SelectChangeEvent } from '@mui/material/Select';

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import ShieldIcon from '@mui/icons-material/Shield';
import { useAuth } from '../context/AuthContext';
import { useUnsavedFormGuard } from '../hooks/useUnsavedFormGuard';

const rolesBase = new Set([
  'ADMIN',
  'ADMINISTRADOR',
  'CONTABILIDAD',
  'EMPLEADO',
  'GERENTE',
  'ROOT',
  'RRHH',
  'SUPREMO',
]);
const fechaHoy = () => new Date().toISOString().slice(0, 10);
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

const getUsuarioRolId = (usuario: Usuario) =>
  toFiniteNumber(leerCampo(usuario, ['rol_id', 'ROL_ID']));

const getUsuarioEstado = (usuario: Usuario) =>
  String(leerCampo(usuario, ['estado', 'ESTADO', 'usu_estado', 'USU_ESTADO']) ?? '');

const crearFormularioInicial = (): RolForm => ({
  rol_nombre: '',
  rol_descripcion: '',
  rol_nivel_acceso: '1',
  rol_estado: 'A',
  rol_fecha_creacion: fechaHoy()
});

function Roles() {
  const { user } = useAuth();
  const [datos, setDatos] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rolId, setRolId] = useState<number | null>(null);
  const [form, setForm] = useState<RolForm>(() => crearFormularioInicial());
  const [rolPermisos, setRolPermisos] = useState<RolPermiso[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const cargarRoles = async () => {
    try {
      setCargando(true);
      setError('');
      const catalogo = await obtenerAdminCatalogo();
      setDatos(catalogo.roles);
      setRolPermisos(catalogo.rolPermisos);
      setUsuarios(catalogo.usuarios);
    } catch (err: any) {
      setError('Error cargando roles: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  const currentUserRolId = useMemo(
    () => toFiniteNumber(leerCampo(user, ['rol_id', 'ROL_ID'])),
    [user]
  );
  const currentRole = useMemo(
    () => datos.find((rol) => rol.ROL_ID === currentUserRolId),
    [currentUserRolId, datos]
  );
  const currentRoleLevel = toFiniteNumber(currentRole?.ROL_NIVEL_ACCESO);
  const currentRoleName = normalizar(
    leerCampo(user, ['rol_nombre', 'ROL_NOMBRE', 'rol', 'role']) ?? currentRole?.ROL_NOMBRE
  );
  const currentRoleIsSupremo = ['supremo', 'root', 'superadmin'].includes(currentRoleName);

  const puedeGestionarRol = (rol: Rol) => {
    if (currentRoleIsSupremo) return true;

    const targetLevel = toFiniteNumber(rol.ROL_NIVEL_ACCESO);
    if (currentRoleLevel === undefined || targetLevel === undefined) return false;

    return targetLevel < currentRoleLevel;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const limpiarFormulario = () => {
    setForm(crearFormularioInicial());
    setModoEdicion(false);
    setRolId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (
      !form.rol_nombre.trim() ||
      !form.rol_descripcion.trim() ||
      !String(form.rol_nivel_acceso).trim() ||
      !form.rol_estado.trim()
    ) {
      setError('Todos los campos son obligatorios');
      return false;
    }

    const nombreRepetido = datos.some(
      (rol) =>
        rol.ROL_ID !== rolId &&
        rol.ROL_NOMBRE.trim().toUpperCase() === form.rol_nombre.trim().toUpperCase()
    );

    if (nombreRepetido) {
      setError('Ya existe un rol con ese nombre');
      return false;
    }

    const targetLevel = toFiniteNumber(form.rol_nivel_acceso);
    if (
      !currentRoleIsSupremo &&
      currentRoleLevel !== undefined &&
      targetLevel !== undefined &&
      targetLevel >= currentRoleLevel
    ) {
      setError('No puedes crear o modificar roles de nivel igual o superior al tuyo');
      return false;
    }

    return true;
  };

  const guardarRol = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return false;

      const payload: RolForm = {
        ...form,
        rol_nombre: form.rol_nombre.trim().toUpperCase(),
        rol_descripcion: form.rol_descripcion.trim(),
        rol_nivel_acceso: Number(form.rol_nivel_acceso),
        rol_fecha_creacion: form.rol_fecha_creacion || fechaHoy(),
      };

      if (modoEdicion && rolId !== null) {
        await actualizarRol(rolId, payload);
        setMensaje('Rol actualizado correctamente. Cierra sesión y vuelve a entrar para refrescar el menú.');
      } else {
        await crearRol(payload);
        setMensaje('Rol creado correctamente. Cierra sesión y vuelve a entrar para refrescar el menú.');
      }

      limpiarFormulario();
      await cargarRoles();
      return true;
    } catch (err: any) {
      setError('Error guardando rol: ' + (err.response?.data?.error || err.message));
      return false;
    }
  };

  useUnsavedFormGuard(form, crearFormularioInicial(), guardarRol);

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
    const rol = datos.find((item) => item.ROL_ID === id);
    const usuariosActivos = usuarios.filter(
      (usuario) => getUsuarioRolId(usuario) === id && getUsuarioEstado(usuario) === 'A'
    ).length;

    if (rol && rolesBase.has(rol.ROL_NOMBRE.trim().toUpperCase())) {
      setError('No se puede eliminar un rol base del sistema');
      return;
    }

    if (rol && !puedeGestionarRol(rol)) {
      setError('No puedes inactivar roles de nivel igual o superior al tuyo');
      return;
    }

    if (usuariosActivos > 0) {
      setError('No se puede inactivar un rol con usuarios activos asignados');
      return;
    }

    if (!window.confirm('¿Deseas inactivar este rol?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarRol(id);
      setMensaje('Rol inactivado correctamente. Cierra sesión y vuelve a entrar para refrescar el menú.');
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

  const esRolBase = (rol: Rol) => rolesBase.has(rol.ROL_NOMBRE.trim().toUpperCase());
  const obtenerPermisosAsignados = (id: number) =>
    rolPermisos.filter((item) => String(item.ROL_ID) === String(id)).length;

  const obtenerUsuariosAsignados = (id: number) =>
    usuarios.filter((usuario) => getUsuarioRolId(usuario) === id).length;

  const rolesFiltrados = useMemo(() => {
    const texto = normalizar(busqueda);

    return datos.filter((rol) => {
      const contenido = normalizar(`${rol.ROL_NOMBRE} ${rol.ROL_DESCRIPCION} ${rol.ROL_NIVEL_ACCESO}`);
      if (filtroEstado && rol.ROL_ESTADO !== filtroEstado) return false;
      if (texto && !contenido.includes(texto)) return false;
      return true;
    });
  }, [busqueda, datos, filtroEstado]);

  const resumenRoles = useMemo(() => ({
    activos: datos.filter((rol) => rol.ROL_ESTADO === 'A').length,
    inactivos: datos.filter((rol) => rol.ROL_ESTADO === 'I').length,
    base: datos.filter(esRolBase).length,
    sinPermisos: datos.filter((rol) => obtenerPermisosAsignados(rol.ROL_ID) === 0).length,
  }), [datos, rolPermisos]);

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

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Alert icon={<ShieldIcon />} severity="success">Activos: {resumenRoles.activos}</Alert>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Alert severity="warning">Inactivos: {resumenRoles.inactivos}</Alert>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Alert icon={<AdminPanelSettingsIcon />} severity="info">Roles base: {resumenRoles.base}</Alert>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Alert icon={<PeopleIcon />} severity={resumenRoles.sinPermisos ? 'warning' : 'success'}>
              Sin permisos: {resumenRoles.sinPermisos}
            </Alert>
          </Grid>
        </Grid>

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
              type="number"
              label="Nivel de Acceso"
              name="rol_nivel_acceso"
              value={form.rol_nivel_acceso}
              onChange={handleChange}
              slotProps={{ htmlInput: { min: 1, max: 99 } }}
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

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Descripción"
              name="rol_descripcion"
              value={form.rol_descripcion}
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
          Directorio de roles: {rolesFiltrados.length} de {datos.length}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar rol"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select
                value={filtroEstado}
                label="Estado"
                onChange={(event) => setFiltroEstado(event.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Acceso</strong></TableCell>
                <TableCell><strong>Permisos</strong></TableCell>
                <TableCell><strong>Usuarios</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rolesFiltrados.length > 0 ? (
                rolesFiltrados.map((rol) => {
                  const rolProtegido = !puedeGestionarRol(rol);

                  return (
                    <TableRow key={rol.ROL_ID} hover>
                      <TableCell>{rol.ROL_ID}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 'medium' }}>{rol.ROL_NOMBRE}</Typography>
                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                          {rol.ROL_DESCRIPCION}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={`Nivel ${rol.ROL_NIVEL_ACCESO}`} size="small" color="info" />
                      </TableCell>
                      <TableCell>{obtenerPermisosAsignados(rol.ROL_ID)}</TableCell>
                      <TableCell>{obtenerUsuariosAsignados(rol.ROL_ID)}</TableCell>
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
                            disabled={rolProtegido}
                            onClick={() => handleEditar(rol)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            disabled={esRolBase(rol) || rolProtegido}
                            onClick={() => handleEliminar(rol.ROL_ID)}
                          >
                            Inactivar
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">No hay roles registrados</TableCell>
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
