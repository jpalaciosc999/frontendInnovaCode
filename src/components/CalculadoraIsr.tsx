import { useEffect, useState } from 'react';
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
import { obtenerEmpleados } from '../services/empleados.service';
import type { Empleado } from '../interfaces/empleados';

const SALARIO_BASE_DEFAULT = 4000;

const calcularISR = (salarioMensual: number) => {
  const anual = salarioMensual * 12;
  const imponible = Math.max(0, anual - 60_000 - 48_000);
  if (imponible <= 0) return { isr_anual: 0, isr_mensual: 0, imponible, detalle: 'No aplica ISR' };
  let isr_anual = 0;
  let detalle = '';
  if (imponible <= 300_000) {
    isr_anual = imponible * 0.05;
    detalle = `Q${imponible.toLocaleString('es-GT')} × 5%`;
  } else {
    isr_anual = 15_000 + (imponible - 300_000) * 0.07;
    detalle = `Q15,000 + (Q${(imponible - 300_000).toLocaleString('es-GT')} × 7%)`;
  }
  return { isr_anual, isr_mensual: isr_anual / 12, imponible, detalle };
};

interface FilaISR {
  emp_id: number;
  nombre: string;
  apellido: string;
  salario: number;
  renta_imponible: number;
  isr_anual: number;
  isr_mensual: number;
}

function CalculadoraISR() {
  const [salarioMensual, setSalarioMensual] = useState('');
  const [empleados, setEmpleados] = useState<FilaISR[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await obtenerEmpleados();
        const filas = data
          .filter((e: Empleado) => e.EMP_ESTADO === 'A')
          .map((e: Empleado) => {
            const salario = SALARIO_BASE_DEFAULT;
            const { isr_anual, isr_mensual, imponible } = calcularISR(salario);
            return {
              emp_id: e.EMP_ID,
              nombre: e.EMP_NOMBRE,
              apellido: e.EMP_APELLIDO,
              salario,
              renta_imponible: imponible,
              isr_anual,
              isr_mensual
            };
          });
        setEmpleados(filas);
      } catch (err: any) {
        setError('Error cargando empleados: ' + err.message);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const resultado = salarioMensual ? calcularISR(Number(salarioMensual)) : null;

  const fmt = (v: number) =>
    `Q ${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Box sx={{ py: 2 }}>
      {/* Calculadora individual */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <GavelIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Calculadora ISR</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Decreto 10-2012 SAT Guatemala</strong> &nbsp;|&nbsp;
          Deducción personal: <strong>Q60,000</strong> &nbsp;|&nbsp;
          Renta exenta: <strong>Q48,000</strong>
        </Alert>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Salario mensual (Q)" type="number"
              value={salarioMensual} onChange={(e) => setSalarioMensual(e.target.value)} />
          </Grid>
        </Grid>

        {resultado && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>Desglose del cálculo anual</Typography>
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>Salario anual (× 12)</TableCell>
                    <TableCell align="right">{fmt(Number(salarioMensual) * 12)}</TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#fff3e0' }}>
                    <TableCell>(-) Deducción personal</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>-Q 60,000.00</TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#fff3e0' }}>
                    <TableCell>(-) Renta exenta</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main' }}>-Q 48,000.00</TableCell>
                  </TableRow>
                  <TableRow sx={{ backgroundColor: '#e8f5e9' }}>
                    <TableCell><strong>= Renta imponible anual</strong></TableCell>
                    <TableCell align="right"><strong>{fmt(resultado.imponible)}</strong></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Fórmula aplicada</TableCell>
                    <TableCell align="right">{resultado.detalle}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

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
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>

      {/* Tabla empleados reales */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          ISR por empleado — {cargando ? 'Cargando...' : `${empleados.length} empleados activos`}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell align="right"><strong>Salario Mensual</strong></TableCell>
                <TableCell align="right"><strong>Renta Imponible Anual</strong></TableCell>
                <TableCell align="right"><strong>ISR Anual</strong></TableCell>
                <TableCell align="right"><strong>ISR Mensual</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empleados.map((e) => (
                <TableRow key={e.emp_id} hover>
                  <TableCell>{e.emp_id}</TableCell>
                  <TableCell>{e.nombre} {e.apellido}</TableCell>
                  <TableCell align="right">{fmt(e.salario)}</TableCell>
                  <TableCell align="right">{fmt(e.renta_imponible)}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>{fmt(e.isr_anual)}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                    -{fmt(e.isr_mensual)}
                  </TableCell>
                </TableRow>
              ))}
              {!cargando && empleados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No hay empleados activos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Tabla referencia rangos */}
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
                <TableCell><strong>Sobre excedente de</strong></TableCell>
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
      </Paper>
    </Box>
  );
}

export default CalculadoraISR;