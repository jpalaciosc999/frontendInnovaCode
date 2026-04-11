import { useState } from 'react';
import {
  Alert,
  Box,
  Divider,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

import GavelIcon from '@mui/icons-material/Gavel';

// ─── Parámetros ISR Guatemala 2024 ───────────────────────────────────────────
const RENTA_EXENTA = 48_000;       // Q48,000 anuales libres de ISR
const DEDUCCION_PERSONAL = 60_000; // Q60,000 deducción personal anual (planilla)

// Tabla de rangos (Decreto 10-2012 art. 72, Guatemala)
// Aplica sobre renta imponible ANUAL
// Tramo 1: hasta Q300,000 → 5%
// Tramo 2: más de Q300,000 → Q15,000 fijos + 7% sobre el excedente de Q300,000

function calcularISR(salarioMensual: number): {
  salario_anual: number;
  renta_bruta: number;
  deduccion_personal: number;
  renta_exenta: number;
  renta_imponible: number;
  isr_anual: number;
  isr_mensual: number;
  detalle: string;
} {
  const salario_anual = salarioMensual * 12;
  // Renta bruta = salario anual (sin bonos en este cálculo base)
  const renta_bruta = salario_anual;
  // Deducciones
  const deduccion_personal = DEDUCCION_PERSONAL;
  const renta_exenta = RENTA_EXENTA;
  // Renta imponible
  const renta_imponible = Math.max(0, renta_bruta - deduccion_personal - renta_exenta);

  let isr_anual = 0;
  let detalle = '';

  if (renta_imponible <= 0) {
    detalle = 'No aplica ISR (renta imponible ≤ 0)';
  } else if (renta_imponible <= 300_000) {
    isr_anual = renta_imponible * 0.05;
    detalle = `Q${renta_imponible.toLocaleString('es-GT')} × 5%`;
  } else {
    const excedente = renta_imponible - 300_000;
    isr_anual = 15_000 + excedente * 0.07;
    detalle = `Q15,000 fijos + (Q${excedente.toLocaleString('es-GT')} × 7%)`;
  }

  const isr_mensual = isr_anual / 12;

  return {
    salario_anual,
    renta_bruta,
    deduccion_personal,
    renta_exenta,
    renta_imponible,
    isr_anual,
    isr_mensual,
    detalle
  };
}

function CalculadoraISR() {
  const [salarioMensual, setSalarioMensual] = useState('');

  const resultado = salarioMensual ? calcularISR(Number(salarioMensual)) : null;

  const fmt = (valor: number) =>
    `Q ${valor.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <GavelIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Calculadora ISR
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Cálculo basado en <strong>Decreto 10-2012 SAT Guatemala</strong>. &nbsp;
          Deducción personal: <strong>Q60,000</strong> &nbsp;|&nbsp;
          Renta exenta: <strong>Q48,000</strong>
        </Alert>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Salario mensual (Q)"
              type="number"
              value={salarioMensual}
              onChange={(e) => setSalarioMensual(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } } as any}
            />
          </Grid>
        </Grid>

        {resultado && (
          <>
            <Divider sx={{ my: 3 }} />

            {/* Desglose del cálculo */}
            <Typography variant="h6" sx={{ mb: 2 }}>Desglose del cálculo anual</Typography>

            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Salario mensual</TableCell>
                    <TableCell align="right">{fmt(Number(salarioMensual))}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Salario anual (× 12)</TableCell>
                    <TableCell align="right">{fmt(resultado.salario_anual)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#fff3e0' }}>
                    <TableCell>(-) Deducción personal</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      -{fmt(resultado.deduccion_personal)}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#fff3e0' }}>
                    <TableCell>(-) Renta exenta</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>
                      -{fmt(resultado.renta_exenta)}
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#e8f5e9' }}>
                    <TableCell><strong>= Renta imponible anual</strong></TableCell>
                    <TableCell align="right">
                      <strong>{fmt(resultado.renta_imponible)}</strong>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Fórmula aplicada</TableCell>
                    <TableCell align="right">{resultado.detalle}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Resultado final */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: '#d32f2f' }}>
                  <Typography variant="caption" color="text.secondary">ISR Anual a retener</Typography>
                  <Typography variant="h4" color="error" sx={{ fontWeight: 'bold' }}>
                    {fmt(resultado.isr_anual)}
                  </Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#d32f2f', color: 'white' }}>
                  <Typography variant="caption">ISR mensual a descontar</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    -{fmt(resultado.isr_mensual)}
                  </Typography>
                  <Typography variant="caption">Se descuenta del salario cada mes</Typography>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>

      {/* Tabla de referencia de rangos */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Tabla de rangos ISR Guatemala (Decreto 10-2012)
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Renta imponible anual</strong></TableCell>
                <TableCell align="right"><strong>Cuota fija</strong></TableCell>
                <TableCell align="right"><strong>Tasa</strong></TableCell>
                <TableCell><strong>Sobre el excedente de</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow hover>
                <TableCell>Q0.01 — Q300,000.00</TableCell>
                <TableCell align="right">Q0.00</TableCell>
                <TableCell align="right">5%</TableCell>
                <TableCell>Q0.00</TableCell>
              </TableRow>
              <TableRow hover>
                <TableCell>Más de Q300,000.00</TableCell>
                <TableCell align="right">Q15,000.00</TableCell>
                <TableCell align="right">7%</TableCell>
                <TableCell>Q300,000.00</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Alert severity="warning" sx={{ mt: 2 }}>
          <strong>Nota:</strong> Este cálculo es el ISR base sobre salario. 
        </Alert>
      </Paper>
    </Box>
  );
}

export default CalculadoraISR;