import { useEffect, useMemo, useState } from 'react';
import type { Usuario, UsuarioForm } from '../interfaces/usuario';
import type { Rol } from '../interfaces/roles';
import type { Empleado } from '../interfaces/empleados';
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
} from '../services/usuario.service';
import { obtenerEmpleados } from '../services/empleados.service';
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
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { useAuth } from '../context/AuthContext';
import { useUnsavedFormGuard } from '../hooks/useUnsavedFormGuard';

const initialForm: UsuarioForm = {
  username: '',
  nombre_completo: '',
  correo: '',
  password: '',
  estado: 'A',
  rol_id: undefined,
  emp_id: undefined
};

const CORREO_DOMINIO = 'empresa.com';
const PASSWORD_MIN_LENGTH = 8;
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

const getUsuarioId = (usuario: Usuario) => {
  const directId = toFiniteNumber(leerCampo(usuario, [
    'id',
    'ID',
    'USU_ID',
    'usu_id',
    'usuId',
    'USUARIO_ID',
    'usuario_id',
    'usuarioId',
    'USUARIOID',
    'id_usuario',
    'ID_USUARIO',
    'user_id',
    'USER_ID',
    'userId',
    'USERID',
  ]));

  if (directId !== undefined) return directId;
  if (!usuario || typeof usuario !== 'object') return undefined;

  const record = usuario as unknown as Record<string, unknown>;
  const idKey = Object.keys(record).find((key) => {
    const normalized = key
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');

    return (
      normalized === 'id' ||
      normalized === 'userid' ||
      normalized === 'usuarioid' ||
      normalized === 'usuid' ||
      normalized.endsWith('usuarioid') ||
      normalized.endsWith('userid') ||
      normalized.endsWith('usuid')
    );
  });

  return idKey ? toFiniteNumber(record[idKey]) : undefined;
};

const getUsuarioRolId = (usuario: Usuario) =>
  toFiniteNumber(leerCampo(usuario, ['rol_id', 'ROL_ID']));

const getUsuarioEmpId = (usuario: Usuario) =>
  toFiniteNumber(leerCampo(usuario, ['emp_id', 'EMP_ID']));

const getRolId = (rol: Rol) =>
  toFiniteNumber(leerCampo(rol, ['ROL_ID', 'rol_id', 'id', 'ID']));

const getRolNombre = (rol: Rol) =>
  String(leerCampo(rol, ['ROL_NOMBRE', 'rol_nombre', 'nombre', 'name']) ?? '');

const getUsuarioUsername = (usuario: Usuario) =>
  String(leerCampo(usuario, ['username', 'USERNAME', 'USU_USERNAME', 'usu_username', 'usu_usuario', 'USU_USUARIO']) ?? '');

const getUsuarioNombre = (usuario: Usuario) =>
  String(leerCampo(usuario, ['nombre_completo', 'NOMBRE_COMPLETO', 'usu_nombre_completo', 'USU_NOMBRE_COMPLETO', 'nombre']) ?? '');

const getUsuarioCorreo = (usuario: Usuario) =>
  String(leerCampo(usuario, ['correo', 'CORREO', 'email', 'EMAIL', 'usu_correo', 'USU_CORREO']) ?? '');

const getUsuarioEstado = (usuario: Usuario) =>
  String(leerCampo(usuario, ['estado', 'ESTADO', 'usu_estado', 'USU_ESTADO']) ?? '');

const quitarAcentos = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N');

const limpiarTextoUsuario = (valor: string) =>
  quitarAcentos(valor)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const obtenerNombreEmpleado = (empleado: Empleado) =>
  `${empleado.EMP_NOMBRE ?? ''} ${empleado.EMP_APELLIDO ?? ''}`.trim();

const generarBaseUsuario = (nombreCompleto: string) => {
  const partes = quitarAcentos(nombreCompleto)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (partes.length === 0) return '';

  const inicialNombre = limpiarTextoUsuario(partes[0]).charAt(0);
  const primerApellido =
    partes.length >= 3
      ? limpiarTextoUsuario(partes[partes.length - 2])
      : limpiarTextoUsuario(partes[partes.length - 1]);

  return `${inicialNombre}${primerApellido}`;
};

const generarCredenciales = (
  nombreCompleto: string,
  usuarios: Usuario[],
  usuarioActualId: number | null
) => {
  const base = generarBaseUsuario(nombreCompleto);
  if (!base) return { username: '', correo: '' };

  const usados = new Set(
    usuarios
      .filter((usuario) => getUsuarioId(usuario) !== usuarioActualId)
      .map((usuario) => getUsuarioUsername(usuario).toLowerCase())
      .filter(Boolean)
  );

  let username = base;
  let contador = 1;

  while (usados.has(username)) {
    username = `${base}${contador}`;
    contador += 1;
  }

  return {
    username,
    correo: `${username}@${CORREO_DOMINIO}`,
  };
};

function UsuarioCRUD() {
  const { user } = useAuth();
  const [datos, setDatos] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<UsuarioForm>(initialForm);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const [catalogo, usuariosData, empleadosData] = await Promise.all([
        obtenerAdminCatalogo(),
        obtenerUsuarios(),
        obtenerEmpleados(),
      ]);
      const usuariosCatalogo = catalogo.usuarios ?? [];
      const usuariosFuente = usuariosData.length > 0 ? usuariosData : usuariosCatalogo;
      setDatos(usuariosFuente);
      setRoles(catalogo.roles);
      setEmpleados(empleadosData);
    } catch (err: any) {
      setError('Error cargando usuarios, roles o empleados: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const currentUserId = useMemo(
    () =>
      toFiniteNumber(leerCampo(user, [
        'id',
        'USU_ID',
        'usu_id',
        'usuario_id',
        'user_id',
      ])),
    [user]
  );
  const currentUserRolId = useMemo(
    () => toFiniteNumber(leerCampo(user, ['rol_id', 'ROL_ID'])),
    [user]
  );
  const currentRole = useMemo(
    () => roles.find((rol) => getRolId(rol) === currentUserRolId),
    [currentUserRolId, roles]
  );
  const currentRoleLevel = toFiniteNumber(currentRole?.ROL_NIVEL_ACCESO);
  const currentRoleName = normalizar(
    leerCampo(user, ['rol_nombre', 'ROL_NOMBRE', 'rol', 'role']) ?? currentRole?.ROL_NOMBRE
  );
  const currentRoleIsSupremo = ['supremo', 'root', 'superadmin'].includes(currentRoleName);

  const getRolNivel = (rolId?: number) =>
    toFiniteNumber(roles.find((rol) => getRolId(rol) === rolId)?.ROL_NIVEL_ACCESO);

  const puedeGestionarRolId = (rolId?: number) => {
    if (currentRoleIsSupremo) return true;
    if (rolId === undefined) return false;

    const targetLevel = getRolNivel(rolId);
    if (currentRoleLevel === undefined || targetLevel === undefined) return false;

    return targetLevel < currentRoleLevel;
  };

  const esUsuarioSesion = (usuarioId?: number | null) =>
    currentUserId !== undefined && usuarioId !== undefined && usuarioId !== null && currentUserId === usuarioId;

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const { name, value } = e.target;

    if (name === 'nombre_completo') {
      const credenciales = generarCredenciales(value, datos, id);
      setForm((prev) => ({
        ...prev,
        nombre_completo: value,
        username: credenciales.username,
        correo: credenciales.correo,
      }));
      return;
    }

    if (name === 'rol_id' || name === 'emp_id') {
      const idValue = toFiniteNumber(value);
      setForm((prev) => ({
        ...prev,
        [name]: idValue,
      }));
      return;
    }

    setForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleEmpleadoChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    const empleado = empleados.find((item) => String(item.EMP_ID) === value);

    if (!empleado) {
      setForm((prev) => ({ ...prev, emp_id: undefined }));
      return;
    }

    const nombreCompleto = obtenerNombreEmpleado(empleado);
    const credenciales = generarCredenciales(nombreCompleto, datos, id);

    setForm((prev) => ({
      ...prev,
      emp_id: empleado.EMP_ID,
      nombre_completo: nombreCompleto,
      username: credenciales.username,
      correo: credenciales.correo,
    }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setId(null);
    setError('');
  };

  const validar = () => {
    const rolId = toFiniteNumber(form.rol_id);
    const empId = toFiniteNumber(form.emp_id);

    if (
      !form.username.trim() ||
      !form.nombre_completo.trim() ||
      !form.correo.trim() ||
      !form.estado.trim() ||
      rolId === undefined ||
      empId === undefined
    ) {
      setError('Todos los campos son obligatorios, incluyendo empleado y rol');
      return false;
    }

    if (!modoEdicion && !form.password?.trim()) {
      setError('La contraseña es obligatoria para crear un usuario');
      return false;
    }

    if (form.password?.trim() && form.password.trim().length < PASSWORD_MIN_LENGTH) {
      setError(`La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`);
      return false;
    }

    if (
      modoEdicion &&
      esUsuarioSesion(id) &&
      currentUserRolId !== undefined &&
      rolId !== currentUserRolId
    ) {
      setError('No puedes cambiar tu propio rol');
      return false;
    }

    if (modoEdicion && esUsuarioSesion(id) && form.estado === 'I') {
      setError('No puedes inactivar el usuario con el que tienes la sesión abierta');
      return false;
    }

    if ((!modoEdicion || !esUsuarioSesion(id)) && !puedeGestionarRolId(rolId)) {
      setError('No puedes asignar o modificar roles de nivel igual o superior al tuyo');
      return false;
    }

    const usernameRepetido = datos.some(
      (usuario) =>
        getUsuarioId(usuario) !== id &&
        getUsuarioUsername(usuario).trim().toLowerCase() === form.username.trim().toLowerCase()
    );

    if (usernameRepetido) {
      setError('Ya existe otro usuario con ese username');
      return false;
    }

    const correoRepetido = datos.some(
      (usuario) =>
        getUsuarioId(usuario) !== id &&
        getUsuarioCorreo(usuario).trim().toLowerCase() === form.correo.trim().toLowerCase()
    );

    if (correoRepetido) {
      setError('Ya existe otro usuario con ese correo');
      return false;
    }

    return true;
  };

  const guardar = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validar()) return false;

      const payload: UsuarioForm = {
        ...form,
        username: form.username.trim(),
        nombre_completo: form.nombre_completo.trim(),
        correo: form.correo.trim().toLowerCase(),
        password: form.password?.trim() || undefined,
        rol_id: toFiniteNumber(form.rol_id),
        emp_id: toFiniteNumber(form.emp_id),
      };

      if (modoEdicion) {
        const usuarioId = toFiniteNumber(id);
        if (usuarioId === undefined) {
          setError('No se puede actualizar: el usuario seleccionado no trae un ID válido');
          return false;
        }

        await actualizarUsuario(usuarioId, payload);
        setMensaje('Usuario actualizado correctamente');
      } else {
        await crearUsuario(payload);
        setMensaje('Usuario creado correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
      return true;
    } catch (err: any) {
      setError('Error guardando usuario: ' + (err.response?.data?.error || err.message));
      return false;
    }
  };

  useUnsavedFormGuard(form, initialForm, guardar);

  const handleEditar = (u: Usuario) => {
    const usuarioId = getUsuarioId(u);

    if (usuarioId === undefined) {
      setError('No se puede editar: el usuario seleccionado no trae un ID válido');
      return;
    }

    setModoEdicion(true);
    setId(usuarioId);
    setMensaje('');
    setError('');
    setForm({
      username: getUsuarioUsername(u),
      nombre_completo: getUsuarioNombre(u),
      correo: getUsuarioCorreo(u),
      password: '',
      estado: getUsuarioEstado(u) || 'A',
      rol_id: getUsuarioRolId(u),
      emp_id: getUsuarioEmpId(u)
    });
  };

  const handleEliminar = async (idEliminar: number) => {
    if (esUsuarioSesion(idEliminar)) {
      setError('No puedes inactivar el usuario con el que tienes la sesión abierta');
      return;
    }

    const usuarioEliminar = datos.find((usuario) => getUsuarioId(usuario) === idEliminar);
    if (usuarioEliminar && !puedeGestionarRolId(getUsuarioRolId(usuarioEliminar))) {
      setError('No puedes inactivar usuarios con roles de nivel igual o superior al tuyo');
      return;
    }

    if (!window.confirm('¿Deseas inactivar este usuario?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarUsuario(idEliminar);
      setMensaje('Usuario inactivado correctamente');

      if (id === idEliminar) limpiarFormulario();

      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando usuario: ' + (err.response?.data?.error || err.message));
    }
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'A') return <Chip label="Activo" color="success" size="small" />;
    if (estado === 'I') return <Chip label="Inactivo" color="default" size="small" />;
    return <Chip label={estado || 'Sin estado'} size="small" />;
  };

  const obtenerNombreRol = (rolId?: number) =>
    roles.find((rol) => getRolId(rol) === rolId)
      ? getRolNombre(roles.find((rol) => getRolId(rol) === rolId)!)
      : 'Sin rol';

  const obtenerNombreEmpleadoPorId = (empId?: number) =>
    empleados.find((empleado) => empleado.EMP_ID === empId)
      ? obtenerNombreEmpleado(empleados.find((empleado) => empleado.EMP_ID === empId)!)
      : 'Sin empleado';

  const empleadoAsignadoAOtroUsuario = (empId: number) =>
    datos.some((usuario) => getUsuarioEmpId(usuario) === empId && getUsuarioId(usuario) !== id);

  const usuariosFiltrados = useMemo(() => {
    const texto = normalizar(busqueda);

    return datos.filter((usuario) => {
      const rolId = getUsuarioRolId(usuario);
      const empId = getUsuarioEmpId(usuario);
      const contenido = normalizar(
        `${getUsuarioUsername(usuario)} ${getUsuarioNombre(usuario)} ${getUsuarioCorreo(usuario)} ${obtenerNombreRol(rolId)} ${obtenerNombreEmpleadoPorId(empId)}`
      );
      if (filtroRol && String(rolId ?? '') !== filtroRol) return false;
      if (filtroEstado && getUsuarioEstado(usuario) !== filtroEstado) return false;
      if (texto && !contenido.includes(texto)) return false;
      return true;
    });
  }, [busqueda, datos, empleados, filtroEstado, filtroRol, roles]);

  const resumenUsuarios = useMemo(() => ({
    activos: datos.filter((usuario) => getUsuarioEstado(usuario) === 'A').length,
    inactivos: datos.filter((usuario) => getUsuarioEstado(usuario) === 'I').length,
    sinEmpleado: datos.filter((usuario) => !getUsuarioEmpId(usuario)).length,
    empleadosSinUsuario: empleados.filter(
      (empleado) => empleado.EMP_ESTADO === 'A' && !datos.some((usuario) => getUsuarioEmpId(usuario) === empleado.EMP_ID)
    ).length,
  }), [datos, empleados]);

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando usuarios...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Formulario */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <ManageAccountsIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Gestión de Usuarios
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar usuario' : 'Nuevo usuario'}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <Alert severity="success">Usuarios activos: {resumenUsuarios.activos}</Alert>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Alert severity="warning">Inactivos: {resumenUsuarios.inactivos}</Alert>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Alert severity={resumenUsuarios.sinEmpleado ? 'warning' : 'success'}>
              Sin empleado: {resumenUsuarios.sinEmpleado}
            </Alert>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <Alert severity={resumenUsuarios.empleadosSinUsuario ? 'info' : 'success'}>
              Empleados sin usuario: {resumenUsuarios.empleadosSinUsuario}
            </Alert>
          </Grid>
        </Grid>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Empleado</InputLabel>
              <Select
                name="emp_id"
                value={form.emp_id ? String(form.emp_id) : ''}
                label="Empleado"
                onChange={handleEmpleadoChange}
              >
                {empleados.map((empleado) => {
                  const asignado = empleadoAsignadoAOtroUsuario(empleado.EMP_ID);

                  return (
                    <MenuItem
                      key={empleado.EMP_ID}
                      value={String(empleado.EMP_ID)}
                      disabled={asignado}
                    >
                      {obtenerNombreEmpleado(empleado)}
                      {asignado ? ' - Ya tiene usuario' : ''}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Rol</InputLabel>
              <Select
                name="rol_id"
                value={form.rol_id ? String(form.rol_id) : ''}
                label="Rol"
                onChange={handleChange}
                disabled={modoEdicion && esUsuarioSesion(id)}
              >
                {roles.map((rol) => {
                  const rolId = getRolId(rol);
                  if (rolId === undefined) return null;
                  const esRolActualSesion =
                    modoEdicion && esUsuarioSesion(id) && rolId === currentUserRolId;
                  const rolBloqueado = !puedeGestionarRolId(rolId) && !esRolActualSesion;

                  return (
                    <MenuItem key={rolId} value={String(rolId)} disabled={rolBloqueado}>
                      {getRolNombre(rol)}
                      {rolBloqueado ? ' - Nivel protegido' : ''}
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              helperText="Se genera automáticamente desde el nombre completo"
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre Completo"
              name="nombre_completo"
              value={form.nombre_completo}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Correo"
              name="correo"
              type="email"
              value={form.correo}
              onChange={handleChange}
              helperText={`Dominio sugerido: ${CORREO_DOMINIO}`}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={form.password ?? ''}
              onChange={handleChange}
              helperText={
                modoEdicion
                  ? 'Déjalo vacío para conservar la contraseña actual'
                  : `Mínimo ${PASSWORD_MIN_LENGTH} caracteres`
              }
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="estado"
                value={form.estado}
                label="Estado"
                onChange={handleChange}
                disabled={modoEdicion && esUsuarioSesion(id)}
              >
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
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
          Directorio de usuarios: {usuariosFiltrados.length} de {datos.length}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar usuario"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Rol</InputLabel>
              <Select value={filtroRol} label="Rol" onChange={(event) => setFiltroRol(event.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                {roles.map((rol) => {
                  const rolId = getRolId(rol);
                  if (rolId === undefined) return null;

                  return <MenuItem key={rolId} value={String(rolId)}>{getRolNombre(rol)}</MenuItem>;
                })}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select value={filtroEstado} label="Estado" onChange={(event) => setFiltroEstado(event.target.value)}>
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
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Username</strong></TableCell>
                <TableCell><strong>Nombre Completo</strong></TableCell>
                <TableCell><strong>Correo</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Rol</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {usuariosFiltrados.length > 0 ? (
                usuariosFiltrados.map((u) => {
                  const usuarioId = getUsuarioId(u);
                  const rolId = getUsuarioRolId(u);
                  const empId = getUsuarioEmpId(u);
                  const username = getUsuarioUsername(u);
                  const nombre = getUsuarioNombre(u);
                  const correo = getUsuarioCorreo(u);
                  const estado = getUsuarioEstado(u);
                  const esSesion = esUsuarioSesion(usuarioId);
                  const rolProtegido = !puedeGestionarRolId(rolId);

                  return (
                  <TableRow key={usuarioId ?? username} hover>
                    <TableCell>{usuarioId ?? '-'}</TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>{username || '-'}</Typography>
                      <Typography variant="caption" color="text.secondary">ID {usuarioId ?? '-'}</Typography>
                    </TableCell>
                    <TableCell>{nombre || '-'}</TableCell>
                    <TableCell>{correo || '-'}</TableCell>
                    <TableCell>{obtenerNombreEmpleadoPorId(empId)}</TableCell>
                    <TableCell>{obtenerNombreRol(rolId)}</TableCell>
                    <TableCell>{obtenerChipEstado(estado)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(u)}
                          disabled={usuarioId === undefined || (!esSesion && rolProtegido)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          disabled={usuarioId === undefined || esSesion || rolProtegido}
                          onClick={() => usuarioId !== undefined && handleEliminar(usuarioId)}
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
                  <TableCell colSpan={8} align="center">
                    No hay usuarios registrados
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

export default UsuarioCRUD;
