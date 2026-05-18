import { useEffect, useMemo, useState } from 'react';
import type { Permiso, PermisoForm } from '../interfaces/permisos';
import type { RolPermiso } from '../interfaces/rolPermisos';
import {
  crearPermiso,
  actualizarPermiso,
  eliminarPermiso
} from '../services/permisos.service';
import { obtenerAdminCatalogo } from '../services/admin.service';
import { obtenerEmpleados } from '../services/empleados.service';
import { useAuth } from '../context/AuthContext';
import { isRole } from '../auth/access';

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
import KeyIcon from '@mui/icons-material/Key';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import { suggestedPermissions } from '../config/permissionSuggestions';
import { getApiErrorMessage } from '../api/errors';

const initialForm: PermisoForm = {
  per_nombre_permiso: '',
  per_modulo: '',
  per_descripcion: ''
};

const MODULOS_PERMISO = ['ADMIN', 'AUDITORIA', 'RRHH', 'NOMINA', 'MARCAJE', 'REPORTES', 'GERENCIA', 'CONTABILIDAD'];

const normalizarNombrePermiso = (valor: string) =>
  valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
const normalizar = (valor: unknown) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const normalizarModulo = (valor: unknown) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

const getPermisoKey = (nombre: unknown, modulo: unknown) =>
  `${normalizarModulo(modulo)}::${normalizarNombrePermiso(String(nombre ?? ''))}`;

const esErrorDuplicado = (err: unknown) => {
  const message = getApiErrorMessage(err, '').toLowerCase();
  return message.includes('ya existe') || message.includes('duplicado');
};

function Permisos() {
  const authCtx = useAuth();
  const [datos, setDatos] = useState<Permiso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [permisoId, setPermisoId] = useState<number | null>(null);
  const [form, setForm] = useState<PermisoForm>(initialForm);
  const [rolPermisos, setRolPermisos] = useState<RolPermiso[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroModulo, setFiltroModulo] = useState('');

  const cargarPermisos = async () => {
    try {
      setCargando(true);
      setError('');
      const catalogo = await obtenerAdminCatalogo();
      setDatos(catalogo.permisos);
      setRolPermisos(catalogo.rolPermisos);

      // Cargar empleados filtrados si el usuario es supervisor de asistencia
      try {
        const auth = authCtx;
        if (auth && isRole(auth.user as any, 'SUPER\u005FVISOR_ASISTENCIA')) {
          const sed = (auth.user as any)?.SED_ID ?? (auth.user as any)?.sed_id ?? '';
          await obtenerEmpleados(sed ? { sed_id: String(sed) } : undefined);
        }
      } catch (e) {
        // no bloquear la carga de permisos si falla
      }
    } catch (err: any) {
      setError('Error cargando permisos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPermisos();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    if (modoEdicion && permisoAsignado && ['per_nombre_permiso', 'per_modulo'].includes(name as string)) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: name === 'per_nombre_permiso' ? normalizarNombrePermiso(value) : value,
    }));
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

    const permisoRepetido = datos.some(
      (permiso) =>
        permiso.PERMISOS_ID !== permisoId &&
        getPermisoKey(permiso.PER_NOMBRE_PERMISO, permiso.PER_MODULO) ===
          getPermisoKey(form.per_nombre_permiso, form.per_modulo)
    );

    if (permisoRepetido) {
      setError('Ya existe ese permiso para el modulo indicado');
      return false;
    }

    return true;
  };

  const guardarPermiso = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      const payload: PermisoForm = {
        per_nombre_permiso: normalizarNombrePermiso(form.per_nombre_permiso),
        per_modulo: form.per_modulo.trim(),
        per_descripcion: form.per_descripcion.trim(),
      };

      if (modoEdicion && permisoId !== null) {
        await actualizarPermiso(permisoId, payload);
        setMensaje('Permiso actualizado correctamente. Cierra sesión y vuelve a entrar para refrescar el menú.');
      } else {
        await crearPermiso(payload);
        setMensaje('Permiso creado correctamente. Cierra sesión y vuelve a entrar para refrescar el menú.');
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
        datos.map((permiso) => getPermisoKey(permiso.PER_NOMBRE_PERMISO, permiso.PER_MODULO))
      );

      const faltantes = suggestedPermissions.filter(
        (permiso) => !permisosExistentes.has(getPermisoKey(permiso.nombre, permiso.modulo))
      );

      if (faltantes.length === 0) {
        setMensaje('Todos los permisos sugeridos ya existen');
        return;
      }

      let creados = 0;
      let omitidos = 0;

      for (const permiso of faltantes) {
        try {
          await crearPermiso({
            per_nombre_permiso: permiso.nombre,
            per_modulo: permiso.modulo,
            per_descripcion: permiso.descripcion,
          });
          creados += 1;
        } catch (err) {
          if (!esErrorDuplicado(err)) throw err;
          omitidos += 1;
        }
      }

      const detalleOmitidos = omitidos ? ` Omitidos por existir: ${omitidos}.` : '';
      setMensaje(`Permisos sugeridos creados: ${creados}.${detalleOmitidos} Cierra sesión y vuelve a entrar para refrescar el menú.`);
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
    if (!window.confirm('¿Deseas inactivar este permiso?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarPermiso(id);
      setMensaje('Permiso inactivado correctamente. Cierra sesión y vuelve a entrar para refrescar el menú.');
      await cargarPermisos();
    } catch (err: any) {
      setError('Error eliminando permiso: ' + (err.response?.data?.error || err.message));
    }
  };

  const permisosFiltrados = useMemo(() => {
    const texto = normalizar(busqueda);

    return datos.filter((permiso) => {
      const contenido = normalizar(
        `${permiso.PER_NOMBRE_PERMISO} ${permiso.PER_MODULO} ${permiso.PER_DESCRIPCION}`
      );
      if (filtroModulo && permiso.PER_MODULO !== filtroModulo) return false;
      if (texto && !contenido.includes(texto)) return false;
      return true;
    });
  }, [busqueda, datos, filtroModulo]);

  const permisosPorModulo = useMemo(
    () =>
      MODULOS_PERMISO.map((modulo) => ({
        modulo,
        total: datos.filter((permiso) => permiso.PER_MODULO === modulo).length,
      })),
    [datos]
  );

  const permisosSugeridosPendientes = useMemo(() => {
    const existentes = new Set(
      datos.map((permiso) => getPermisoKey(permiso.PER_NOMBRE_PERMISO, permiso.PER_MODULO))
    );
    return suggestedPermissions.filter((permiso) => !existentes.has(getPermisoKey(permiso.nombre, permiso.modulo))).length;
  }, [datos]);

  const permisoAsignado = useMemo(
    () =>
      permisoId !== null &&
      rolPermisos.some(
        (item) =>
          String((item as unknown as Record<string, unknown>).PERMISOS_ID ?? item.PER_ID) === String(permisoId)
      ),
    [permisoId, rolPermisos]
  );

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
          Puedes crear permisos manualmente o generar el catálogo sugerido para los roles del sistema.
        </Alert>

        {modoEdicion && permisoAsignado && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Este permiso ya esta asignado a uno o mas roles. Solo puedes editar su descripcion.
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          <Chip label={`Total: ${datos.length}`} color="primary" />
          <Chip
            label={`Sugeridos pendientes: ${permisosSugeridosPendientes}`}
            color={permisosSugeridosPendientes ? 'warning' : 'success'}
          />
          {permisosPorModulo.map((item) => (
            <Chip key={item.modulo} label={`${item.modulo}: ${item.total}`} variant="outlined" />
          ))}
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre del Permiso"
              name="per_nombre_permiso"
              value={form.per_nombre_permiso}
              onChange={handleChange}
              disabled={modoEdicion && permisoAsignado}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Módulo</InputLabel>
              <Select
                name="per_modulo"
                value={form.per_modulo}
                label="Módulo"
                onChange={handleChange}
                disabled={modoEdicion && permisoAsignado}
              >
                {MODULOS_PERMISO.map((modulo) => (
                  <MenuItem key={modulo} value={modulo}>
                    {modulo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
          Catálogo de permisos: {permisosFiltrados.length} de {datos.length}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar permiso"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Módulo</InputLabel>
              <Select
                value={filtroModulo}
                label="Módulo"
                onChange={(event) => setFiltroModulo(event.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {MODULOS_PERMISO.map((modulo) => (
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
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Módulo</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {permisosFiltrados.length > 0 ? (
                permisosFiltrados.map((permiso) => (
                  <TableRow key={permiso.PERMISOS_ID} hover>
                    <TableCell>{permiso.PERMISOS_ID}</TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>{permiso.PER_NOMBRE_PERMISO}</TableCell>
                    <TableCell>
                      <Chip label={permiso.PER_MODULO} size="small" color="info" />
                    </TableCell>
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
                          Inactivar
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
