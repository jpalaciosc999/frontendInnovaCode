import { useEffect, useMemo, useState } from 'react';
import type { Empleado, EmpleadoForm } from '../interfaces/empleados';
import type { Horario } from '../interfaces/horario';
import type { Puesto } from '../interfaces/puestos';
import type { Sede } from '../interfaces/sede';

import {
  obtenerEmpleados,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado
} from '../services/empleados.service';

import { obtenerHorarios } from '../services/horario.service';
import { obtenerPuestos } from '../services/puestos.service';
import { obtenerSedes } from '../services/sede.service';

import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
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
import ApartmentIcon from '@mui/icons-material/Apartment';
import BadgeIcon from '@mui/icons-material/Badge';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';

const initialForm: EmpleadoForm = {
  emp_nombre: '',
  emp_apellido: '',
  emp_dpi: '',
  emp_nit: '',
  emp_telefono: '',
  emp_fecha_contratacion: '',
  emp_estado: '',
  hor_id: '',
  sed_id: '',
  pue_id: '',
  emp_sueldo: '',
  emp_foto: ''
};

const initialFilters = {
  busqueda: '',
  estado: '',
  horId: '',
  sedId: '',
  pueId: ''
};

function PruebaAxios() {
  const [datos, setDatos] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [empleadoId, setEmpleadoId] = useState<number | null>(null);
  const [form, setForm] = useState<EmpleadoForm>(initialForm);

  const [horNombre, setHorNombre] = useState('');

  const [modalHorarios, setModalHorarios] = useState(false);

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [sedes, setSedes] = useState<Sede[]>([]);

  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [cargandoPuestos, setCargandoPuestos] = useState(false);
  const [cargandoSedes, setCargandoSedes] = useState(false);

  const [filtroHor, setFiltroHor] = useState('');
  const [filters, setFilters] = useState(initialFilters);
  const [perfilEmpleado, setPerfilEmpleado] = useState<Empleado | null>(null);
  const modalDepartamentos = false;
  const setModalDepartamentos = (_open: boolean) => {};
  const filtroDep = '';
  const setFiltroDep = (_value: string) => {};
  const cargandoDeps = false;
  const departamentosFiltrados: any[] = [];
  const seleccionarDepartamento = (_dep: any) => {};

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

  const cargarPuestos = async () => {
    try {
      setCargandoPuestos(true);
      const data = await obtenerPuestos();
      setPuestos(data);
    } catch (err: any) {
      setError('Error cargando puestos: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargandoPuestos(false);
    }
  };

  const cargarSedes = async () => {
    try {
      setCargandoSedes(true);
      const data = await obtenerSedes();
      setSedes(data);
    } catch (err: any) {
      setError('Error cargando sedes: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargandoSedes(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
    cargarHorarios();
    cargarPuestos();
    cargarSedes();
  }, []);

  const abrirModalHorarios = async () => {
    setModalHorarios(true);
    setFiltroHor('');
    if (horarios.length === 0) {
      await cargarHorarios();
    }
  };

  const seleccionarHorario = (hor: Horario) => {
    setForm((prev) => ({ ...prev, hor_id: String(hor.HOR_ID) }));
    setHorNombre(hor.HOR_DESCRIPCION);
    setModalHorarios(false);
  };

  const obtenerPuestoEmpleado = (empleado: Empleado) =>
    puestos.find((puesto) => puesto.PUE_ID === empleado.PUE_ID);

  const obtenerDepartamentoPuesto = (pueId: number | string | undefined) => {
    const puesto = puestos.find((item) => String(item.PUE_ID) === String(pueId));
    return puesto?.DEP_ID ? `Departamento #${puesto.DEP_ID}` : 'Sin departamento asignado';
  };

  const formatearMoneda = (valor: number | string | undefined) => {
    const numero = Number(valor || 0);
    if (!numero) return 'Q0.00';

    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ'
    }).format(numero);
  };

  const obtenerSueldoEmpleado = (empleado: Empleado) =>
    empleado.EMP_SUELDO ?? obtenerPuestoEmpleado(empleado)?.PUE_SALARIO_BASE ?? 0;

  const obtenerFotoEmpleado = (empleado: Empleado) => empleado.EMP_FOTO || '';

  const obtenerInicialesEmpleado = (empleado: Pick<Empleado, 'EMP_NOMBRE' | 'EMP_APELLIDO'>) =>
    `${empleado.EMP_NOMBRE?.[0] ?? ''}${empleado.EMP_APELLIDO?.[0] ?? ''}`.toUpperCase() || 'E';

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen valido');
      return;
    }

    if (archivo.size < 100 * 1024 || archivo.size > 300 * 1024) {
      setError('La foto debe pesar entre 100 KB y 300 KB');
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      setForm((prev) => ({ ...prev, emp_foto: String(lector.result || '') }));
    };
    lector.onerror = () => setError('No se pudo cargar la foto seleccionada');
    lector.readAsDataURL(archivo);
  };

  const quitarFoto = () => {
    setForm((prev) => ({ ...prev, emp_foto: '' }));
  };

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
    if (name === 'pue_id') {
      const puesto = puestos.find((item) => String(item.PUE_ID) === String(value));
      setForm((prev) => ({
        ...prev,
        pue_id: value,
        dep_id: puesto?.DEP_ID ? String(puesto.DEP_ID) : '',
        emp_sueldo: puesto ? String(puesto.PUE_SALARIO_BASE) : prev.emp_sueldo
      }));
      return;
    }

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
      !form.hor_id ||
      !form.sed_id ||
      !form.pue_id ||
      !form.emp_sueldo
    ) {
      setError('Todos los campos son obligatorios, incluyendo horario, sede, puesto y sueldo');
      return false;
    }

    if (Number(form.emp_sueldo) <= 0) {
      setError('El sueldo debe ser mayor a 0');
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

    const hor = horarios.find((h) => h.HOR_ID === empleado.HOR_ID);

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
      dep_id: String(empleado.DEP_ID || obtenerPuestoEmpleado(empleado)?.DEP_ID || ''),
      hor_id: String(empleado.HOR_ID || ''),
      sed_id: String(empleado.SED_ID || ''),
      pue_id: String(empleado.PUE_ID || ''),
      emp_sueldo: String(empleado.EMP_SUELDO ?? obtenerPuestoEmpleado(empleado)?.PUE_SALARIO_BASE ?? ''),
      emp_foto: empleado.EMP_FOTO || ''
    });
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'A') return <Chip label="Activo" color="success" size="small" />;
    if (estado === 'I') return <Chip label="Inactivo" color="default" size="small" />;
    return <Chip label={estado || 'Sin estado'} size="small" />;
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

  const obtenerChipSede = (sedId: number) => {
    const sede = sedes.find((s) => s.SED_ID === sedId);
    return (
      <Chip
        label={sede ? sede.SED_NOMBRE : `Sede #${sedId}`}
        color="primary"
        size="small"
        icon={<ApartmentIcon />}
      />
    );
  };

  const obtenerChipPuesto = (pueId: number) => {
    const puesto = puestos.find((p) => p.PUE_ID === pueId);
    return (
      <Chip
        label={puesto ? puesto.PUE_NOMBRE : `Puesto #${pueId}`}
        color="default"
        size="small"
        icon={<BadgeIcon />}
      />
    );
  };

  const empleadosFiltrados = useMemo(() => {
    const texto = filters.busqueda.trim().toLowerCase();

    return datos.filter((empleado) => {
      const nombreCompleto = `${empleado.EMP_NOMBRE ?? ''} ${empleado.EMP_APELLIDO ?? ''}`.toLowerCase();
      const identificadores = `${empleado.EMP_ID} ${empleado.EMP_DPI ?? ''} ${empleado.EMP_NIT ?? ''}`.toLowerCase();

      if (texto && !nombreCompleto.includes(texto) && !identificadores.includes(texto)) return false;
      if (filters.estado && empleado.EMP_ESTADO !== filters.estado) return false;
      if (filters.horId && String(empleado.HOR_ID ?? '') !== filters.horId) return false;
      if (filters.sedId && String(empleado.SED_ID ?? '') !== filters.sedId) return false;
      if (filters.pueId && String(empleado.PUE_ID ?? '') !== filters.pueId) return false;

      return true;
    });
  }, [datos, filters]);

  const empleadosActivos = datos.filter((empleado) => empleado.EMP_ESTADO === 'A').length;
  const empleadosSinHorario = datos.filter((empleado) => !empleado.HOR_ID).length;
  const empleadosSinSede = datos.filter((empleado) => !empleado.SED_ID).length;
  const empleadosSinPuesto = datos.filter((empleado) => !empleado.PUE_ID).length;

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
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Avatar
                src={form.emp_foto || undefined}
                sx={{ width: 88, height: 88, bgcolor: 'primary.main', fontSize: 28 }}
              >
                {(form.emp_nombre?.[0] ?? '') + (form.emp_apellido?.[0] ?? '')}
              </Avatar>

              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<PhotoCameraIcon />}
                >
                  Agregar foto
                  <input
                    hidden
                    accept="image/*"
                    type="file"
                    onChange={handleFotoChange}
                  />
                </Button>
                {form.emp_foto && (
                  <Button color="secondary" onClick={quitarFoto} sx={{ ml: 1 }}>
                    Quitar
                  </Button>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
                  JPG, PNG o WEBP. Entre 100 KB y 300 KB.
                </Typography>
              </Box>
            </Box>
          </Grid>

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

          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'none' }}>
            <TextField
              fullWidth
              label="Departamento"
              value=""
              placeholder="Haz clic para seleccionar un departamento"
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton edge="end">
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

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required disabled={cargandoSedes}>
              <InputLabel>Sede</InputLabel>
              <Select
                name="sed_id"
                value={form.sed_id}
                label="Sede"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione sede</MenuItem>
                {sedes.map((sede) => (
                  <MenuItem key={sede.SED_ID} value={String(sede.SED_ID)}>
                    {sede.SED_NOMBRE} - {sede.SED_MUNICIPIO}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required disabled={cargandoPuestos}>
              <InputLabel>Puesto</InputLabel>
              <Select
                name="pue_id"
                value={form.pue_id}
                label="Puesto"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione puesto</MenuItem>
                {puestos.map((puesto) => (
                  <MenuItem key={puesto.PUE_ID} value={String(puesto.PUE_ID)}>
                    {puesto.PUE_NOMBRE} - {formatearMoneda(puesto.PUE_SALARIO_BASE)} / {obtenerDepartamentoPuesto(puesto.PUE_ID)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Departamento del puesto"
              value={form.pue_id ? obtenerDepartamentoPuesto(form.pue_id) : ''}
              placeholder="Se completa al seleccionar puesto"
              slotProps={{ input: { readOnly: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Sueldo"
              name="emp_sueldo"
              type="number"
              value={form.emp_sueldo}
              onChange={handleChange}
              helperText="Se llena con el sueldo base del puesto, pero puedes modificarlo para este empleado"
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">Q</InputAdornment>,
                  inputProps: { min: 0, step: '0.01' }
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
            <Chip label={`Sin horario: ${empleadosSinHorario}`} color="warning" size="small" />
            <Chip label={`Sin sede: ${empleadosSinSede}`} color="warning" size="small" />
            <Chip label={`Sin puesto: ${empleadosSinPuesto}`} color="warning" size="small" />
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
          <Grid size={{ xs: 12, md: 2 }}>
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
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Sede</InputLabel>
              <Select name="sedId" value={filters.sedId} label="Sede" onChange={handleFilterChange}>
                <MenuItem value="">Todas</MenuItem>
                {sedes.map((sede) => (
                  <MenuItem key={sede.SED_ID} value={String(sede.SED_ID)}>{sede.SED_NOMBRE}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Puesto</InputLabel>
              <Select name="pueId" value={filters.pueId} label="Puesto" onChange={handleFilterChange}>
                <MenuItem value="">Todos</MenuItem>
                {puestos.map((puesto) => (
                  <MenuItem key={puesto.PUE_ID} value={String(puesto.PUE_ID)}>{puesto.PUE_NOMBRE}</MenuItem>
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
                <TableCell><strong>Foto</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Apellido</strong></TableCell>
                <TableCell><strong>DPI</strong></TableCell>
                <TableCell><strong>NIT</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell><strong>F. Contratación</strong></TableCell>
                <TableCell><strong>Horario</strong></TableCell>
                <TableCell><strong>Sede</strong></TableCell>
                <TableCell><strong>Puesto</strong></TableCell>
                <TableCell><strong>Sueldo</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {empleadosFiltrados.length > 0 ? (
                empleadosFiltrados.map((empleado) => (
                  <TableRow key={empleado.EMP_ID} hover>
                    <TableCell>{empleado.EMP_ID}</TableCell>
                    <TableCell>
                      <Avatar
                        src={obtenerFotoEmpleado(empleado) || undefined}
                        sx={{ width: 36, height: 36, bgcolor: 'primary.main' }}
                      >
                        {obtenerInicialesEmpleado(empleado)}
                      </Avatar>
                    </TableCell>
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
                      {empleado.HOR_ID ? obtenerChipHorario(empleado.HOR_ID) : '—'}
                    </TableCell>
                    <TableCell>
                      {empleado.SED_ID ? obtenerChipSede(empleado.SED_ID) : '—'}
                    </TableCell>
                    <TableCell>
                      {empleado.PUE_ID ? obtenerChipPuesto(empleado.PUE_ID) : '—'}
                    </TableCell>
                    <TableCell>{formatearMoneda(obtenerSueldoEmpleado(empleado))}</TableCell>
                    <TableCell>{obtenerChipEstado(empleado.EMP_ESTADO)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="info"
                          startIcon={<VisibilityIcon />}
                          onClick={() => setPerfilEmpleado(empleado)}
                        >
                          Perfil
                        </Button>

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
                  <TableCell colSpan={14} align="center">
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

      <Dialog
        open={!!perfilEmpleado}
        onClose={() => setPerfilEmpleado(null)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Perfil del empleado
            </Typography>
          </Box>
          <IconButton onClick={() => setPerfilEmpleado(null)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {perfilEmpleado && (
          <DialogContent sx={{ pt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', minWidth: 0 }}>
                <Avatar
                  src={obtenerFotoEmpleado(perfilEmpleado) || undefined}
                  sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: 24, flexShrink: 0 }}
                >
                  {obtenerInicialesEmpleado(perfilEmpleado)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  {perfilEmpleado.EMP_NOMBRE} {perfilEmpleado.EMP_APELLIDO}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID {perfilEmpleado.EMP_ID} / DPI {perfilEmpleado.EMP_DPI}
                </Typography>
                </Box>
              </Box>
              {obtenerChipEstado(perfilEmpleado.EMP_ESTADO)}
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">NIT</Typography>
                <Typography>{perfilEmpleado.EMP_NIT || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Teléfono</Typography>
                <Typography>{perfilEmpleado.EMP_TELEFONO || '—'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Fecha de contratación</Typography>
                <Typography>
                  {perfilEmpleado.EMP_FECHA_CONTRATACION
                    ? String(perfilEmpleado.EMP_FECHA_CONTRATACION).slice(0, 10)
                    : '—'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Sueldo</Typography>
                <Typography sx={{ fontWeight: 700 }}>
                  {formatearMoneda(obtenerSueldoEmpleado(perfilEmpleado))}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Departamento del puesto</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {perfilEmpleado.PUE_ID ? obtenerDepartamentoPuesto(perfilEmpleado.PUE_ID) : '—'}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Horario</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {perfilEmpleado.HOR_ID ? obtenerChipHorario(perfilEmpleado.HOR_ID) : '—'}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Sede</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {perfilEmpleado.SED_ID ? obtenerChipSede(perfilEmpleado.SED_ID) : '—'}
                </Box>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">Puesto</Typography>
                <Box sx={{ mt: 0.5 }}>
                  {perfilEmpleado.PUE_ID ? obtenerChipPuesto(perfilEmpleado.PUE_ID) : '—'}
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => {
                  handleEditar(perfilEmpleado);
                  setPerfilEmpleado(null);
                }}
              >
                Editar
              </Button>
              <Button variant="contained" onClick={() => setPerfilEmpleado(null)}>
                Cerrar
              </Button>
            </Box>
          </DialogContent>
        )}
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
