import { useState, useEffect, useCallback, type SyntheticEvent } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Typography, Divider, CircularProgress, Button, Box, Paper, Alert,
  IconButton, Tooltip, Autocomplete, TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import { obtenerHistorial, registrarMarcaje, updateMarcaje } from '../services/marcaje.service';
import { obtenerEmpleados } from '../services/empleados.service';
import { obtenerHorarios } from '../services/horario.service';
import type { Marcaje } from '../interfaces/marcaje';
import type { Empleado } from '../interfaces/empleados';
import type { Horario } from '../interfaces/horario';

type DiferenciaMarcaje = {
  texto: string;
  positiva: boolean;
};

const obtenerPartesHora = (hora: string | undefined, respaldo: string) => {
  const [hrs = '0', mins = '0', secs = '0'] = (hora || respaldo).split(':');
  return {
    horas: Number(hrs) || 0,
    minutos: Number(mins) || 0,
    segundos: Number(secs) || 0
  };
};

const formatearDiferencia = (diffMs: number): string => {
  const esNegativo = diffMs < 0;
  const absolutoMs = Math.abs(diffMs);
  const hrs = Math.floor(absolutoMs / 3600000);
  const mins = Math.floor((absolutoMs % 3600000) / 60000);
  const secs = Math.floor((absolutoMs % 60000) / 1000);
  const formato = `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return esNegativo ? `-${formato}` : formato;
};

const calcularDiferencia = (
  entradaStr: string,
  salidaStr: string | null,
  horario?: Horario
): DiferenciaMarcaje => {
  if (!salidaStr) return { texto: "Pendiente", positiva: false };

  const salida = new Date(salidaStr);
  const referencia = new Date(entradaStr);
  const horaFin = obtenerPartesHora(horario?.HOR_HORA_FIN, '18:00:00');
  referencia.setHours(horaFin.horas, horaFin.minutos, horaFin.segundos, 0);

  if (horario) {
    const horaInicio = obtenerPartesHora(horario.HOR_HORA_INICIO, '08:00:00');
    const inicioProgramado = new Date(entradaStr);
    inicioProgramado.setHours(horaInicio.horas, horaInicio.minutos, horaInicio.segundos, 0);

    if (referencia <= inicioProgramado) {
      referencia.setDate(referencia.getDate() + 1);
    }
  }

  const diffMs = salida.getTime() - referencia.getTime();

  return {
    texto: formatearDiferencia(diffMs),
    positiva: diffMs > 0
  };
};

function MarcajeCRUD() {
  const [datos, setDatos] = useState<Marcaje[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState<Empleado | null>(null);
  const [cargandoMas, setCargandoMas] = useState(false);
  const [cargandoEmpleados, setCargandoEmpleados] = useState(false);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [fechaHoy, setFechaHoy] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setFechaHoy(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cargarCatalogos = async () => {
      setCargandoEmpleados(true);
      try {
        const [empleadosData, horariosData] = await Promise.all([
          obtenerEmpleados(),
          obtenerHorarios()
        ]);
        setEmpleados(empleadosData);
        setHorarios(horariosData);
      } catch {
        setError('Error al obtener empleados u horarios del servidor.');
      } finally {
        setCargandoEmpleados(false);
      }
    };

    cargarCatalogos();
  }, []);

  const horarioSeleccionado = horarios.find((horario) => horario.HOR_ID === empleadoSeleccionado?.HOR_ID);

  const cargarDatos = useCallback(async (nuevoOffset: number = 0) => {
    if (!empleadoSeleccionado) {
      setDatos([]);
      return;
    }

    setCargandoMas(true);
    if (nuevoOffset === 0) setError('');
    try {
      const res = await obtenerHistorial(empleadoSeleccionado.EMP_ID, nuevoOffset);
      if (nuevoOffset === 0) setDatos(res);
      else setDatos(prev => [...prev, ...res]);
    } catch {
      setError('Error al obtener datos del servidor.');
    } finally {
      setCargandoMas(false);
    }
  }, [empleadoSeleccionado]);

  useEffect(() => { cargarDatos(0); }, [cargarDatos]);

  const handleSeleccionarEmpleado = (_event: SyntheticEvent, empleado: Empleado | null) => {
    setEmpleadoSeleccionado(empleado);
    setDatos([]);
    setOffset(0);
    setError('');
  };

  const handleRegistrar = async () => {
    if (!empleadoSeleccionado) {
      setError('Selecciona un empleado antes de registrar el marcaje.');
      return;
    }

    setError('');
    setCargandoMas(true);
    try {
      const res = await registrarMarcaje(empleadoSeleccionado.EMP_ID);
      alert(res.message);
      setOffset(0);
      await cargarDatos(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error en el servidor');
    } finally {
      setCargandoMas(false);
    }
  };

  const handleAutorizar = async (idMarcaje: number, estado: number) => {
    try {
      await updateMarcaje(idMarcaje, estado);
      alert(estado === 1 ? "Autorizado ✅" : "Rechazado ❌");
      cargarDatos(0); // Recarga para ver el cambio
    } catch (err: any) {
      alert(err.response?.data?.message || "Error al actualizar la autorización.");
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ color: '#1565c0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 2 }}>
        <HistoryIcon fontSize="large" /> Control de Marcaje
      </Typography>
      <Divider sx={{ mb: 4 }} />

      <Paper elevation={3} sx={{ p: 3, mb: 4, backgroundColor: '#f8faff', borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'gray' }}>EMPLEADO</Typography>
            <Autocomplete
              options={empleados}
              value={empleadoSeleccionado}
              loading={cargandoEmpleados}
              onChange={handleSeleccionarEmpleado}
              getOptionLabel={(empleado) => `${empleado.EMP_ID} - ${empleado.EMP_NOMBRE} ${empleado.EMP_APELLIDO}`}
              isOptionEqualToValue={(option, value) => option.EMP_ID === value.EMP_ID}
              sx={{ width: { xs: '100%', sm: 360 }, mt: 1 }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar empleado"
                  placeholder="Nombre, apellido o ID"
                  size="small"
                />
              )}
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'gray' }}>FECHA ACTUAL</Typography>
            <Typography variant="h6">{fechaHoy.toLocaleDateString()}</Typography>
          </Box>
          <Button
            variant="contained" size="large"
            startIcon={cargandoMas ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
            onClick={handleRegistrar} disabled={cargandoMas || !empleadoSeleccionado}
          > Registrar Marcaje </Button>
        </Box>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ backgroundColor: '#1565c0' }}>
            <TableRow>
              <TableCell sx={{ color: 'white' }}>Fecha</TableCell>
              <TableCell sx={{ color: 'white' }}>Entrada</TableCell>
              <TableCell sx={{ color: 'white' }}>Salida</TableCell>
              <TableCell sx={{ color: 'white' }}>Diferencia</TableCell>
              <TableCell align="center" sx={{ color: 'white' }}>Autorización</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {datos.length > 0 ? datos.map((reg) => {
              const diferencia = calcularDiferencia(reg.MAR_ENTRADA, reg.MAR_SALIDA, horarioSeleccionado);

              return (
              <TableRow key={reg.MAR_ID}>
                <TableCell>{reg.MAR_FECHA ? new Date(reg.MAR_FECHA).toLocaleDateString() : '--'}</TableCell>
                <TableCell>{reg.MAR_ENTRADA ? new Date(reg.MAR_ENTRADA).toLocaleTimeString() : '--'}</TableCell>
                <TableCell>{reg.MAR_SALIDA ? new Date(reg.MAR_SALIDA).toLocaleTimeString() : '--'}</TableCell>
                <TableCell>
                  <Typography color={diferencia.positiva ? 'success.main' : 'text.primary'}>
                    {diferencia.texto}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  {!diferencia.positiva ? <Typography color="text.secondary">No aplica</Typography> :
                   reg.MAR_AUTORIZACION === 1 ? <Typography color="success.main">SÍ</Typography> :
                   reg.MAR_AUTORIZACION === 2 ? <Typography color="error.main">NO</Typography> :
                   <Box>
                     <Tooltip title="Autorizar">
                       <IconButton color="success" onClick={() => handleAutorizar(reg.MAR_ID, 1)}><CheckIcon /></IconButton>
                     </Tooltip>
                     <Tooltip title="Rechazar">
                       <IconButton color="error" onClick={() => handleAutorizar(reg.MAR_ID, 2)}><CloseIcon /></IconButton>
                     </Tooltip>
                   </Box>}
                </TableCell>
              </TableRow>
              );
            }) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  {empleadoSeleccionado ? 'No hay marcajes registrados para este empleado.' : 'Selecciona un empleado para ver su historial.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => { const n = offset + 15; setOffset(n); cargarDatos(n); }}
          disabled={cargandoMas || !empleadoSeleccionado}
        > {cargandoMas ? <CircularProgress size={20} /> : "CARGAR MÁS (15 DÍAS)"} </Button>
      </Box>
    </Box>
  );
}

export default MarcajeCRUD;
