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

import api from '../api/axios';
import { getApiErrorMessage } from '../api/errors';
import type { Empleado } from '../interfaces/empleados';
import type { Nomina } from '../interfaces/nomina';
import type { NominaDetalle } from '../interfaces/nomina-detalle';
import type { Periodo } from '../interfaces/periodo';
import { obtenerEmpleados } from '../services/empleados.service';
import { obtenerNominas } from '../services/nomina.service';
import { obtenerDetallesNomina } from '../services/nomina-detalle.service';
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
  conceptos: number;
  duplicados: number;
  totales_cuadran: boolean;
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

const obtenerClaveConcepto = (detalle: NominaDetalle) => {
  if (detalle.TIS_ID) return `I-${detalle.TIS_ID}`;
  if (detalle.TDS_ID) return `D-${detalle.TDS_ID}`;
  if (detalle.KRE_ID) return `K-${detalle.KRE_ID}`;
  return '';
};

const calcularResumenDetalles = (nominaId: number, detalles: NominaDetalle[]) => {
  const conceptos = new Set<string>();
  return detalles
    .filter((detalle) => String(detalle.NOM_ID) === String(nominaId))
    .reduce(
      (resumen, detalle) => {
        const monto = Number(detalle.DET_MONTO || 0);
        if (detalle.TDS_ID) resumen.descuentos += monto;
        else resumen.ingresos += monto;

        const concepto = obtenerClaveConcepto(detalle);
        if (concepto) {
          if (conceptos.has(concepto)) resumen.duplicados += 1;
          conceptos.add(concepto);
        }

        resumen.liquido = resumen.ingresos - resumen.descuentos;
        resumen.conceptos += 1;
        return resumen;
      },
      { ingresos: 0, descuentos: 0, liquido: 0, conceptos: 0, duplicados: 0 }
    );
};

const totalesCuadran = (nomina: Nomina, resumen: ReturnType<typeof calcularResumenDetalles>) => {
  if (resumen.conceptos === 0) return false;
  return Math.abs(Number(nomina.NOM_TOTAL_INGRESOS || 0) - resumen.ingresos) < 0.01
    && Math.abs(Number(nomina.NOM_TOTAL_DESCUENTO || 0) - resumen.descuentos) < 0.01
    && Math.abs(Number(nomina.NOM_SALARIO_LIQUIDO || 0) - resumen.liquido) < 0.01;
};

function GenerarCSV() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoId, setPeriodoId] = useState('');
  const [datos, setDatos] = useState<FilaNomina[]>([]);
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
    setError('');
    setMensaje('');
  };

  const construirFilas = (
    nominas: Nomina[],
    empleados: Empleado[],
    cuentas: CuentaBancaria[],
    detalles: NominaDetalle[]
  ): FilaNomina[] => {
    const empleadosPorId = new Map(empleados.map((empleado) => [String(empleado.EMP_ID), empleado]));
    const cuentasPorEmp = new Map<number, CuentaBancaria>();

    cuentas.forEach((cuenta) => {
      if (!cuentasPorEmp.has(cuenta.EMP_ID)) cuentasPorEmp.set(cuenta.EMP_ID, cuenta);
    });

    return nominas.map((nomina) => {
      const empleado = empleadosPorId.get(String(nomina.EMP_ID));
      const cuenta = cuentasPorEmp.get(nomina.EMP_ID);
      const resumen = calcularResumenDetalles(nomina.NOM_ID, detalles);

      return {
        nom_id: nomina.NOM_ID,
        emp_id: nomina.EMP_ID,
        empleado: obtenerNombreEmpleado(empleado) || `Empleado #${nomina.EMP_ID}`,
        banco: cuenta?.CUE_NOMBRE ?? 'Sin banco',
        cuenta_numero: cuenta?.CUE_NUMERO ?? 'Sin cuenta',
        cuenta_tipo: cuenta?.CUE_TIPO ?? '-',
        ingresos: resumen.conceptos > 0 ? resumen.ingresos : Number(nomina.NOM_TOTAL_INGRESOS || 0),
        descuentos: resumen.conceptos > 0 ? resumen.descuentos : Number(nomina.NOM_TOTAL_DESCUENTO || 0),
        liquido_depositar: resumen.conceptos > 0 ? resumen.liquido : Number(nomina.NOM_SALARIO_LIQUIDO || 0),
        estado: nomina.NOM_ESTADO,
        conceptos: resumen.conceptos,
        duplicados: resumen.duplicados,
        totales_cuadran: totalesCuadran(nomina, resumen),
      };
    });
  };

  const cargarPlanilla = async () => {
    if (!periodoId) return;
    try {
      setCargando(true);
      setError('');
      setMensaje('');

      const [nominas, detalles, empleados, cuentas] = await Promise.all([
        obtenerNominas(),
        obtenerDetallesNomina(),
        obtenerEmpleados(),
        obtenerCuentas()
      ]);

      const nominasFiltradas = nominas.filter((nomina) => String(nomina.PER_ID) === String(periodoId));

      if (nominasFiltradas.length === 0) {
        setDatos([]);
        setGenerado(true);
        setError('No hay nominas registradas para este periodo. Primero crea la cabecera y su detalle.');
        return;
      }

      setDatos(construirFilas(nominasFiltradas, empleados, cuentas, detalles));
      setGenerado(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error generando planilla'));
    } finally {
      setCargando(false);
    }
  };

  const puedeExportar = generado && datos.length > 0
    && datos.every((fila) => fila.estado === 'A' && fila.conceptos > 0 && fila.duplicados === 0 && fila.totales_cuadran);
  const hayPendientes = generado && datos.some((fila) => fila.estado === 'P' || fila.estado === 'B');
  const hayRechazadas = generado && datos.some((fila) => fila.estado === 'I');
  const hayInconsistencias = generado && datos.some((fila) => fila.conceptos === 0 || fila.duplicados > 0 || !fila.totales_cuadran);

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
          La planilla se arma con las nominas aprobadas del periodo. El envio a gerente se realiza desde Gestion de Nomina; aqui solo se revisa la planilla y se descarga el CSV final.
        </Alert>

        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 6 }}>
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

          <Grid size={{ xs: 12, md: 3 }}>
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
            Hay nominas pendientes o en borrador. En Gestion de Nomina envia las nominas al gerente y espera aprobacion para descargar el CSV.
          </Alert>
        )}
        {hayRechazadas && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Hay nominas rechazadas. Corrige el detalle en Nomina Detalle, recalcula en Gestion de Nomina y vuelve a enviarlas al gerente desde Gestion de Nomina.
          </Alert>
        )}
        {hayInconsistencias && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Hay nominas sin detalle, con conceptos duplicados o con cabecera distinta al detalle. Corrige y recalcula antes de exportar.
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
                  <TableCell align="center"><strong>Revision</strong></TableCell>
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
                    <TableCell align="center">
                      {d.conceptos === 0 || d.duplicados > 0 || !d.totales_cuadran
                        ? <Chip label="Revisar" color="error" size="small" />
                        : <Chip label={`${d.conceptos} conceptos`} color="success" size="small" />}
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
