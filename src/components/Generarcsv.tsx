import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
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

import { obtenerEmpleados } from '../services/empleados.service';
import { obtenerPeriodos } from '../services/periodo.service';
import type { Empleado } from '../interfaces/empleados';
import type { Periodo } from '../interfaces/periodo';
import api from '../api/axios';

// ─── Interfaz cuenta bancaria ─────────────────────────────────────────────────
interface CuentaBancaria {
  CUE_ID: number;
  CUE_NOMBRE: string;  // Nombre del banco
  CUE_NUMERO: string;  // Número de cuenta
  CUE_TIPO: string;
  EMP_ID: number;
}

const obtenerCuentas = async (): Promise<CuentaBancaria[]> => {
  const res = await api.get<CuentaBancaria[]>('cuentas/');
  return res.data;
};

// ─── Constantes de cálculo ────────────────────────────────────────────────────
const TASA_IGSS_LABORAL = 0.0483;

const calcularISRMensual = (salarioMensual: number): number => {
  const anual = salarioMensual * 12;
  const imponible = Math.max(0, anual - 60_000 - 48_000);
  if (imponible <= 0) return 0;
  const isrAnual = imponible <= 300_000
    ? imponible * 0.05
    : 15_000 + (imponible - 300_000) * 0.07;
  return isrAnual / 12;
};

// ─── Tipo fila de planilla ────────────────────────────────────────────────────
interface FilaNomina {
  emp_id: number;
  nombre: string;
  apellido: string;
  banco: string;
  cuenta_numero: string;
  cuenta_tipo: string;
  salario_base: number;
  igss_laboral: number;
  isr_mensual: number;
  total_descuentos: number;
  liquido_depositar: number;
}

// NOTA: Salario base temporal hasta tener endpoint de salarios.
// Reemplaza SALARIO_BASE_DEFAULT con tu llamada real cuando esté disponible.
const SALARIO_BASE_DEFAULT = 4000;

function GenerarCSV() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodoId, setPeriodoId] = useState('');
  const [datos, setDatos] = useState<FilaNomina[]>([]);
  const [cargando, setCargando] = useState(false);
  const [generado, setGenerado] = useState(false);
  const [error, setError] = useState('');
  const [periodosListos, setPeriodosListos] = useState(false);

  // Carga períodos solo cuando el usuario abre el Select
  const cargarPeriodos = async () => {
    if (periodosListos) return;
    try {
      const data = await obtenerPeriodos();
      setPeriodos(data);
      setPeriodosListos(true);
    } catch (err: any) {
      setError('Error cargando períodos: ' + err.message);
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
  };

  // ─── Generar planilla con datos reales ───────────────────────────────────────
  const generarPlanilla = async () => {
    if (!periodoId) return;
    try {
      setCargando(true);
      setError('');

      // Llamadas paralelas al backend
      const [empleados, cuentas] = await Promise.all([
        obtenerEmpleados(),
        obtenerCuentas()
      ]);

      // Indexar cuentas por EMP_ID (quedarse con la primera si hay varias)
      const cuentasPorEmp = new Map<number, CuentaBancaria>();
      cuentas.forEach((c) => {
        if (!cuentasPorEmp.has(c.EMP_ID)) cuentasPorEmp.set(c.EMP_ID, c);
      });

      // Solo empleados activos
      const filas: FilaNomina[] = empleados
        .filter((e: Empleado) => e.EMP_ESTADO === 'A')
        .map((emp: Empleado) => {
          const cuenta = cuentasPorEmp.get(emp.EMP_ID);
          const salario = SALARIO_BASE_DEFAULT; // ← reemplazar con API real

          const igss_laboral = salario * TASA_IGSS_LABORAL;
          const isr_mensual = calcularISRMensual(salario);
          const total_descuentos = igss_laboral + isr_mensual;

          return {
            emp_id: emp.EMP_ID,
            nombre: emp.EMP_NOMBRE,
            apellido: emp.EMP_APELLIDO,
            banco: cuenta?.CUE_NOMBRE ?? 'Sin banco',
            cuenta_numero: cuenta?.CUE_NUMERO ?? 'Sin cuenta',
            cuenta_tipo: cuenta?.CUE_TIPO ?? '—',
            salario_base: salario,
            igss_laboral,
            isr_mensual,
            total_descuentos,
            liquido_depositar: Math.max(0, salario - total_descuentos)
          };
        });

      setDatos(filas);
      setGenerado(true);
    } catch (err: any) {
      setError('Error generando planilla: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargando(false);
    }
  };

  // ─── Exportar CSV ─────────────────────────────────────────────────────────
  const exportarCSV = () => {
    if (!datos.length) return;

    const headers = [
      'EMP_ID', 'Nombre', 'Apellido',
      'Banco', 'No. Cuenta', 'Tipo Cuenta',
      'Salario Base',
      'IGSS Laboral (4.83%)',
      'ISR Mensual',
      'Total Descuentos',
      'LIQUIDO A DEPOSITAR'
    ];

    const filas = datos.map((d) => [
      d.emp_id, d.nombre, d.apellido,
      d.banco, d.cuenta_numero, d.cuenta_tipo,
      d.salario_base.toFixed(2),
      d.igss_laboral.toFixed(2),
      d.isr_mensual.toFixed(2),
      d.total_descuentos.toFixed(2),
      d.liquido_depositar.toFixed(2)
    ]);

    const totalFila = [
      'TOTALES', '', '', '', '', '',
      datos.reduce((s, d) => s + d.salario_base, 0).toFixed(2),
      datos.reduce((s, d) => s + d.igss_laboral, 0).toFixed(2),
      datos.reduce((s, d) => s + d.isr_mensual, 0).toFixed(2),
      datos.reduce((s, d) => s + d.total_descuentos, 0).toFixed(2),
      datos.reduce((s, d) => s + d.liquido_depositar, 0).toFixed(2)
    ];

    const periodo = periodoSeleccionado
      ? `${periodoSeleccionado.PER_FECHA_INICIO} al ${periodoSeleccionado.PER_FECHA_FIN}`
      : '';

    const csvContent = [
      [`Planilla de depósitos — Período: ${periodo}`],
      [`Fecha de pago: ${periodoSeleccionado?.PER_FECHA_PAGO ?? ''}`],
      [`Empleados activos: ${datos.length}`],
      [],
      headers,
      ...filas,
      [],
      totalFila
    ].map((r) => r.join(',')).join('\n');

    const BOM = '\uFEFF'; // Excel lee tildes correctamente
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `depositos_periodo${periodoId}_${periodoSeleccionado?.PER_FECHA_PAGO ?? ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totales = {
    ingresos: datos.reduce((s, d) => s + d.salario_base, 0),
    igss: datos.reduce((s, d) => s + d.igss_laboral, 0),
    isr: datos.reduce((s, d) => s + d.isr_mensual, 0),
    descuentos: datos.reduce((s, d) => s + d.total_descuentos, 0),
    liquido: datos.reduce((s, d) => s + d.liquido_depositar, 0),
  };

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <SummarizeIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Generación de Planilla — Depósito Bancario
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Genera el CSV con el líquido a depositar por empleado activo.
          Incluye <strong>IGSS 4.83%</strong> e <strong>ISR (Decreto 10-2012)</strong>.
          Datos obtenidos del sistema en tiempo real.
        </Alert>

        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <FormControl fullWidth>
              <InputLabel>Período de nómina</InputLabel>
              <Select value={periodoId} label="Período de nómina"
                onChange={handlePeriodo} onOpen={cargarPeriodos}>
                <MenuItem value="">Seleccione un período</MenuItem>
                {periodos.map((p) => (
                  <MenuItem key={p.PER_ID} value={String(p.PER_ID)}>
                    {p.PER_FECHA_INICIO} → {p.PER_FECHA_FIN}
                    {p.PER_ESTADO === 'A' ? ' ✓ Activo' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Button fullWidth variant="contained" size="large"
              startIcon={<SummarizeIcon />}
              onClick={generarPlanilla}
              disabled={!periodoId || cargando}>
              {cargando ? 'Generando...' : 'Generar Planilla'}
            </Button>
          </Grid>

          {generado && (
            <Grid size={{ xs: 12, md: 4 }}>
              <Button fullWidth variant="contained" color="success" size="large"
                startIcon={<DownloadIcon />} onClick={exportarCSV}>
                Descargar CSV
              </Button>
            </Grid>
          )}
        </Grid>

        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

        {/* Tarjetas resumen */}
        {generado && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Resumen — {datos.length} empleados activos &nbsp;|&nbsp;
              Fecha pago: <strong>{periodoSeleccionado?.PER_FECHA_PAGO}</strong>
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Total Salarios', valor: totales.ingresos, color: '#1976d2' },
                { label: 'IGSS (4.83%)', valor: totales.igss, color: '#d32f2f' },
                { label: 'ISR Total', valor: totales.isr, color: '#d32f2f' },
                { label: 'Total Descuentos', valor: totales.descuentos, color: '#c62828' },
                { label: 'TOTAL A DEPOSITAR', valor: totales.liquido, color: '#2e7d32' },
              ].map((card) => (
                <Grid key={card.label} size={{ xs: 6, md: 2 }}>
                  <Paper variant="outlined"
                    sx={{ p: 2, textAlign: 'center', borderColor: card.color }}>
                    <Typography variant="caption" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Typography variant="h6"
                      sx={{ color: card.color, fontWeight: 'bold', fontSize: '0.9rem' }}>
                      Q{fmt(card.valor)}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Paper>

      {/* Tabla detalle */}
      {generado && (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Detalle por empleado</Typography>
            <Button variant="outlined" color="success"
              startIcon={<DownloadIcon />} onClick={exportarCSV}>
              Descargar CSV
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Empleado</strong></TableCell>
                  <TableCell><strong>Banco</strong></TableCell>
                  <TableCell><strong>No. Cuenta</strong></TableCell>
                  <TableCell align="right"><strong>Salario Base</strong></TableCell>
                  <TableCell align="right"><strong>IGSS 4.83%</strong></TableCell>
                  <TableCell align="right"><strong>ISR</strong></TableCell>
                  <TableCell align="right"><strong>Total Desc.</strong></TableCell>
                  <TableCell align="right" sx={{ backgroundColor: '#e8f5e9' }}>
                    <strong>LÍQUIDO</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {datos.map((d) => (
                  <TableRow key={d.emp_id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {d.nombre} {d.apellido}
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
                    <TableCell align="right">Q{fmt(d.salario_base)}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      -Q{fmt(d.igss_laboral)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      -Q{fmt(d.isr_mensual)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      -Q{fmt(d.total_descuentos)}
                    </TableCell>
                    <TableCell align="right"
                      sx={{ backgroundColor: '#e8f5e9', fontWeight: 'bold', color: 'success.main' }}>
                      Q{fmt(d.liquido_depositar)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Fila totales */}
                <TableRow sx={{ backgroundColor: '#eeeeee' }}>
                  <TableCell colSpan={3}>
                    <strong>TOTALES — {datos.length} empleados</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>Q{fmt(totales.ingresos)}</strong>
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>
                    <strong>-Q{fmt(totales.igss)}</strong>
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>
                    <strong>-Q{fmt(totales.isr)}</strong>
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>
                    <strong>-Q{fmt(totales.descuentos)}</strong>
                  </TableCell>
                  <TableCell align="right"
                    sx={{ backgroundColor: '#c8e6c9', color: 'success.main', fontSize: '1rem' }}>
                    <strong>Q{fmt(totales.liquido)}</strong>
                  </TableCell>
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