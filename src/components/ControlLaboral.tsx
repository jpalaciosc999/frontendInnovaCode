import { useEffect, useMemo, useState } from 'react';
import type { ControlLaboral, ControlLaboralForm } from '../interfaces/controlLaboral';
import type { Empleado } from '../interfaces/empleados';
import {
  obtenerControles,
  crearControl,
  actualizarControl,
  eliminarControl
} from '../services/controlLaboral.service';
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
  Typography,
  Tooltip
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const getToday = () => new Date().toISOString().slice(0, 10);
const VACATION_DAYS_PER_YEAR = 15;
const WORK_HOURS_PER_DAY = 8;

const initialForm: ControlLaboralForm = {
  ctl_fecha_inicio: '',
  ctl_fecha_regreso: '',
  ctl_motivo: '',
  ctl_horas: '',
  ctl_descripcion: '',
  ctl_estado: '',
  ctl_fecha_registro: getToday(),
  emp_id: ''
};

const initialFilters = {
  empleado: '',
  motivo: '',
  estado: '',
  fechaInicio: '',
  fechaFin: ''
};

const motivoLabels: Record<string, string> = {
  VAC: 'Vacaciones',
  PER: 'Permiso',
  ENF: 'Enfermedad',
  SUS: 'Suspension',
  OTR: 'Otro'
};

const dateRangeMotives = ['VAC', 'ENF', 'SUS', 'OTR'];
const autoHoursMotives = ['VAC', 'ENF', 'SUS'];
const manualHoursMotives = ['PER', 'OTR'];

const defaultDescriptionByMotive: Record<string, string> = {
  VAC: 'Solicitud de vacaciones',
  PER: 'Solicitud de permiso',
  ENF: 'Ausencia por enfermedad',
  SUS: 'Suspension laboral',
  OTR: 'Otro control laboral'
};

const obtenerNombreEmpleado = (empleado: Empleado) =>
  `${empleado.EMP_NOMBRE ?? ''} ${empleado.EMP_APELLIDO ?? ''}`.trim();

const parseDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getInclusiveDays = (start?: string, end?: string) => {
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (!startDate || !endDate || endDate < startDate) return 0;

  const diffMs = endDate.getTime() - startDate.getTime();
  return Math.floor(diffMs / 86400000) + 1;
};

function ControlLaboralPage() {
  const [datos, setDatos] = useState<ControlLaboral[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoEmpleados, setCargandoEmpleados] = useState(false);
  const [error, setError] = useState('');
  const [empleadosError, setEmpleadosError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [ctlId, setCtlId] = useState<number | null>(null);
  const [form, setForm] = useState<ControlLaboralForm>(initialForm);
  const [filters, setFilters] = useState(initialFilters);

  const cargarControles = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerControles();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando controles: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  const cargarEmpleados = async () => {
    try {
      setCargandoEmpleados(true);
      setEmpleadosError('');
      const data = await obtenerEmpleados();
      setEmpleados(data);
    } catch (err: any) {
      setEmpleados([]);
      setEmpleadosError(
        'No se pudieron cargar empleados. Puedes ingresar el ID manualmente. ' +
        (err.response?.data?.error || err.message)
      );
    } finally {
      setCargandoEmpleados(false);
    }
  };

  useEffect(() => {
    cargarControles();
    cargarEmpleados();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm(prev => {
      const fieldName = name as string;
      const next = { ...prev, [fieldName]: value };

      if (fieldName === 'ctl_motivo') {
        next.ctl_fecha_inicio = '';
        next.ctl_fecha_regreso = '';
        next.ctl_horas = '';
        next.ctl_descripcion = '';
        next.ctl_estado = 'P';
        next.ctl_fecha_registro = getToday();
      }

      if (next.ctl_motivo === 'PER' && fieldName === 'ctl_fecha_inicio') {
        next.ctl_fecha_regreso = value;
      }

      if (
        autoHoursMotives.includes(next.ctl_motivo) &&
        ['ctl_motivo', 'ctl_fecha_inicio', 'ctl_fecha_regreso'].includes(fieldName)
      ) {
        const days = getInclusiveDays(next.ctl_fecha_inicio, next.ctl_fecha_regreso);
        if (days > 0) next.ctl_horas = String(days * WORK_HOURS_PER_DAY);
      }
      return next;
    });
  };

  const limpiarFormulario = () => {
    setForm({ ...initialForm, ctl_fecha_registro: getToday() });
    setModoEdicion(false);
    setCtlId(null);
    setError('');
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

  const getSelectedEmployee = () =>
    empleados.find((item) => String(item.EMP_ID) === String(form.emp_id));

  const getVacationBalance = () => {
    const selectedEmployee = getSelectedEmployee();
    const currentYear = new Date().getFullYear();
    const hireDate = parseDate(selectedEmployee?.EMP_FECHA_CONTRATACION);
    const startYear = hireDate ? hireDate.getFullYear() : currentYear;
    const earnedYears = Math.max(1, currentYear - startYear + 1);
    const earnedDays = earnedYears * VACATION_DAYS_PER_YEAR;

    const usedDays = datos
      .filter((ctl) =>
        String(ctl.EMP_ID) === String(form.emp_id) &&
        ctl.CTL_MOTIVO === 'VAC' &&
        ['A', 'P'].includes(ctl.CTL_ESTADO) &&
        ctl.CTL_ID !== ctlId
      )
      .reduce(
        (total, ctl) => total + getInclusiveDays(ctl.CTL_FECHA_INICIO, ctl.CTL_FECHA_REGRESO),
        0
      );

    const requestedDays =
      form.ctl_motivo === 'VAC'
        ? getInclusiveDays(form.ctl_fecha_inicio, form.ctl_fecha_regreso)
        : 0;

    return {
      earnedDays,
      usedDays,
      availableDays: Math.max(0, earnedDays - usedDays),
      requestedDays,
      projectedDays: earnedDays - usedDays - requestedDays,
    };
  };

  const buildPayload = (): ControlLaboralForm => {
    const payload = {
      ...form,
      ctl_fecha_registro: form.ctl_fecha_registro || getToday(),
      ctl_estado: form.ctl_estado || 'P',
      ctl_descripcion: form.ctl_descripcion.trim() || defaultDescriptionByMotive[form.ctl_motivo] || '',
    };

    if (payload.ctl_motivo === 'PER') {
      payload.ctl_fecha_regreso = payload.ctl_fecha_inicio;
    }

    if (autoHoursMotives.includes(payload.ctl_motivo)) {
      const days = getInclusiveDays(payload.ctl_fecha_inicio, payload.ctl_fecha_regreso);
      if (days > 0) payload.ctl_horas = String(days * WORK_HOURS_PER_DAY);
    }

    return payload;
  };

  const validarFormulario = () => {
    const payload = buildPayload();
    const { ctl_fecha_inicio, ctl_fecha_regreso, ctl_motivo, ctl_horas, ctl_estado, ctl_fecha_registro, emp_id } = payload;

    if (!emp_id || !ctl_motivo) {
      setError('Selecciona el empleado y el motivo');
      return false;
    }

    if (!ctl_fecha_inicio || (dateRangeMotives.includes(ctl_motivo) && !ctl_fecha_regreso)) {
      setError('Completa las fechas requeridas para este motivo');
      return false;
    }
    if (ctl_fecha_regreso && new Date(ctl_fecha_regreso) < new Date(ctl_fecha_inicio)) {
      setError('La fecha de regreso no puede ser anterior a la de inicio');
      return false;
    }
    if (!ctl_estado || !ctl_fecha_registro) {
      setError('El estado y la fecha de registro son obligatorios');
      return false;
    }
    if (manualHoursMotives.includes(ctl_motivo) && Number(ctl_horas) <= 0) {
      setError('Las horas deben ser un valor positivo');
      return false;
    }
    if (ctl_motivo === 'VAC' && ctl_estado !== 'R') {
      const { availableDays, requestedDays } = getVacationBalance();
      if (requestedDays > availableDays) {
        setError(`El empleado solo tiene ${availableDays} dias de vacaciones disponibles y esta solicitud usa ${requestedDays}.`);
        return false;
      }
    }
    return true;
  };

  const guardarControl = async () => {
    try {
      setError(''); setMensaje('');
      if (!validarFormulario()) return;
      const payload = buildPayload();

      if (modoEdicion && ctlId !== null) {
        await actualizarControl(ctlId, payload);
        setMensaje('Control actualizado correctamente');
      } else {
        await crearControl(payload);
        setMensaje('Control creado correctamente');
      }
      limpiarFormulario();
      await cargarControles();
    } catch (err: any) {
      setError('Error guardando control: ' + (err.response?.data?.error || err.message));
    }
  };

  const cambiarEstado = async (ctl: ControlLaboral, nuevoEstado: 'A' | 'R') => {
    try {
      setError('');
      setMensaje('');
      await actualizarControl(ctl.CTL_ID, {
        ctl_fecha_inicio: ctl.CTL_FECHA_INICIO?.slice(0, 10) || '',
        ctl_fecha_regreso: ctl.CTL_FECHA_REGRESO?.slice(0, 10) || '',
        ctl_motivo: ctl.CTL_MOTIVO || '',
        ctl_horas: String(ctl.CTL_HORAS || ''),
        ctl_descripcion: ctl.CTL_DESCRIPCION || defaultDescriptionByMotive[ctl.CTL_MOTIVO] || '',
        ctl_estado: nuevoEstado,
        ctl_fecha_registro: ctl.CTL_FECHA_REGISTRO?.slice(0, 10) || getToday(),
        emp_id: String(ctl.EMP_ID || '')
      });
      setMensaje(nuevoEstado === 'A' ? 'Registro aprobado correctamente' : 'Registro rechazado correctamente');
      await cargarControles();
    } catch (err: any) {
      setError('Error actualizando estado: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este registro?')) return;
    try {
      setError(''); setMensaje('');
      await eliminarControl(id);
      setMensaje('Registro eliminado correctamente');
      if (ctlId === id) limpiarFormulario();
      await cargarControles();
    } catch (err: any) {
      setError('Error eliminando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (ctl: ControlLaboral) => {
    setModoEdicion(true);
    setCtlId(ctl.CTL_ID);
    setMensaje(''); setError('');
    setForm({
      ctl_fecha_inicio: ctl.CTL_FECHA_INICIO?.slice(0, 10) || '',
      ctl_fecha_regreso: ctl.CTL_FECHA_REGRESO?.slice(0, 10) || '',
      ctl_motivo: ctl.CTL_MOTIVO || '',
      ctl_horas: String(ctl.CTL_HORAS) || '',
      ctl_descripcion: ctl.CTL_DESCRIPCION || '',
      ctl_estado: ctl.CTL_ESTADO || '',
      ctl_fecha_registro: ctl.CTL_FECHA_REGISTRO?.slice(0, 10) || '',
      emp_id: String(ctl.EMP_ID) || ''
    });
  };

  const getStatusChip = (estado: string) => {
    const configs: Record<string, { label: string, color: any }> = {
      'A': { label: 'Aprobado', color: 'success' },
      'P': { label: 'Pendiente', color: 'warning' },
      'R': { label: 'Rechazado', color: 'error' }
    };
    const config = configs[estado] || { label: estado, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" variant="filled" />;
  };

  const getEmployeeLabel = (empId: number | string) => {
    const empleado = empleados.find((item) => String(item.EMP_ID) === String(empId));
    if (!empleado) return `Empleado #${empId}`;

    return obtenerNombreEmpleado(empleado) || `Empleado #${empId}`;
  };

  const datosFiltrados = useMemo(
    () =>
      datos.filter((ctl) => {
        if (filters.empleado && String(ctl.EMP_ID) !== filters.empleado) return false;
        if (filters.motivo && ctl.CTL_MOTIVO !== filters.motivo) return false;
        if (filters.estado && ctl.CTL_ESTADO !== filters.estado) return false;

        const fechaInicio = ctl.CTL_FECHA_INICIO?.slice(0, 10) || '';
        if (filters.fechaInicio && fechaInicio < filters.fechaInicio) return false;
        if (filters.fechaFin && fechaInicio > filters.fechaFin) return false;

        return true;
      }),
    [datos, filters]
  );

  const vacationBalance = getVacationBalance();
  const showVacationBalance = Boolean(form.emp_id && form.ctl_motivo === 'VAC');
  const hasSelectedMotive = Boolean(form.ctl_motivo);
  const shouldShowEndDate = dateRangeMotives.includes(form.ctl_motivo);
  const shouldShowHours = manualHoursMotives.includes(form.ctl_motivo);
  const shouldShowDescription = ['PER', 'ENF', 'SUS', 'OTR'].includes(form.ctl_motivo);

  if (cargando) return <Box sx={{ p: 5, textAlign: 'center' }}><Typography>Cargando registros...</Typography></Box>;

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AssignmentIndIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Control Laboral</Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>{modoEdicion ? 'Editar Registro' : 'Nuevo Registro'}</Typography>

        {empleadosError ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {empleadosError}
          </Alert>
        ) : null}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            {empleados.length > 0 ? (
              <FormControl fullWidth>
                <InputLabel>Empleado</InputLabel>
                <Select
                  name="emp_id"
                  value={form.emp_id}
                  label="Empleado"
                  onChange={handleChange}
                  disabled={cargandoEmpleados}
                >
                  {empleados.map((empleado) => (
                    <MenuItem key={empleado.EMP_ID} value={String(empleado.EMP_ID)}>
                      {obtenerNombreEmpleado(empleado)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                type="number"
                label="ID Empleado"
                name="emp_id"
                value={form.emp_id}
                onChange={handleChange}
                helperText={cargandoEmpleados ? 'Cargando empleados...' : 'Sin listado de empleados disponible'}
              />
            )}
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Motivo</InputLabel>
              <Select name="ctl_motivo" value={form.ctl_motivo} label="Motivo" onChange={handleChange}>
                <MenuItem value="VAC">Vacaciones</MenuItem>
                <MenuItem value="PER">Permiso</MenuItem>
                <MenuItem value="ENF">Enfermedad</MenuItem>
                <MenuItem value="SUS">Suspensión</MenuItem>
                <MenuItem value="OTR">Otro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {hasSelectedMotive ? (
            <>
              <Grid size={{ xs: 12, md: shouldShowEndDate ? 4 : 6 }}>
                <TextField
                  fullWidth
                  type="date"
                  label={form.ctl_motivo === 'PER' ? 'Fecha del permiso' : 'Fecha de inicio'}
                  name="ctl_fecha_inicio"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={form.ctl_fecha_inicio}
                  onChange={handleChange}
                />
              </Grid>

              {shouldShowEndDate ? (
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha de regreso"
                    name="ctl_fecha_regreso"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={form.ctl_fecha_regreso}
                    onChange={handleChange}
                  />
                </Grid>
              ) : null}

              {shouldShowHours ? (
                <Grid size={{ xs: 12, md: shouldShowEndDate ? 4 : 6 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Horas solicitadas"
                    name="ctl_horas"
                    value={form.ctl_horas}
                    onChange={handleChange}
                    placeholder="Ej. 4"
                  />
                </Grid>
              ) : null}

              <Grid size={{ xs: 12, md: shouldShowEndDate || shouldShowHours ? 4 : 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Estado</InputLabel>
                  <Select name="ctl_estado" value={form.ctl_estado} label="Estado" onChange={handleChange}>
                    <MenuItem value="P">Pendiente</MenuItem>
                    <MenuItem value="A">Aprobado</MenuItem>
                    <MenuItem value="R">Rechazado</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {autoHoursMotives.includes(form.ctl_motivo) && form.ctl_horas ? (
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    label="Horas calculadas"
                    value={form.ctl_horas}
                    slotProps={{ input: { readOnly: true } }}
                  />
                </Grid>
              ) : null}
            </>
          ) : (
            <Grid size={{ xs: 12 }}>
              <Alert severity="info">Selecciona un motivo para ver los datos requeridos.</Alert>
            </Grid>
          )}

          {shouldShowDescription ? (
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth multiline rows={2} label="Descripción" name="ctl_descripcion" value={form.ctl_descripcion} onChange={handleChange} />
          </Grid>
          ) : null}

          {showVacationBalance ? (
            <Grid size={{ xs: 12 }}>
              <Alert severity={vacationBalance.projectedDays < 0 ? 'error' : 'info'}>
                Vacaciones: {vacationBalance.earnedDays} dias acumulados, {vacationBalance.usedDays} usados o pendientes,
                {' '}{vacationBalance.availableDays} disponibles. Esta solicitud usa {vacationBalance.requestedDays} dias y dejaria
                {' '}{vacationBalance.projectedDays} disponibles.
              </Alert>
            </Grid>
          ) : null}

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarControl}>
                {modoEdicion ? 'Actualizar' : 'Guardar'}
              </Button>
              <Button variant="outlined" color="secondary" startIcon={<CleaningServicesIcon />} onClick={limpiarFormulario}>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listado de Registros: {datosFiltrados.length} de {datos.length}
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, md: 3 }}>
            {empleados.length > 0 ? (
              <FormControl fullWidth size="small">
                <InputLabel>Empleado</InputLabel>
                <Select name="empleado" value={filters.empleado} label="Empleado" onChange={handleFilterChange}>
                  <MenuItem value="">Todos</MenuItem>
                  {empleados.map((empleado) => (
                    <MenuItem key={empleado.EMP_ID} value={String(empleado.EMP_ID)}>
                      {obtenerNombreEmpleado(empleado)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ) : (
              <TextField
                fullWidth
                size="small"
                label="Empleado ID"
                name="empleado"
                value={filters.empleado}
                onChange={handleFilterChange}
              />
            )}
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Motivo</InputLabel>
              <Select name="motivo" value={filters.motivo} label="Motivo" onChange={handleFilterChange}>
                <MenuItem value="">Todos</MenuItem>
                {Object.entries(motivoLabels).map(([value, label]) => (
                  <MenuItem key={value} value={value}>{label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Estado</InputLabel>
              <Select name="estado" value={filters.estado} label="Estado" onChange={handleFilterChange}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="P">Pendiente</MenuItem>
                <MenuItem value="A">Aprobado</MenuItem>
                <MenuItem value="R">Rechazado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Desde"
              name="fechaInicio"
              value={filters.fechaInicio}
              onChange={handleFilterChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="Hasta"
              name="fechaFin"
              value={filters.fechaFin}
              onChange={handleFilterChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 1 }}>
            <Button fullWidth variant="outlined" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          </Grid>
        </Grid>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Emp.</strong></TableCell>
                <TableCell><strong>Fechas</strong></TableCell>
                <TableCell><strong>Motivo</strong></TableCell>
                <TableCell><strong>Horas</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datosFiltrados.length > 0 ? datosFiltrados.map(ctl => (
                <TableRow key={ctl.CTL_ID} hover>
                  <TableCell>{ctl.CTL_ID}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{getEmployeeLabel(ctl.EMP_ID)}</Typography>
                    <Typography variant="caption" color="text.secondary">#{ctl.EMP_ID}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ display: 'block' }}>I: {ctl.CTL_FECHA_INICIO?.slice(0, 10)}</Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>R: {ctl.CTL_FECHA_REGRESO?.slice(0, 10)}</Typography>
                  </TableCell>
                  <TableCell>{motivoLabels[ctl.CTL_MOTIVO] ?? ctl.CTL_MOTIVO}</TableCell>
                  <TableCell>{ctl.CTL_HORAS}</TableCell>
                  <TableCell>
                    <Tooltip title={ctl.CTL_DESCRIPCION}>
                      <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ctl.CTL_DESCRIPCION}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{getStatusChip(ctl.CTL_ESTADO)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      {ctl.CTL_ESTADO === 'P' ? (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon fontSize="small" />}
                            onClick={() => cambiarEstado(ctl, 'A')}
                          >
                            Aprobar
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<CancelIcon fontSize="small" />}
                            onClick={() => cambiarEstado(ctl, 'R')}
                          >
                            Rechazar
                          </Button>
                        </>
                      ) : null}
                      <Button size="small" variant="outlined" onClick={() => handleEditar(ctl)}><EditIcon fontSize="small" /></Button>
                      <Button size="small" variant="contained" color="error" onClick={() => handleEliminar(ctl.CTL_ID)}><DeleteIcon fontSize="small" /></Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={8} align="center">No hay registros con esos filtros</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" variant="filled">{mensaje}</Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" variant="filled">{error}</Alert>
      </Snackbar>
    </Box>
  );
}

export default ControlLaboralPage;
