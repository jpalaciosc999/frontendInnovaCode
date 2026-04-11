import { useState, useEffect } from 'react';
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

// ─── Constantes ───────────────────────────────────────────────────────────────
const TASA_IGSS_LABORAL = 0.0483;
const TASA_IGSS_PATRONAL = 0.1267;

const calcularISRMensual = (salarioMensual: number): number => {
  const anual = salarioMensual * 12;
  const imponible = Math.max(0, anual - 60_000 - 48_000);
  if (imponible <= 0) return 0;
  const isrAnual = imponible <= 300_000
    ? imponible * 0.05
    : 15_000 + (imponible - 300_000) * 0.07;
  return isrAnual / 12;
};

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface FilaNomina {
  emp_id: number;
  nombre: string;
  apellido: string;
  cuenta_bancaria: string;
  banco: string;
  salario_base: number;
  horas_extra: number;
  bono_productividad: number;
  // Descuentos
  igss_laboral: number;
  isr_mensual: number;
  cuota_prestamo: number;
  otros_descuentos: number;
  // Calculados
  total_ingresos: number;
  total_descuentos: number;
  liquido_depositar: number;
}

// ─── Datos de ejemplo — reemplazar con tu API ─────────────────────────────────
const generarDatosEjemplo = (): FilaNomina[] => {
  const empleados = [
    { emp_id: 1, nombre: 'Juan', apellido: 'Pérez', cuenta: '001-123456-7', banco: 'Banrural', salario: 5000, horas_extra: 200, bono: 500, prestamo: 416.67, otros: 100 },
    { emp_id: 2, nombre: 'María', apellido: 'López', cuenta: '002-789012-3', banco: 'G&T Continental', salario: 6500, horas_extra: 0, bono: 0, prestamo: 0, otros: 50 },
    { emp_id: 3, nombre: 'Carlos', apellido: 'García', cuenta: '003-345678-9', banco: 'BAM', salario: 4000, horas_extra: 150, bono: 300, prestamo: 1000, otros: 0 },
    { emp_id: 4, nombre: 'Ana', apellido: 'Martínez', cuenta: '004-901234-5', banco: 'Banrural', salario: 7000, horas_extra: 0, bono: 1000, prestamo: 583.33, otros: 200 },
  ];

  return empleados.map((e) => {
    const total_ingresos = e.salario + e.horas_extra + e.bono;
    const igss_laboral = e.salario * TASA_IGSS_LABORAL;
    const isr_mensual = calcularISRMensual(e.salario);
    const total_descuentos = igss_laboral + isr_mensual + e.prestamo + e.otros;
    const liquido = total_ingresos - total_descuentos;

    return {
      emp_id: e.emp_id,
      nombre: e.nombre,
      apellido: e.apellido,
      cuenta_bancaria: e.cuenta,
      banco: e.banco,
      salario_base: e.salario,
      horas_extra: e.horas_extra,
      bono_productividad: e.bono,
      igss_laboral,
      isr_mensual,
      cuota_prestamo: e.prestamo,
      otros_descuentos: e.otros,
      total_ingresos,
      total_descuentos,
      liquido_depositar: Math.max(0, liquido)
    };
  });
};

// ─── Períodos de ejemplo ──────────────────────────────────────────────────────
const periodos = [
  { id: 1, label: 'Abril 2025 (01/04 - 30/04)', fecha_pago: '2025-04-30' },
  { id: 2, label: 'Marzo 2025 (01/03 - 31/03)', fecha_pago: '2025-03-31' },
  { id: 3, label: 'Febrero 2025 (01/02 - 28/02)', fecha_pago: '2025-02-28' },
];

function GenerarCSV() {
  const [periodoId, setPeriodoId] = useState('');
  const [datos, setDatos] = useState<FilaNomina[]>([]);
  const [generado, setGenerado] = useState(false);

  const periodoSeleccionado = periodos.find((p) => p.id === Number(periodoId));

  const fmt = (v: number) =>
    v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handlePeriodo = (e: SelectChangeEvent) => {
    setPeriodoId(e.target.value);
    setGenerado(false);
    setDatos([]);
  };

  const generarPlanilla = () => {
    if (!periodoId) return;
    setDatos(generarDatosEjemplo());
    setGenerado(true);
  };

  const exportarCSV = () => {
    if (!datos.length) return;

    const headers = [
      'EMP_ID',
      'Nombre',
      'Apellido',
      'Banco',
      'Cuenta Bancaria',
      'Salario Base',
      'Horas Extra',
      'Bono Productividad',
      'Total Ingresos',
      'IGSS Laboral (4.83%)',
      'ISR Mensual',
      'Cuota Préstamo',
      'Otros Descuentos',
      'Total Descuentos',
      'LIQUIDO A DEPOSITAR'
    ];

    const filas = datos.map((d) => [
      d.emp_id,
      d.nombre,
      d.apellido,
      d.banco,
      d.cuenta_bancaria,
      d.salario_base.toFixed(2),
      d.horas_extra.toFixed(2),
      d.bono_productividad.toFixed(2),
      d.total_ingresos.toFixed(2),
      d.igss_laboral.toFixed(2),
      d.isr_mensual.toFixed(2),
      d.cuota_prestamo.toFixed(2),
      d.otros_descuentos.toFixed(2),
      d.total_descuentos.toFixed(2),
      d.liquido_depositar.toFixed(2)
    ]);

    // Fila de totales al final
    const totales = [
      'TOTALES', '', '', '', '',
      datos.reduce((s, d) => s + d.salario_base, 0).toFixed(2),
      datos.reduce((s, d) => s + d.horas_extra, 0).toFixed(2),
      datos.reduce((s, d) => s + d.bono_productividad, 0).toFixed(2),
      datos.reduce((s, d) => s + d.total_ingresos, 0).toFixed(2),
      datos.reduce((s, d) => s + d.igss_laboral, 0).toFixed(2),
      datos.reduce((s, d) => s + d.isr_mensual, 0).toFixed(2),
      datos.reduce((s, d) => s + d.cuota_prestamo, 0).toFixed(2),
      datos.reduce((s, d) => s + d.otros_descuentos, 0).toFixed(2),
      datos.reduce((s, d) => s + d.total_descuentos, 0).toFixed(2),
      datos.reduce((s, d) => s + d.liquido_depositar, 0).toFixed(2)
    ];

    const periodo = periodoSeleccionado?.label ?? '';
    const fechaPago = periodoSeleccionado?.fecha_pago ?? '';

    const csvContent = [
      [`Planilla de depósitos — ${periodo}`],
      [`Fecha de pago: ${fechaPago}`],
      [],
      headers,
      ...filas,
      [],
      totales
    ].map((r) => r.join(',')).join('\n');

    const BOM = '\uFEFF'; // Para que Excel abra correctamente con tildes
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `depositos_${periodoId}_${fechaPago}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Totales para la tabla resumen
  const totales = {
    ingresos: datos.reduce((s, d) => s + d.total_ingresos, 0),
    igss: datos.reduce((s, d) => s + d.igss_laboral, 0),
    isr: datos.reduce((s, d) => s + d.isr_mensual, 0),
    prestamos: datos.reduce((s, d) => s + d.cuota_prestamo, 0),
    otros: datos.reduce((s, d) => s + d.otros_descuentos, 0),
    descuentos: datos.reduce((s, d) => s + d.total_descuentos, 0),
    liquido: datos.reduce((s, d) => s + d.liquido_depositar, 0),
  };

  return (
    <Box sx={{ py: 2 }}>
      {/* Selector de período */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <SummarizeIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Generación de Planilla — Depósito Bancario
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Genera el archivo CSV con el líquido a depositar a cada empleado,
          incluyendo <strong>IGSS (4.83%)</strong>, <strong>ISR</strong>,
          cuotas de préstamo y otros descuentos.
        </Alert>

        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <FormControl fullWidth>
              <InputLabel>Seleccionar período de nómina</InputLabel>
              <Select value={periodoId} label="Seleccionar período de nómina"
                onChange={handlePeriodo}>
                <MenuItem value="">Seleccione un período</MenuItem>
                {periodos.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>{p.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <Button fullWidth variant="contained" size="large"
              startIcon={<SummarizeIcon />}
              onClick={generarPlanilla} disabled={!periodoId}>
              Generar Planilla
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

        {/* Tarjetas resumen */}
        {generado && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              Resumen — {periodoSeleccionado?.label}
            </Typography>
            <Grid container spacing={2}>
              {[
                { label: 'Total Ingresos', valor: totales.ingresos, color: '#1976d2' },
                { label: 'Total IGSS (4.83%)', valor: totales.igss, color: '#d32f2f' },
                { label: 'Total ISR', valor: totales.isr, color: '#d32f2f' },
                { label: 'Total Préstamos', valor: totales.prestamos, color: '#ed6c02' },
                { label: 'Total Descuentos', valor: totales.descuentos, color: '#d32f2f' },
                { label: 'TOTAL A DEPOSITAR', valor: totales.liquido, color: '#2e7d32' },
              ].map((card) => (
                <Grid key={card.label} size={{ xs: 6, md: 2 }}>
                  <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: card.color }}>
                    <Typography variant="caption" color="text.secondary">
                      {card.label}
                    </Typography>
                    <Typography variant="h6" sx={{ color: card.color, fontWeight: 'bold', fontSize: '0.95rem' }}>
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
            <Typography variant="h6">
              Detalle por empleado — {datos.length} registros
            </Typography>
            <Button variant="outlined" color="success" startIcon={<DownloadIcon />}
              onClick={exportarCSV}>
              Descargar CSV
            </Button>
          </Box>

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell><strong>Empleado</strong></TableCell>
                  <TableCell><strong>Banco / Cuenta</strong></TableCell>
                  <TableCell align="right"><strong>Salario Base</strong></TableCell>
                  <TableCell align="right"><strong>Extras/Bonos</strong></TableCell>
                  <TableCell align="right"><strong>Total Ingresos</strong></TableCell>
                  <TableCell align="right"><strong>IGSS 4.83%</strong></TableCell>
                  <TableCell align="right"><strong>ISR</strong></TableCell>
                  <TableCell align="right"><strong>Préstamo</strong></TableCell>
                  <TableCell align="right"><strong>Otros</strong></TableCell>
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
                    <TableCell>
                      <Typography variant="body2">{d.banco}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {d.cuenta_bancaria}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">Q{fmt(d.salario_base)}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main' }}>
                      +Q{fmt(d.horas_extra + d.bono_productividad)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      Q{fmt(d.total_ingresos)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      -Q{fmt(d.igss_laboral)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      -Q{fmt(d.isr_mensual)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'warning.main' }}>
                      {d.cuota_prestamo > 0 ? `-Q${fmt(d.cuota_prestamo)}` : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>
                      {d.otros_descuentos > 0 ? `-Q${fmt(d.otros_descuentos)}` : '—'}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      -Q{fmt(d.total_descuentos)}
                    </TableCell>
                    <TableCell align="right"
                      sx={{ backgroundColor: '#e8f5e9', fontWeight: 'bold', color: 'success.main', fontSize: '1rem' }}>
                      Q{fmt(d.liquido_depositar)}
                    </TableCell>
                  </TableRow>
                ))}

                {/* Fila de totales */}
                <TableRow sx={{ backgroundColor: '#eeeeee' }}>
                  <TableCell colSpan={2}><strong>TOTALES ({datos.length} empleados)</strong></TableCell>
                  <TableCell align="right"><strong>Q{fmt(datos.reduce((s, d) => s + d.salario_base, 0))}</strong></TableCell>
                  <TableCell align="right"><strong>Q{fmt(datos.reduce((s, d) => s + d.horas_extra + d.bono_productividad, 0))}</strong></TableCell>
                  <TableCell align="right"><strong>Q{fmt(totales.ingresos)}</strong></TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}><strong>-Q{fmt(totales.igss)}</strong></TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}><strong>-Q{fmt(totales.isr)}</strong></TableCell>
                  <TableCell align="right" sx={{ color: 'warning.main' }}><strong>-Q{fmt(totales.prestamos)}</strong></TableCell>
                  <TableCell align="right"><strong>-Q{fmt(totales.otros)}</strong></TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}><strong>-Q{fmt(totales.descuentos)}</strong></TableCell>
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