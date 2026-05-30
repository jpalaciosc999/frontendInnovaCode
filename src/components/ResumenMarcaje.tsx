import { type ReactElement, type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import GroupsIcon from '@mui/icons-material/Groups';
import ScheduleIcon from '@mui/icons-material/Schedule';

import { obtenerEmpleados } from '../services/empleados.service';
import { obtenerHorarios } from '../services/horario.service';
import { obtenerMarcajes } from '../services/marcaje.service';
import type { Empleado } from '../interfaces/empleados';
import type { Horario } from '../interfaces/horario';
import type { Marcaje } from '../interfaces/marcaje';

type EstadoAsistencia = 'A tiempo' | 'Tarde' | 'Ausente' | 'En jornada' | 'Inconsistente' | 'Sin jornada';

type ResumenFila = {
  empleadoId: number;
  empleado: string;
  horario: string;
  entradaProgramada: string;
  salidaProgramada: string;
  entradaReal: string;
  salidaReal: string;
  estado: EstadoAsistencia;
  diferencia: string;
};

const todayInputValue = () => new Date().toISOString().slice(0, 10);

const dayKeys: Array<keyof Horario> = [
  'HOR_DOMINGO',
  'HOR_LUNES',
  'HOR_MARTES',
  'HOR_MIERCOLES',
  'HOR_JUEVES',
  'HOR_VIERNES',
  'HOR_SABADO',
];

const normalizeDate = (value?: string | null) => {
  if (!value) return '';
  return value.slice(0, 10);
};

const formatTime = (value?: string | null) => {
  if (!value) return '-';
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const minutesFromTime = (value: string) => {
  const [hours, minutes] = value.slice(0, 5).split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
};

const minutesFromDateTime = (value?: string | null) => {
  if (!value) return null;
  if (/^\d{2}:\d{2}/.test(value)) return minutesFromTime(value);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getHours() * 60 + date.getMinutes();
};

const formatMinutes = (minutes: number) => {
  if (minutes <= 0) return 'Sin atraso';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min tarde`;
  return `${hours} h ${rest} min tarde`;
};

const estadoColor: Record<EstadoAsistencia, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  'A tiempo': 'success',
  Tarde: 'warning',
  Ausente: 'error',
  'En jornada': 'info',
  Inconsistente: 'warning',
  'Sin jornada': 'default',
};

const estadoIcon: Record<EstadoAsistencia, ReactElement> = {
  'A tiempo': <CheckCircleIcon fontSize="small" />,
  Tarde: <AccessTimeIcon fontSize="small" />,
  Ausente: <ErrorOutlinedIcon fontSize="small" />,
  'En jornada': <ScheduleIcon fontSize="small" />,
  Inconsistente: <ErrorOutlinedIcon fontSize="small" />,
  'Sin jornada': <ScheduleIcon fontSize="small" />,
};

const getMarcajeDate = (marcaje: Marcaje) =>
  normalizeDate(marcaje.MAR_FECHA) || normalizeDate(marcaje.MAR_ENTRADA) || normalizeDate(marcaje.MAR_SALIDA);

const getTimeMs = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.getTime();
};

const resumirMarcajesDia = (marcajes: Marcaje[], empleadoId: number, fecha: string) => {
  const timestamps = marcajes
    .filter((item) => Number(item.EMP_ID) === Number(empleadoId) && getMarcajeDate(item) === fecha)
    .flatMap((item) => [item.MAR_ENTRADA, item.MAR_SALIDA])
    .filter((value): value is string => Boolean(value))
    .map((value) => ({ value, time: getTimeMs(value) }))
    .filter((item): item is { value: string; time: number } => item.time !== null)
    .sort((a, b) => a.time - b.time);

  if (timestamps.length === 0) return null;

  return {
    entrada: timestamps[0].value,
    salida: timestamps.length > 1 ? timestamps[timestamps.length - 1].value : null,
    cantidad: timestamps.length,
  };
};

function buildRows(empleados: Empleado[], horarios: Horario[], marcajes: Marcaje[], fecha: string): ResumenFila[] {
  const horariosById = new Map(horarios.map((horario) => [Number(horario.HOR_ID), horario]));
  const selectedDate = new Date(`${fecha}T00:00:00`);
  const dayKey = dayKeys[selectedDate.getDay()];

  return empleados
    .filter((empleado) => String(empleado.EMP_ESTADO ?? '').toLowerCase() !== 'inactivo')
    .map((empleado) => {
      const horario = horariosById.get(Number(empleado.HOR_ID));
      const resumenMarcaje = resumirMarcajesDia(marcajes, Number(empleado.EMP_ID), fecha);

      if (!horario) {
        return {
          empleadoId: Number(empleado.EMP_ID),
          empleado: `${empleado.EMP_NOMBRE} ${empleado.EMP_APELLIDO}`.trim(),
          horario: 'Sin horario asignado',
          entradaProgramada: '-',
          salidaProgramada: '-',
          entradaReal: formatTime(resumenMarcaje?.entrada),
          salidaReal: formatTime(resumenMarcaje?.salida),
          estado: 'Sin jornada' as EstadoAsistencia,
          diferencia: '-',
        };
      }

      const scheduled = Number(horario[dayKey] ?? 0) === 1;
      const entradaProgramada = formatTime(horario.HOR_HORA_INICIO);
      const salidaProgramada = formatTime(horario.HOR_HORA_FIN);

      if (!scheduled) {
        return {
          empleadoId: Number(empleado.EMP_ID),
          empleado: `${empleado.EMP_NOMBRE} ${empleado.EMP_APELLIDO}`.trim(),
          horario: horario.HOR_DESCRIPCION,
          entradaProgramada,
          salidaProgramada,
          entradaReal: formatTime(resumenMarcaje?.entrada),
          salidaReal: formatTime(resumenMarcaje?.salida),
          estado: 'Sin jornada' as EstadoAsistencia,
          diferencia: '-',
        };
      }

      if (!resumenMarcaje) {
        return {
          empleadoId: Number(empleado.EMP_ID),
          empleado: `${empleado.EMP_NOMBRE} ${empleado.EMP_APELLIDO}`.trim(),
          horario: horario.HOR_DESCRIPCION,
          entradaProgramada,
          salidaProgramada,
          entradaReal: '-',
          salidaReal: '-',
          estado: 'Ausente' as EstadoAsistencia,
          diferencia: 'Sin marcaje',
        };
      }

      const esFechaPasada = fecha < todayInputValue();
      const marcajeIncompleto = !resumenMarcaje.salida;
      const scheduledStart = minutesFromTime(horario.HOR_HORA_INICIO);
      const actualStart = minutesFromDateTime(resumenMarcaje.entrada);
      const lateMinutes =
        scheduledStart === null || actualStart === null ? 0 : Math.max(0, actualStart - scheduledStart);
      const graceMinutes = 10;
      const estado: EstadoAsistencia = marcajeIncompleto
        ? esFechaPasada ? 'Inconsistente' : 'En jornada'
        : lateMinutes > graceMinutes ? 'Tarde' : 'A tiempo';

      return {
        empleadoId: Number(empleado.EMP_ID),
        empleado: `${empleado.EMP_NOMBRE} ${empleado.EMP_APELLIDO}`.trim(),
        horario: horario.HOR_DESCRIPCION,
        entradaProgramada,
        salidaProgramada,
        entradaReal: formatTime(resumenMarcaje.entrada),
        salidaReal: formatTime(resumenMarcaje.salida),
        estado,
        diferencia: marcajeIncompleto ? 'Solo un marcaje' : formatMinutes(lateMinutes),
      };
    })
    .sort((a, b) => a.empleado.localeCompare(b.empleado));
}

export default function ResumenMarcaje() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [marcajes, setMarcajes] = useState<Marcaje[]>([]);
  const [fecha, setFecha] = useState(todayInputValue());
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    Promise.all([obtenerEmpleados(), obtenerHorarios(), obtenerMarcajes()])
      .then(([empleadosData, horariosData, marcajesData]) => {
        if (!mounted) return;
        setEmpleados(empleadosData);
        setHorarios(horariosData);
        setMarcajes(marcajesData);
      })
      .catch((err) => {
        console.error(err);
        if (mounted) setError('No se pudo cargar el resumen de marcajes.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(
    () => buildRows(empleados, horarios, marcajes, fecha),
    [empleados, horarios, marcajes, fecha]
  );

  const filteredRows = useMemo(() => {
    const query = busqueda.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => `${row.empleado} ${row.horario}`.toLowerCase().includes(query));
  }, [rows, busqueda]);

  const summary = useMemo(
    () => ({
      total: filteredRows.length,
      aTiempo: filteredRows.filter((row) => row.estado === 'A tiempo').length,
      tarde: filteredRows.filter((row) => row.estado === 'Tarde').length,
      ausente: filteredRows.filter((row) => row.estado === 'Ausente').length,
      enJornada: filteredRows.filter((row) => row.estado === 'En jornada').length,
    }),
    [filteredRows]
  );

  if (loading) {
    return (
      <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box data-skip-unsaved="true">
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    Resumen de Marcaje
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Control diario de asistencia, horario asignado, entradas, salidas y atrasos.
                  </Typography>
                </Box>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <TextField
                    type="date"
                    size="small"
                    value={fecha}
                    onChange={(event) => setFecha(event.target.value)}
                  />
                  <TextField
                    label="Buscar empleado u horario"
                    size="small"
                    value={busqueda}
                    onChange={(event) => setBusqueda(event.target.value)}
                  />
                </Stack>
              </Stack>

              {error && <Alert severity="error">{error}</Alert>}

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    md: 'repeat(5, minmax(0, 1fr))',
                  },
                }}
              >
                <Box>
                  <MetricCard icon={<GroupsIcon />} label="Empleados" value={summary.total} color="primary.main" />
                </Box>
                <Box>
                  <MetricCard icon={<CheckCircleIcon />} label="A tiempo" value={summary.aTiempo} color="success.main" />
                </Box>
                <Box>
                  <MetricCard icon={<AccessTimeIcon />} label="Tarde" value={summary.tarde} color="warning.main" />
                </Box>
                <Box>
                  <MetricCard icon={<ErrorOutlinedIcon />} label="Ausentes" value={summary.ausente} color="error.main" />
                </Box>
                <Box>
                  <MetricCard icon={<ScheduleIcon />} label="En jornada" value={summary.enJornada} color="info.main" />
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Empleado</TableCell>
                    <TableCell>Horario</TableCell>
                    <TableCell>Entrada programada</TableCell>
                    <TableCell>Salida programada</TableCell>
                    <TableCell>Entrada real</TableCell>
                    <TableCell>Salida real</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Diferencia</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows.map((row) => (
                    <TableRow key={row.empleadoId} hover>
                      <TableCell>{row.empleado}</TableCell>
                      <TableCell>{row.horario}</TableCell>
                      <TableCell>{row.entradaProgramada}</TableCell>
                      <TableCell>{row.salidaProgramada}</TableCell>
                      <TableCell>{row.entradaReal}</TableCell>
                      <TableCell>{row.salidaReal}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          icon={estadoIcon[row.estado]}
                          label={row.estado}
                          color={estadoColor[row.estado]}
                          variant={row.estado === 'Sin jornada' ? 'outlined' : 'filled'}
                        />
                      </TableCell>
                      <TableCell>{row.diferencia}</TableCell>
                    </TableRow>
                  ))}

                  {!filteredRows.length && (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        No hay empleados para mostrar con los filtros actuales.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}

function MetricCard({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        px: 2,
        py: 1.5,
        minHeight: 86,
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box sx={{ color, display: 'flex' }}>{icon}</Box>
      <Box>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Box>
  );
}
