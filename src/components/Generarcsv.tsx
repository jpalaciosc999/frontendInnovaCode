import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';
import DownloadIcon from '@mui/icons-material/Download';
import SummarizeIcon from '@mui/icons-material/Summarize';
import SendIcon from '@mui/icons-material/Send';

import api from '../api/axios';
import { getApiErrorMessage } from '../api/errors';
import type { Empleado } from '../interfaces/empleados';
import type { Nomina } from '../interfaces/nomina';
import type { Periodo } from '../interfaces/periodo';
import { obtenerEmpleados } from '../services/empleados.service';
import { actualizarNomina, obtenerNominas } from '../services/nomina.service';
import { obtenerPeriodos } from '../services/periodo.service';
import { formatearFecha, formatearMoneda, obtenerNombreEmpleado } from '../utils/relations';

interface CuentaBancaria {
  CUE_ID: number;
  CUE_NOMBRE: string;
  CUE_NUMERO: string;
  CUE_TIPO: string;
  EMP_ID: number;
}

interface FilaNomina {
  nom_id: number;
  emp_id: number;
  empleado: string;
  banco: string;
  cuenta_numero: string;
  cuenta_tipo: string;
  ingresos: number;
  descuentos: number;
  liquido_depositar: number;
  estado: string;
}

const obtenerCuentas = async (): Promise<CuentaBancaria[]> => {
  const res = await api.get<CuentaBancaria[]>('cuentas/');
  return res.data;
};

const obtenerEtiquetaEstado = (estado: string) => {
  if (estado === 'A') return <Chip label="Aprobada" color="success" size="small" />;
  if (estado === 'P') return <Chip label="Pendiente gerente" color="warning" size="small" />;
  if (estado === 'I') return <Chip label="Rechazada" color="error" size="small" />;
  if (estado === 'B') return <Chip label="Borrador" color="default" size="small" />;
  return <Chip label={estado || 'Sin estado'} size="small" />;
};

const crearPayloadNomina = (nomina: Nomina, estado: string) => ({
  nom_total_ingresos: nomina.NOM_TOTAL_INGRESOS,
  nom_total_descuento: nomina.NOM_TOTAL_DESCUENTO,
  nom_salario_liquido: nomina.NOM_SALARIO_LIQUIDO,
  nom_fecha_generacion: formatearFecha(nomina.NOM_FECHA_GENERACION),
  per_id: nomina.PER_ID,
  empleado_id: nomina.EMP_ID,
  liq_id: nomina.LIQ_ID ?? null,
  nom_estado: estado,
});

function GenerarCSV() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoId, setPeriodoId] = useState('');
  const [datos, setDatos] = useState<FilaNomina[]>([]);
  const [nominasPeriodo, setNominasPeriodo] = useState<Nomina[]>([]);
  const [cargando, setCargando] = useState(false);
  const [generado, setGenerado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [periodosListos, setPeriodosListos] = useState(false);

  const cargarPeriodos = async () => {
    if (periodosListos) return;
    try {
      const data = await obtenerPeriodos();
      setPeriodos(data);
      setPeriodosListos(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error cargando periodos'));
    }
  };

  const periodoSeleccionado = periodos.find((p) => p.PER_ID === Number(periodoId));

  const fmt = (v: number) =>
    v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePeriodo = (e: SelectChangeEvent) => {
    setPeriodoId(e.target.value);
    setGenerado(false);
    setDatos([]);
    setNominasPeriodo([]);
    setError('');
    setMensaje('');
  };

  const construirFilas = (
    nominas: Nomina[],
    empleados: Empleado[],
    cuentas: CuentaBancaria[]
  ): FilaNomina[] => {
    const empleadosPorId = new Map(empleados.map((empleado) => [String(empleado.EMP_ID), empleado]));
    const cuentasPorEmp = new Map<number, CuentaBancaria>();

    cuentas.forEach((cuenta) => {
      if (!cuentasPorEmp.has(cuenta.EMP_ID)) cuentasPorEmp.set(cuenta.EMP_ID, cuenta);
    });

    return nominas.map((nomina) => {
      const empleado = empleadosPorId.get(String(nomina.EMP_ID));
      const cuenta = cuentasPorEmp.get(nomina.EMP_ID);

      return {
        nom_id: nomina.NOM_ID,
        emp_id: nomina.EMP_ID,
        empleado: obtenerNombreEmpleado(empleado) || `Empleado #${nomina.EMP_ID}`,
        banco: cuenta?.CUE_NOMBRE ?? 'Sin banco',
        cuenta_numero: cuenta?.CUE_NUMERO ?? 'Sin cuenta',
        cuenta_tipo: cuenta?.CUE_TIPO ?? '-',
        ingresos: Number(nomina.NOM_TOTAL_INGRESOS || 0),
        descuentos: Number(nomina.NOM_TOTAL_DESCUENTO || 0),
        liquido_depositar: Number(nomina.NOM_SALARIO_LIQUIDO || 0),
        estado: nomina.NOM_ESTADO,
      };
    });
  };

  const cargarPlanilla = async () => {
    if (!periodoId) return;
    try {
      setCargando(true);
      setError('');
      setMensaje('');

      const [nominas, empleados, cuentas] = await Promise.all([
        obtenerNominas(),
        obtenerEmpleados(),
        obtenerCuentas()
      ]);

      const nominasFiltradas = nominas.filter((nomina) => String(nomina.PER_ID) === String(periodoId));

      if (nominasFiltradas.length === 0) {
        setDatos([]);
        setNominasPeriodo([]);
        setGenerado(true);
        setError('No hay nominas registradas para este periodo. Primero crea la cabecera y su detalle.');
        return;
      }

      setNominasPeriodo(nominasFiltradas);
      setDatos(construirFilas(nominasFiltradas, empleados, cuentas));
      setGenerado(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error generando planilla'));
    } finally {
      setCargando(false);
    }
  };

  const enviarPeriodoAGerente = async () => {
    if (!periodoId) return;
    try {
      setCargando(true);
      setError('');
      setMensaje('');

      const nominas = nominasPeriodo.length > 0
        ? nominasPeriodo
        : (await obtenerNominas()).filter((nomina) => String(nomina.PER_ID) === String(periodoId));
      const enviables = nominas.filter((nomina) => ['B', 'I'].includes(nomina.NOM_ESTADO));

      if (enviables.length === 0) {
        setMensaje('No hay nominas en borrador o rechazadas para enviar.');
        return;
      }

      await Promise.all(enviables.map((nomina) => actualizarNomina(nomina.NOM_ID, crearPayloadNomina(nomina, 'P'))));
      setMensaje('Planilla enviada al gerente. Queda pendiente de aprobacion.');
      await cargarPlanilla();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error enviando planilla a gerente'));
    } finally {
      setCargando(false);
    }
  };

  const puedeExportar = generado && datos.length > 0 && datos.every((fila) => fila.estado === 'A');
  const hayPendientes = generado && datos.some((fila) => fila.estado === 'P' || fila.estado === 'B');
  const hayRechazadas = generado && datos.some((fila) => fila.estado === 'I');

  const exportarCSV = () => {
    if (!puedeExportar) return;

    const headers = [
      'NOM_ID',
      'EMP_ID',
      'Empleado',
      'Banco',
      'No. Cuenta',
      'Tipo Cuenta',
      'Total Ingresos',
      'Total Descuentos',
      'Liquido a Depositar',
      'Estado'
    ];

    const filas = datos.map((d) => [
      d.nom_id,
      d.emp_id,
      d.empleado,
      d.banco,
      d.cuenta_numero,
      d.cuenta_tipo,
      d.ingresos.toFixed(2),
      d.descuentos.toFixed(2),
      d.liquido_depositar.toFixed(2),
      'Aprobada'
    ]);

    const totalFila = [
      'TOTALES', '', '', '', '', '',
      datos.reduce((s, d) => s + d.ingresos, 0).toFixed(2),
      datos.reduce((s, d) => s + d.descuentos, 0).toFixed(2),
      datos.reduce((s, d) => s + d.liquido_depositar, 0).toFixed(2),
      ''
    ];

    const periodo = periodoSeleccionado
      ? `${periodoSeleccionado.PER_FECHA_INICIO} al ${periodoSeleccionado.PER_FECHA_FIN}`
      : '';

    const csvContent = [
      [`Planilla de depositos - Periodo: ${periodo}`],
      [`Fecha de pago: ${periodoSeleccionado?.PER_FECHA_PAGO ?? ''}`],
      [`Nominas aprobadas: ${datos.length}`],
      [],
      headers,
      ...filas,
      [],
      totalFila
    ].map((r) => r.join(',')).join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `depositos_periodo${periodoId}_${periodoSeleccionado?.PER_FECHA_PAGO ?? ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totales = {
    ingresos: datos.reduce((s, d) => s + d.ingresos, 0),
    descuentos: datos.reduce((s, d) => s + d.descuentos, 0),
    liquido: datos.reduce((s, d) => s + d.liquido_depositar, 0),
  };

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <SummarizeIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Generacion de Planilla - Deposito Bancario
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          La planilla se arma con las nominas del periodo. Si aun no estan aprobadas por gerencia, queda pendiente y no se descarga el CSV de deposito.
        </Alert>

        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <FormControl fullWidth>
              <InputLabel>Periodo de nomina</InputLabel>
              <Select value={periodoId} label="Periodo de nomina"
                onChange={handlePeriodo} onOpen={cargarPeriodos}>
                <MenuItem value="">Seleccione un periodo</MenuItem>
                {periodos.map((p) => (
                  <MenuItem key={p.PER_ID} value={String(p.PER_ID)}>
                    {formatearFecha(p.PER_FECHA_INICIO)} al {formatearFecha(p.PER_FECHA_FIN)}
                    {p.PER_ESTADO === 'A' ? ' - Activo' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Button fullWidth variant="contained" size="large"
              startIcon={<SummarizeIcon />}
              onClick={cargarPlanilla}
              disabled={!periodoId || cargando}>
              {cargando ? 'Cargando...' : 'Ver Planilla'}
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button fullWidth variant="outlined" size="large"
              startIcon={<SendIcon />}
              onClick={enviarPeriodoAGerente}
              disabled={!periodoId || cargando}>
              Enviar
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button fullWidth variant="contained" color="success" size="large"
              startIcon={<DownloadIcon />} onClick={exportarCSV}
              disabled={!puedeExportar}>
              CSV
            </Button>
          </Grid>
        </Grid>

        {mensaje && <Alert severity="success" sx={{ mt: 2 }}>{mensaje}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        {hayPendientes && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Hay nominas pendientes o en borrador. Envia la planilla al gerente y espera aprobacion para descargar el CSV.
          </Alert>
        )}
        {hayRechazadas && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Hay nominas rechazadas. Corrige el detalle, recalcula y vuelve a enviarlas al gerente.
          </Alert>
        )}

        {generado && datos.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Resumen - {datos.length} nominas | Fecha pago: <strong>{formatearFecha(periodoSeleccionado?.PER_FECHA_PAGO)}</strong>
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Total Ingresos', valor: totales.ingresos, color: '#1976d2' },
                { label: 'Total Descuentos', valor: totales.descuentos, color: '#c62828' },
                { label: 'Total a Depositar', valor: totales.liquido, color: '#2e7d32' },
              ].map((card) => (
                <Grid key={card.label} size={{ xs: 12, md: 4 }}>
                  <Paper variant="outlined"
                    sx={{ p: 2, textAlign: 'center', borderColor: card.color }}>
                    <Typography variant="caption" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Typography variant="h6"
                      sx={{ color: card.color, fontWeight: 'bold', fontSize: '1rem' }}>
                      Q{fmt(card.valor)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Paper>

      {generado && datos.length > 0 && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6">Detalle por nomina</Typography>
            <Button variant="outlined" color="success"
              startIcon={<DownloadIcon />} onClick={exportarCSV}
              disabled={!puedeExportar}>
              Descargar CSV aprobado
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Nomina</strong></TableCell>
                  <TableCell><strong>Empleado</strong></TableCell>
                  <TableCell><strong>Banco</strong></TableCell>
                  <TableCell><strong>No. Cuenta</strong></TableCell>
                  <TableCell align="right"><strong>Ingresos</strong></TableCell>
                  <TableCell align="right"><strong>Descuentos</strong></TableCell>
                  <TableCell align="right"><strong>Liquido</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datos.map((d) => (
                  <TableRow key={d.nom_id} hover>
                    <TableCell>#{d.nom_id}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {d.empleado}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {d.emp_id}
                      </Typography>
                    </TableCell>
                    <TableCell>{d.banco}</TableCell>
                    <TableCell>
                      <Typography variant="body2">{d.cuenta_numero}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {d.cuenta_tipo}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{formatearMoneda(d.ingresos)}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      -{formatearMoneda(d.descuentos)}
                    </TableCell>
                    <TableCell align="right" sx={{ backgroundColor: '#e8f5e9', fontWeight: 'bold', color: 'success.main' }}>
                      {formatearMoneda(d.liquido_depositar)}
                    </TableCell>
                    <TableCell>{obtenerEtiquetaEstado(d.estado)}</TableCell>
                  </TableRow>
                ))}

                <TableRow sx={{ backgroundColor: '#eeeeee' }}>
                  <TableCell colSpan={4}>
                    <strong>TOTALES - {datos.length} nominas</strong>
                  </TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totales.ingresos)}</strong></TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}><strong>-{formatearMoneda(totales.descuentos)}</strong></TableCell>
                  <TableCell align="right" sx={{ backgroundColor: '#c8e6c9', color: 'success.main', fontSize: '1rem' }}>
                    <strong>{formatearMoneda(totales.liquido)}</strong>
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}
    </Box>
  );
}

export default GenerarCSV;
