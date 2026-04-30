import { useEffect, useMemo, useState } from 'react';
import type { Marcaje, MarcajeForm } from '../interfaces/marcaje';
import type { Empleado } from '../interfaces/empleados';
import type { Horario } from '../interfaces/horario';

import {
  obtenerMarcajes,
  crearMarcaje,
  actualizarMarcaje,
  eliminarMarcaje
} from '../services/marcaje.service';

import { obtenerEmpleados } from '../services/empleados.service';
import { obtenerHorarios } from '../services/horario.service';

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  MenuItem
} from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import PeopleIcon from '@mui/icons-material/People';

const initialForm: MarcajeForm = {
  fecha: '',
  entrada: '',
  salida: '',
  horas_extra: '',
  estado: 'Normal',
  emp_id: ''
};

const ESTADOS = ['Normal', 'Retraso', 'Falta Justificada', 'Permiso'];

function MarcajeCRUD() {
  const [datos, setDatos] = useState<Marcaje[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoEmpleados, setCargandoEmpleados] = useState(false);
  const [, setCargandoHorarios] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [marcajeId, setMarcajeId] = useState<number | null>(null);
  const [form, setForm] = useState<MarcajeForm>(initialForm);
  const [modalEmpleados, setModalEmpleados] = useState(false);
  const [filtroEmpleado, setFiltroEmpleado] = useState('');
  const [empleadoNombre, setEmpleadoNombre] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerMarcajes();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando marcajes: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargando(false);
    }
  };

  const cargarEmpleados = async () => {
    try {
      setCargandoEmpleados(true);
      const data = await obtenerEmpleados();
      setEmpleados(data);
    } catch (err: any) {
      setError('Error cargando empleados: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargandoEmpleados(false);
    }
  };

  const cargarHorarios = async () => {
    try {
    const data = await obtenerHorarios();
    setHorarios(data);
  } catch (err: any) {
    setError('Error cargando horarios: ' + (err.response?.data?.error || err.message));
  }
};

  useEffect(() => {
    cargarDatos();
    cargarEmpleados();
    cargarHorarios();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setMarcajeId(null);
    setEmpleadoNombre('');
    setError('');
  };

  const abrirModalEmpleados = async () => {
    setModalEmpleados(true);
    setFiltroEmpleado('');

    if (empleados.length === 0) {
      await cargarEmpleados();
    }
  };

  const seleccionarEmpleado = (empleado: Empleado) => {
    const nombreCompleto = `${empleado.EMP_NOMBRE ?? ''} ${empleado.EMP_APELLIDO ?? ''}`.trim();
    setForm((prev) => ({ ...prev, emp_id: String(empleado.EMP_ID) }));
    setEmpleadoNombre(nombreCompleto || `Empleado #${empleado.EMP_ID}`);
    setModalEmpleados(false);
  };

  const empleadosFiltrados = empleados.filter((emp) => {
    const texto = filtroEmpleado.toLowerCase();
    const nombre = `${emp.EMP_NOMBRE ?? ''} ${emp.EMP_APELLIDO ?? ''}`.toLowerCase();

    return (
      nombre.includes(texto) ||
      String(emp.EMP_ID).includes(texto) ||
      String(emp.EMP_DPI ?? '').toLowerCase().includes(texto) ||
      String(emp.EMP_NIT ?? '').toLowerCase().includes(texto)
    );
  });

  const empleadoSeleccionado = useMemo(
    () => empleados.find((e) => String(e.EMP_ID) === String(form.emp_id)),
    [empleados, form.emp_id]
  );

  const horarioSeleccionado = useMemo(
    () => horarios.find((h) => h.HOR_ID === empleadoSeleccionado?.HOR_ID),
    [horarios, empleadoSeleccionado]
  );

  const resumen = useMemo(() => {
    if (!form.entrada || !form.salida) {
      return {
        horasTrabajadas: '—',
        horasProgramadas: '—',
        diferencia: '—'
      };
    }

    const entrada = new Date(form.entrada);
    const salida = new Date(form.salida);

    if (Number.isNaN(entrada.getTime()) || Number.isNaN(salida.getTime()) || salida <= entrada) {
      return {
        horasTrabajadas: '—',
        horasProgramadas: horarioSeleccionado ? calcularHorasProgramadasTexto(horarioSeleccionado) : '—',
        diferencia: '—'
      };
    }

    const minutosTrabajados = Math.round((salida.getTime() - entrada.getTime()) / 60000);
    const minutosProgramados = horarioSeleccionado
      ? calcularMinutosProgramados(horarioSeleccionado)
      : 0;

    const diferenciaMinutos = horarioSeleccionado
      ? minutosTrabajados - minutosProgramados
      : 0;

    return {
      horasTrabajadas: minutosATexto(minutosTrabajados),
      horasProgramadas: horarioSeleccionado ? minutosATexto(minutosProgramados) : '—',
      diferencia: horarioSeleccionado ? minutosConSignoATexto(diferenciaMinutos) : '—'
    };
  }, [form.entrada, form.salida, horarioSeleccionado]);

  const validarFormulario = () => {
    if (!form.fecha || !form.entrada || !form.salida || !form.emp_id) {
      setError('Fecha, entrada, salida y empleado son obligatorios');
      return false;
    }

    const entrada = new Date(form.entrada);
    const salida = new Date(form.salida);

    if (Number.isNaN(entrada.getTime()) || Number.isNaN(salida.getTime())) {
      setError('Las fechas de entrada y salida no son válidas');
      return false;
    }

    if (salida <= entrada) {
      setError('La hora de salida debe ser mayor que la hora de entrada');
      return false;
    }

    return true;
  };

  const guardarMarcaje = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && marcajeId !== null) {
        await actualizarMarcaje(marcajeId, form);
        setMensaje('Marcaje actualizado correctamente');
      } else {
        await crearMarcaje(form);
        setMensaje('Marcaje creado correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error guardando registro: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este registro de marcaje?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarMarcaje(id);
      setMensaje('Registro eliminado correctamente');

      if (marcajeId === id) limpiarFormulario();

      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando registro: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (m: Marcaje) => {
    setModoEdicion(true);
    setMarcajeId(m.MAR_ID);
    setMensaje('');
    setError('');

    const emp = empleados.find((e) => e.EMP_ID === m.EMP_ID);
    const nombreCompleto = emp
      ? `${emp.EMP_NOMBRE ?? ''} ${emp.EMP_APELLIDO ?? ''}`.trim()
      : '';

    setEmpleadoNombre(nombreCompleto || `Empleado #${m.EMP_ID}`);

    setForm({
      fecha: m.MAR_FECHA ? String(m.MAR_FECHA).substring(0, 10) : '',
      entrada: m.MAR_ENTRADA ? String(m.MAR_ENTRADA).substring(0, 16) : '',
      salida: m.MAR_SALIDA ? String(m.MAR_SALIDA).substring(0, 16) : '',
      horas_extra: m.MAR_HORAS_EXTRA?.toString() || '',
      estado: m.MAR_ESTADO || 'Normal',
      emp_id: m.EMP_ID?.toString() || ''
    });
  };

  const obtenerChipEstado = (estado: string) => {
    const colores: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
      Normal: 'success',
      Retraso: 'warning',
      'Falta Justificada': 'error',
      Permiso: 'info'
    };

    return (
      <Chip
        label={estado}
        color={colores[estado] ?? 'default'}
        size="small"
      />
    );
  };

  const formatearFecha = (valor?: string) =>
    valor ? new Date(valor).toLocaleDateString('es-GT') : '—';

  const formatearHora = (valor?: string) =>
    valor
      ? new Date(valor).toLocaleTimeString('es-GT', {
          hour: '2-digit',
          minute: '2-digit'
        })
      : '—';

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando marcajes...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AccessTimeIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Control de Asistencia (Marcajes)
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar marcaje' : 'Nuevo marcaje'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Empleado"
              value={empleadoNombre ? `#${form.emp_id} — ${empleadoNombre}` : ''}
              placeholder="Haz clic para seleccionar un empleado"
              onClick={abrirModalEmpleados}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={abrirModalEmpleados} edge="end">
                        <PeopleIcon color="primary" />
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
              label="Fecha Jornada"
              name="fecha"
              type="date"
              value={form.fecha}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Hora de Entrada"
              name="entrada"
              type="datetime-local"
              value={form.entrada}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Hora de Salida"
              name="salida"
              type="datetime-local"
              value={form.salida}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Horario del empleado"
              value={
                horarioSeleccionado
                  ? `${horarioSeleccionado.HOR_DESCRIPCION} (${horarioSeleccionado.HOR_HORA_INICIO} - ${horarioSeleccionado.HOR_HORA_FIN})`
                  : 'Sin horario asignado'
              }
              slotProps={{ input: { readOnly: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Horas trabajadas"
              value={resumen.horasTrabajadas}
              slotProps={{ input: { readOnly: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Diferencia vs horario"
              value={resumen.diferencia}
              slotProps={{ input: { readOnly: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Estado"
              name="estado"
              value={form.estado}
              onChange={handleChange}
            >
              {ESTADOS.map((e) => (
                <MenuItem key={e} value={e}>
                  {e}
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardarMarcaje}
              >
                {modoEdicion ? 'Actualizar' : 'Guardar Marcaje'}
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={<CleaningServicesIcon />}
                onClick={limpiarFormulario}
              >
                Cancelar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listado de marcajes: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Entrada</strong></TableCell>
                <TableCell><strong>Salida</strong></TableCell>
                <TableCell><strong>Diferencia</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((m) => (
                  <TableRow key={m.MAR_ID} hover>
                    <TableCell>{m.MAR_ID}</TableCell>
                    <TableCell>
                      {m.EMP_NOMBRE || m.EMP_APELLIDO
                        ? `${m.EMP_NOMBRE ?? ''} ${m.EMP_APELLIDO ?? ''}`.trim()
                        : `#${m.EMP_ID}`}
                    </TableCell>
                    <TableCell>{formatearFecha(m.MAR_FECHA)}</TableCell>
                    <TableCell>{formatearHora(m.MAR_ENTRADA)}</TableCell>
                    <TableCell>{formatearHora(m.MAR_SALIDA)}</TableCell>
                    <TableCell>{m.MAR_HORAS_EXTRA ?? '—'}</TableCell>
                    <TableCell>{obtenerChipEstado(m.MAR_ESTADO)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(m)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(m.MAR_ID)}
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
                    No hay marcajes registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog
        open={modalEmpleados}
        onClose={() => setModalEmpleados(false)}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon color="primary" />
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Seleccionar Empleado
            </Typography>
          </Box>
          <IconButton onClick={() => setModalEmpleados(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Buscar por ID, nombre, apellido, DPI o NIT..."
            value={filtroEmpleado}
            onChange={(e) => setFiltroEmpleado(e.target.value)}
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

          {cargandoEmpleados ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              Cargando empleados...
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Nombre</strong></TableCell>
                    <TableCell><strong>DPI</strong></TableCell>
                    <TableCell><strong>NIT</strong></TableCell>
                    <TableCell><strong>Horario</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {empleadosFiltrados.length > 0 ? (
                    empleadosFiltrados.map((emp) => {
                      const horario = horarios.find((h) => h.HOR_ID === emp.HOR_ID);

                      return (
                        <TableRow
                          key={emp.EMP_ID}
                          hover
                          onClick={() => seleccionarEmpleado(emp)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{emp.EMP_ID}</TableCell>
                          <TableCell>{`${emp.EMP_NOMBRE ?? ''} ${emp.EMP_APELLIDO ?? ''}`.trim()}</TableCell>
                          <TableCell>{emp.EMP_DPI}</TableCell>
                          <TableCell>{emp.EMP_NIT}</TableCell>
                          <TableCell>
                            {horario
                              ? `${horario.HOR_DESCRIPCION} (${horario.HOR_HORA_INICIO} - ${horario.HOR_HORA_FIN})`
                              : 'Sin horario'}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No se encontraron empleados
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

function calcularMinutosProgramados(horario: Horario): number {
  const [hi, mi] = horario.HOR_HORA_INICIO.split(':').map(Number);
  const [hf, mf] = horario.HOR_HORA_FIN.split(':').map(Number);

  let inicio = hi * 60 + mi;
  let fin = hf * 60 + mf;

  if (fin < inicio) {
    fin += 24 * 60;
  }

  return fin - inicio;
}

function minutosATexto(minutos: number): string {
  const signo = minutos < 0 ? '-' : '';
  const absoluto = Math.abs(minutos);
  const horas = Math.floor(absoluto / 60);
  const mins = absoluto % 60;
  return `${signo}${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function minutosConSignoATexto(minutos: number): string {
  return minutos > 0 ? `+${minutosATexto(minutos)}` : minutosATexto(minutos);
}

function calcularHorasProgramadasTexto(horario: Horario): string {
  return minutosATexto(calcularMinutosProgramados(horario));
}

export default MarcajeCRUD;
