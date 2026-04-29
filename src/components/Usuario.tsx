import { useEffect, useState } from 'react';
import type { Usuario, UsuarioForm } from '../interfaces/usuario';
import type { Rol } from '../interfaces/roles';
import type { Empleado } from '../interfaces/empleados';
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
} from '../services/usuario.service';
import { obtenerRoles } from '../services/roles.service';
import { obtenerEmpleados } from '../services/empleados.service';

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
      .filter((usuario) => usuario.id !== usuarioActualId)
      .map((usuario) => usuario.username.toLowerCase())
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
  const [datos, setDatos] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<UsuarioForm>(initialForm);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const [usuariosData, rolesData, empleadosData] = await Promise.all([
        obtenerUsuarios(),
        obtenerRoles(),
        obtenerEmpleados(),
      ]);
      setDatos(usuariosData);
      setRoles(rolesData);
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
      setForm((prev) => ({
        ...prev,
        [name]: value ? Number(value) : undefined,
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
    if (
      !form.username.trim() ||
      !form.nombre_completo.trim() ||
      !form.correo.trim() ||
      !form.password.trim() ||
      !form.estado.trim() ||
      !form.rol_id ||
      !form.emp_id
    ) {
      setError('Todos los campos son obligatorios, incluyendo empleado y rol');
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
        await actualizarUsuario(id, form);
        setMensaje('Usuario actualizado correctamente');
      } else {
        await crearUsuario(form);
        setMensaje('Usuario creado correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error guardando usuario: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (u: Usuario) => {
    setModoEdicion(true);
    setId(u.id);
    setMensaje('');
    setError('');
    setForm({
      username: u.username,
      nombre_completo: u.nombre_completo,
      correo: u.correo,
      password: u.password,
      estado: u.estado,
      rol_id: u.rol_id,
      emp_id: u.emp_id
    });
  };

  const handleEliminar = async (idEliminar: number) => {
    if (!window.confirm('¿Deseas eliminar este usuario?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarUsuario(idEliminar);
      setMensaje('Usuario eliminado correctamente');

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
    roles.find((rol) => rol.ROL_ID === rolId)?.ROL_NOMBRE ?? 'Sin rol';

  const obtenerNombreEmpleadoPorId = (empId?: number) =>
    empleados.find((empleado) => empleado.EMP_ID === empId)
      ? obtenerNombreEmpleado(empleados.find((empleado) => empleado.EMP_ID === empId)!)
      : 'Sin empleado';

  const empleadoAsignadoAOtroUsuario = (empId: number) =>
    datos.some((usuario) => usuario.emp_id === empId && usuario.id !== id);

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
              >
                {roles.map((rol) => (
                  <MenuItem key={rol.ROL_ID} value={String(rol.ROL_ID)}>
                    {rol.ROL_NOMBRE}
                  </MenuItem>
                ))}
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
              helperText="Se genera automaticamente desde el nombre completo"
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
              value={form.password}
              onChange={handleChange}
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
          Listado de usuarios: {datos.length}
        </Typography>

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
              {datos.length > 0 ? (
                datos.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.nombre_completo}</TableCell>
                    <TableCell>{u.correo}</TableCell>
                    <TableCell>{obtenerNombreEmpleadoPorId(u.emp_id)}</TableCell>
                    <TableCell>{obtenerNombreRol(u.rol_id)}</TableCell>
                    <TableCell>{obtenerChipEstado(u.estado)}</TableCell>
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
                          onClick={() => handleEliminar(u.id)}
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
