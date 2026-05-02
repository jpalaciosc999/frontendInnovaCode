import { useEffect, useMemo, useState } from 'react';
import type { Empleado, EmpleadoForm } from '../interfaces/empleados';
import type { Departamento } from '../interfaces/departamentos';
import type { Horario } from '../interfaces/horario';

import {
  obtenerEmpleados,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado
} from '../services/empleados.service';

import { obtenerDepartamentos } from '../services/departamentos.service';
import { obtenerHorarios } from '../services/horario.service';

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
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
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import ScheduleIcon from '@mui/icons-material/Schedule';

const initialForm: EmpleadoForm = {
  emp_nombre: '',
  emp_apellido: '',
  emp_dpi: '',
  emp_nit: '',
  emp_telefono: '',
  emp_fecha_contratacion: '',
  emp_estado: '',
  dep_id: '',
  hor_id: ''
};

const initialFilters = {
  busqueda: '',
  estado: '',
  depId: '',
  horId: ''
};

function PruebaAxios() {
  const [datos, setDatos] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [empleadoId, setEmpleadoId] = useState<number | null>(null);
  const [form, setForm] = useState<EmpleadoForm>(initialForm);

  const [depNombre, setDepNombre] = useState('');
  const [horNombre, setHorNombre] = useState('');

  const [modalDepartamentos, setModalDepartamentos] = useState(false);
  const [modalHorarios, setModalHorarios] = useState(false);

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);

  const [cargandoDeps, setCargandoDeps] = useState(false);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);

  const [filtroDep, setFiltroDep] = useState('');
  const [filtroHor, setFiltroHor] = useState('');
  const [filters, setFilters] = useState(initialFilters);

  const cargarEmpleados = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerEmpleados();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando empleados: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargando(false);
    }
  };

  const cargarDepartamentos = async () => {
    try {
      setCargandoDeps(true);
      const data = await obtenerDepartamentos();
      setDepartamentos(data);
    } catch (err: any) {
      setError('Error cargando departamentos: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargandoDeps(false);
    }
  };

  const cargarHorarios = async () => {
    try {
      setCargandoHorarios(true);
      const data = await obtenerHorarios();
      setHorarios(data);
    } catch (err: any) {
      setError('Error cargando horarios: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargandoHorarios(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
    cargarDepartamentos();
    cargarHorarios();
  }, []);

  const abrirModalDepartamentos = async () => {
    setModalDepartamentos(true);
    setFiltroDep('');
    if (departamentos.length === 0) {
      await cargarDepartamentos();
    }
  };

  const abrirModalHorarios = async () => {
    setModalHorarios(true);
    setFiltroHor('');
    if (horarios.length === 0) {
      await cargarHorarios();
    }
  };

  const seleccionarDepartamento = (dep: Departamento) => {
    setForm((prev) => ({ ...prev, dep_id: String(dep.DEP_ID) }));
    setDepNombre(dep.DEP_NOMBRE);
    setModalDepartamentos(false);
  };

  const seleccionarHorario = (hor: Horario) => {
    setForm((prev) => ({ ...prev, hor_id: String(hor.HOR_ID) }));
    setHorNombre(hor.HOR_DESCRIPCION);
    setModalHorarios(false);
  };

  const departamentosFiltrados = departamentos.filter((dep) => {
    const texto = filtroDep.toLowerCase();
    return (
      dep.DEP_NOMBRE.toLowerCase().includes(texto) ||
      (dep.DEP_DESCRIPCION ?? '').toLowerCase().includes(texto) ||
      String(dep.DEP_ID).includes(texto)
    );
  });

  const horariosFiltrados = horarios.filter((hor) => {
    const texto = filtroHor.toLowerCase();
    return (
      hor.HOR_DESCRIPCION.toLowerCase().includes(texto) ||
      hor.HOR_HORA_INICIO.toLowerCase().includes(texto) ||
      hor.HOR_HORA_FIN.toLowerCase().includes(texto) ||
      String(hor.HOR_ID).includes(texto)
    );
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name as string]: value }));
  };

  const limpiarFiltros = () => {
    setFilters(initialFilters);
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setDepNombre('');
    setHorNombre('');
    setModoEdicion(false);
    setEmpleadoId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (
      !form.emp_nombre.trim() ||
      !form.emp_apellido.trim() ||
      !form.emp_dpi.trim() ||
      !form.emp_nit.trim() ||
      !form.emp_telefono.trim() ||
      !form.emp_fecha_contratacion.trim() ||
      !form.emp_estado.trim() ||
      !form.dep_id ||
      !form.hor_id
    ) {
      setError('Todos los campos son obligatorios, incluyendo departamento y horario');
      return false;
    }
    return true;
  };

  const guardarEmpleado = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && empleadoId !== null) {
        await actualizarEmpleado(empleadoId, form);
        setMensaje('Empleado actualizado correctamente');
      } else {
        await crearEmpleado(form);
        setMensaje('Empleado creado correctamente');
      }

      limpiarFormulario();
      await cargarEmpleados();
    } catch (err: any) {
      setError('Error guardando empleado: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este empleado?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarEmpleado(id);
      setMensaje('Empleado eliminado correctamente');

      if (empleadoId === id) limpiarFormulario();

      await cargarEmpleados();
    } catch (err: any) {
      setError('Error eliminando empleado: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (empleado: Empleado) => {
    setModoEdicion(true);
    setEmpleadoId(empleado.EMP_ID);
    setMensaje('');
    setError('');

    const dep = departamentos.find((d) => d.DEP_ID === empleado.DEP_ID);
    const hor = horarios.find((h) => h.HOR_ID === empleado.HOR_ID);

    setDepNombre(dep ? dep.DEP_NOMBRE : empleado.DEP_ID ? `Departamento #${empleado.DEP_ID}` : '');
    setHorNombre(hor ? hor.HOR_DESCRIPCION : empleado.HOR_ID ? `Horario #${empleado.HOR_ID}` : '');

    setForm({
      emp_nombre: empleado.EMP_NOMBRE || '',
      emp_apellido: empleado.EMP_APELLIDO || '',
      emp_dpi: String(empleado.EMP_DPI || ''),
      emp_nit: String(empleado.EMP_NIT || ''),
      emp_telefono: String(empleado.EMP_TELEFONO || ''),
      emp_fecha_contratacion: empleado.EMP_FECHA_CONTRATACION
        ? String(empleado.EMP_FECHA_CONTRATACION).slice(0, 10)
        : '',
      emp_estado: empleado.EMP_ESTADO || '',
      dep_id: String(empleado.DEP_ID || ''),
      hor_id: String(empleado.HOR_ID || '')
    });
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'A') return <Chip label="Activo" color="success" size="small" />;
    if (estado === 'I') return <Chip label="Inactivo" color="default" size="small" />;
    return <Chip label={estado || 'Sin estado'} size="small" />;
  };

  const obtenerChipDep = (depId: number) => {
    const dep = departamentos.find((d) => d.DEP_ID === depId);
    return (
      <Chip
        label={dep ? dep.DEP_NOMBRE : `Dep. #${depId}`}
        color="info"
        size="small"
        icon={<BusinessIcon />}
      />
    );
  };

  const obtenerChipHorario = (horId: number) => {
    const hor = horarios.find((h) => h.HOR_ID === horId);
    return (
      <Chip
        label={hor ? hor.HOR_DESCRIPCION : `Horario #${horId}`}
        color="secondary"
        size="small"
        icon={<ScheduleIcon />}
      />
    );
  };

  const diasTexto = (hor: Horario) => {
    const dias: string[] = [];
    if (hor.HOR_LUNES) dias.push('Lun');
    if (hor.HOR_MARTES) dias.push('Mar');
    if (hor.HOR_MIERCOLES) dias.push('Mié');
    if (hor.HOR_JUEVES) dias.push('Jue');
    if (hor.HOR_VIERNES) dias.push('Vie');
    if (hor.HOR_SABADO) dias.push('Sáb');
    if (hor.HOR_DOMINGO) dias.push('Dom');
    return dias.join(', ');
  };

  const empleadosFiltrados = useMemo(() => {
    const texto = filters.busqueda.trim().toLowerCase();

    return datos.filter((empleado) => {
      const nombreCompleto = `${empleado.EMP_NOMBRE ?? ''} ${empleado.EMP_APELLIDO ?? ''}`.toLowerCase();
      const identificadores = `${empleado.EMP_ID} ${empleado.EMP_DPI ?? ''} ${empleado.EMP_NIT ?? ''}`.toLowerCase();

      if (texto && !nombreCompleto.includes(texto) && !identificadores.includes(texto)) return false;
      if (filters.estado && empleado.EMP_ESTADO !== filters.estado) return false;
      if (filters.depId && String(empleado.DEP_ID ?? '') !== filters.depId) return false;
      if (filters.horId && String(empleado.HOR_ID ?? '') !== filters.horId) return false;

      return true;
    });
  }, [datos, filters]);

  const empleadosActivos = datos.filter((empleado) => empleado.EMP_ESTADO === 'A').length;
  const empleadosSinDepartamento = datos.filter((empleado) => !empleado.DEP_ID).length;
  const empleadosSinHorario = datos.filter((empleado) => !empleado.HOR_ID).length;

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando empleados...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <PeopleIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            CRUD de Empleados
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar empleado' : 'Nuevo empleado'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre"
              name="emp_nombre"
              value={form.emp_nombre}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Apellido"
              name="emp_apellido"
              value={form.emp_apellido}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="DPI"
              name="emp_dpi"
              value={form.emp_dpi}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="NIT"
              name="emp_nit"
              value={form.emp_nit}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Teléfono"
              name="emp_telefono"
              value={form.emp_telefono}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha de contratación"
              name="emp_fecha_contratacion"
              type="date"
              value={form.emp_fecha_contratacion}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel>Estado</InputLabel>
              <Select
                name="emp_estado"
                value={form.emp_estado}
                label="Estado"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione estado</MenuItem>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Departamento"
              value={depNombre ? `#${form.dep_id} — ${depNombre}` : ''}
              placeholder="Haz clic para seleccionar un departamento"
              onClick={abrirModalDepartamentos}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={abrirModalDepartamentos} edge="end">
                        <BusinessIcon color="primary" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { cursor: 'pointer' }
                }
              }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Horario"
              value={horNombre ? `#${form.hor_id} — ${horNombre}` : ''}
              placeholder="Haz clic para seleccionar un horario"
              onClick={abrirModalHorarios}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={abrirModalHorarios} edge="end">
                        <ScheduleIcon color="primary" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { cursor: 'pointer' }
                }
              }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarEmpleado}>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 2 }}>
          <Typography variant="h6">
            Listado de empleados: {empleadosFiltrados.length} de {datos.length}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`Activos: ${empleadosActivos}`} color="success" size="small" />
            <Chip label={`Sin depto: ${empleadosSinDepartamento}`} color="warning" size="small" />
            <Chip label={`Sin horario: ${empleadosSinHorario}`} color="warning" size="small" />
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar"
              name="busqueda"
              value={filters.busqueda}
              onChange={handleFilterChange}
              placeholder="Nombre, DPI, NIT o ID"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  )
                }
              }}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select name="estado" value={filters.estado} label="Estado" onChange={handleFilterChange}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Departamento</InputLabel>
              <Select name="depId" value={filters.depId} label="Departamento" onChange={handleFilterChange}>
                <MenuItem value="">Todos</MenuItem>
                {departamentos.map((dep) => (
                  <MenuItem key={dep.DEP_ID} value={String(dep.DEP_ID)}>{dep.DEP_NOMBRE}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Horario</InputLabel>
              <Select name="horId" value={filters.horId} label="Horario" onChange={handleFilterChange}>
                <MenuItem value="">Todos</MenuItem>
                {horarios.map((hor) => (
                  <MenuItem key={hor.HOR_ID} value={String(hor.HOR_ID)}>{hor.HOR_DESCRIPCION}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 1 }}>
            <Button fullWidth variant="outlined" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          </Grid>
        </Grid>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Apellido</strong></TableCell>
                <TableCell><strong>DPI</strong></TableCell>
                <TableCell><strong>NIT</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell><strong>F. Contratación</strong></TableCell>
                <TableCell><strong>Departamento</strong></TableCell>
                <TableCell><strong>Horario</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {empleadosFiltrados.length > 0 ? (
                empleadosFiltrados.map((empleado) => (
                  <TableRow key={empleado.EMP_ID} hover>
                    <TableCell>{empleado.EMP_ID}</TableCell>
                    <TableCell>{empleado.EMP_NOMBRE}</TableCell>
                    <TableCell>{empleado.EMP_APELLIDO}</TableCell>
                    <TableCell>{empleado.EMP_DPI}</TableCell>
                    <TableCell>{empleado.EMP_NIT}</TableCell>
                    <TableCell>{empleado.EMP_TELEFONO}</TableCell>
                    <TableCell>
                      {empleado.EMP_FECHA_CONTRATACION
                        ? String(empleado.EMP_FECHA_CONTRATACION).slice(0, 10)
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {empleado.DEP_ID ? obtenerChipDep(empleado.DEP_ID) : '—'}
                    </TableCell>
                    <TableCell>
                      {empleado.HOR_ID ? obtenerChipHorario(empleado.HOR_ID) : '—'}
                    </TableCell>
                    <TableCell>{obtenerChipEstado(empleado.EMP_ESTADO)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(empleado)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(empleado.EMP_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center">
                    No hay empleados con esos filtros
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={modalDepartamentos}
        onClose={() => setModalDepartamentos(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Seleccionar Departamento
            </Typography>
          </Box>
          <IconButton onClick={() => setModalDepartamentos(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Buscar por nombre, descripción o ID..."
            value={filtroDep}
            onChange={(e) => setFiltroDep(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }
            }}
          />

          {cargandoDeps ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              Cargando departamentos...
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Nombre</strong></TableCell>
                    <TableCell><strong>Descripción</strong></TableCell>
                    <TableCell><strong>Estado</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departamentosFiltrados.length > 0 ? (
                    departamentosFiltrados.map((dep) => (
                      <TableRow
                        key={dep.DEP_ID}
                        hover
                        onClick={() => seleccionarDepartamento(dep)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{dep.DEP_ID}</TableCell>
                        <TableCell>{dep.DEP_NOMBRE}</TableCell>
                        <TableCell>{dep.DEP_DESCRIPCION || '—'}</TableCell>
                        <TableCell>
                          <Chip
                            label={dep.DEP_ESTADO === 'A' ? 'Activo' : 'Inactivo'}
                            color={dep.DEP_ESTADO === 'A' ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No se encontraron departamentos
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={modalHorarios}
        onClose={() => setModalHorarios(false)}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ScheduleIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Seleccionar Horario
            </Typography>
          </Box>
          <IconButton onClick={() => setModalHorarios(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Buscar por descripción, horario o ID..."
            value={filtroHor}
            onChange={(e) => setFiltroHor(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }
            }}
          />

          {cargandoHorarios ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              Cargando horarios...
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Descripción</strong></TableCell>
                    <TableCell><strong>Hora inicio</strong></TableCell>
                    <TableCell><strong>Hora fin</strong></TableCell>
                    <TableCell><strong>Días</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {horariosFiltrados.length > 0 ? (
                    horariosFiltrados.map((hor) => (
                      <TableRow
                        key={hor.HOR_ID}
                        hover
                        onClick={() => seleccionarHorario(hor)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{hor.HOR_ID}</TableCell>
                        <TableCell>{hor.HOR_DESCRIPCION}</TableCell>
                        <TableCell>{hor.HOR_HORA_INICIO}</TableCell>
                        <TableCell>{hor.HOR_HORA_FIN}</TableCell>
                        <TableCell>{diasTexto(hor)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No se encontraron horarios
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

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

export default PruebaAxios;
