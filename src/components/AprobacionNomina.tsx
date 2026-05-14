import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';
import ApprovalIcon from '@mui/icons-material/Approval';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import type { Empleado } from '../interfaces/empleados';
import type { Nomina } from '../interfaces/nomina';
import type { Periodo } from '../interfaces/periodo';
import { obtenerEmpleados } from '../services/empleados.service';
import { actualizarNomina, obtenerNominas } from '../services/nomina.service';
import { obtenerPeriodos } from '../services/periodo.service';
import { getApiErrorMessage } from '../api/errors';
import { formatearFecha, formatearMoneda, obtenerNombreEmpleado } from '../utils/relations';

const obtenerEstado = (estado: string) => {
  if (estado === 'P') return <Chip label="Pendiente" color="warning" size="small" />;
  if (estado === 'A') return <Chip label="Aprobada" color="success" size="small" />;
  if (estado === 'I' || estado === 'R') return <Chip label="Rechazada" color="error" size="small" />;
  if (estado === 'B') return <Chip label="Borrador" color="default" size="small" />;
  return <Chip label={estado || 'Sin estado'} size="small" />;
};

function AprobacionNomina() {
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const [nominasData, empleadosData, periodosData] = await Promise.all([
        obtenerNominas(),
        obtenerEmpleados(),
        obtenerPeriodos(),
      ]);
      setNominas(nominasData);
      setEmpleados(empleadosData);
      setPeriodos(periodosData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error cargando nominas para aprobacion'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const empleadosPorId = useMemo(
    () => new Map(empleados.map((empleado) => [String(empleado.EMP_ID), empleado])),
    [empleados]
  );

  const periodosPorId = useMemo(
    () => new Map(periodos.map((periodo) => [String(periodo.PER_ID), periodo])),
    [periodos]
  );

  const pendientes = useMemo(
    () => nominas.filter((nomina) => nomina.NOM_ESTADO === 'P'),
    [nominas]
  );

  const cambiarEstado = async (nomina: Nomina, estado: 'A' | 'I') => {
    try {
      setProcesandoId(nomina.NOM_ID);
      setError('');
      setMensaje('');

      await actualizarNomina(nomina.NOM_ID, {
        nom_total_ingresos: nomina.NOM_TOTAL_INGRESOS,
        nom_total_descuento: nomina.NOM_TOTAL_DESCUENTO,
        nom_salario_liquido: nomina.NOM_SALARIO_LIQUIDO,
        nom_fecha_generacion: formatearFecha(nomina.NOM_FECHA_GENERACION),
        per_id: nomina.PER_ID,
        empleado_id: nomina.EMP_ID,
        liq_id: nomina.LIQ_ID,
        nom_estado: estado,
      });

      setMensaje(estado === 'A' ? 'Nomina aprobada correctamente' : 'Nomina rechazada correctamente');
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error actualizando estado de nomina'));
    } finally {
      setProcesandoId(null);
    }
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando nominas pendientes...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ApprovalIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Aprobacion de Nomina
          </Typography>
        </Box>

        <Alert severity="info">
          Aqui el gerente revisa las nominas que Contabilidad envio en estado Pendiente. Al aprobarlas quedan listas para pago y reportes.
        </Alert>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Pendientes de aprobacion: {pendientes.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Periodo</strong></TableCell>
                <TableCell align="right"><strong>Ingresos</strong></TableCell>
                <TableCell align="right"><strong>Descuentos</strong></TableCell>
                <TableCell align="right"><strong>Liquido</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Decision</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendientes.length > 0 ? pendientes.map((nomina) => {
                const empleado = empleadosPorId.get(String(nomina.EMP_ID));
                const periodo = periodosPorId.get(String(nomina.PER_ID));

                return (
                  <TableRow key={nomina.NOM_ID} hover>
                    <TableCell>{nomina.NOM_ID}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {obtenerNombreEmpleado(empleado) || `Empleado #${nomina.EMP_ID}`}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">ID: {nomina.EMP_ID}</Typography>
                    </TableCell>
                    <TableCell>
                      {periodo
                        ? `${formatearFecha(periodo.PER_FECHA_INICIO)} al ${formatearFecha(periodo.PER_FECHA_FIN)}`
                        : `Periodo #${nomina.PER_ID}`}
                    </TableCell>
                    <TableCell align="right">{formatearMoneda(nomina.NOM_TOTAL_INGRESOS)}</TableCell>
                    <TableCell align="right">{formatearMoneda(nomina.NOM_TOTAL_DESCUENTO)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatearMoneda(nomina.NOM_SALARIO_LIQUIDO)}
                    </TableCell>
                    <TableCell>{formatearFecha(nomina.NOM_FECHA_GENERACION)}</TableCell>
                    <TableCell>{obtenerEstado(nomina.NOM_ESTADO)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          disabled={procesandoId === nomina.NOM_ID}
                          onClick={() => cambiarEstado(nomina, 'A')}
                        >
                          Aprobar
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<CancelIcon />}
                          disabled={procesandoId === nomina.NOM_ID}
                          onClick={() => cambiarEstado(nomina, 'I')}
                        >
                          Rechazar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No hay nominas pendientes de aprobacion
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setMensaje('')} sx={{ width: '100%' }}>
          {mensaje}
        </Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AprobacionNomina;
