import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
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

import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import CalculateIcon from '@mui/icons-material/Calculate';
import DownloadIcon from '@mui/icons-material/Download';

// Tasas IGSS Guatemala vigentes
const TASA_LABORAL = 0.0483;   // 4.83% empleado
const TASA_PATRONAL = 0.1267;  // 12.67% patrono

interface FilaIGSS {
  emp_id: number;
  nombre: string;
  salario: number;
  cuota_laboral: number;
  cuota_patronal: number;
  total_igss: number;
}

function CalculadoraIGSS() {
  const [salarioBase, setSalarioBase] = useState('');
  const [cuotaLaboral, setCuotaLaboral] = useState(0);
  const [cuotaPatronal, setCuotaPatronal] = useState(0);
  const [totalIGSS, setTotalIGSS] = useState(0);

  // Simulación de empleados — en producción esto vendría de tu API
  const [empleados] = useState<FilaIGSS[]>([
    { emp_id: 1, nombre: 'Juan Pérez', salario: 4000, cuota_laboral: 4000 * TASA_LABORAL, cuota_patronal: 4000 * TASA_PATRONAL, total_igss: 4000 * (TASA_LABORAL + TASA_PATRONAL) },
    { emp_id: 2, nombre: 'María López', salario: 5500, cuota_laboral: 5500 * TASA_LABORAL, cuota_patronal: 5500 * TASA_PATRONAL, total_igss: 5500 * (TASA_LABORAL + TASA_PATRONAL) },
    { emp_id: 3, nombre: 'Carlos García', salario: 3500, cuota_laboral: 3500 * TASA_LABORAL, cuota_patronal: 3500 * TASA_PATRONAL, total_igss: 3500 * (TASA_LABORAL + TASA_PATRONAL) },
  ]);

  useEffect(() => {
    const salario = Number(salarioBase || 0);
    const laboral = salario * TASA_LABORAL;
    const patronal = salario * TASA_PATRONAL;
    setCuotaLaboral(laboral);
    setCuotaPatronal(patronal);
    setTotalIGSS(laboral + patronal);
  }, [salarioBase]);

  const fmt = (valor: number) =>
    `Q ${valor.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const exportarCSV = () => {
    const headers = ['EMP_ID', 'Nombre', 'Salario', 'Cuota Laboral (4.83%)', 'Cuota Patronal (12.67%)', 'Total IGSS'];
    const filas = empleados.map((e) => [
      e.emp_id,
      e.nombre,
      e.salario.toFixed(2),
      e.cuota_laboral.toFixed(2),
      e.cuota_patronal.toFixed(2),
      e.total_igss.toFixed(2)
    ]);
    const csv = [headers, ...filas].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'igss_planilla.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ py: 2 }}>
      {/* Calculadora individual */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <HealthAndSafetyIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Calculadora IGSS
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Tasas vigentes — Cuota laboral (empleado): <strong>4.83%</strong> &nbsp;|&nbsp;
          Cuota patronal (empresa): <strong>12.67%</strong>
        </Alert>

        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Salario base (Q)"
              type="number"
              value={salarioBase}
              onChange={(e) => setSalarioBase(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } } as any}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" startIcon={<CalculateIcon />}
                onClick={() => setSalarioBase(salarioBase)}>
                Calcular
              </Button>
            </Box>
          </Grid>
        </Grid>

        {Number(salarioBase) > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: '#1976d2' }}>
                  <Typography variant="caption" color="text.secondary">Salario base</Typography>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                    {fmt(Number(salarioBase))}
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: '#d32f2f' }}>
                  <Typography variant="caption" color="text.secondary">
                    Cuota laboral empleado (4.83%)
                  </Typography>
                  <Typography variant="h5" color="error" sx={{ fontWeight: 'bold' }}>
                    -{fmt(cuotaLaboral)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Se descuenta del salario
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: '#2e7d32' }}>
                  <Typography variant="caption" color="text.secondary">
                    Cuota patronal empresa (12.67%)
                  </Typography>
                  <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {fmt(cuotaPatronal)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Lo paga la empresa
                  </Typography>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#1976d2', color: 'white' }}>
                  <Typography variant="caption">Total aportado al IGSS</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {fmt(totalIGSS)}
                  </Typography>
                  <Typography variant="caption">
                    (laboral + patronal)
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>

      {/* Tabla planilla IGSS */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Planilla IGSS — {empleados.length} empleados
          </Typography>
          <Button variant="contained" color="success" startIcon={<DownloadIcon />}
            onClick={exportarCSV}>
            Exportar CSV
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell align="right"><strong>Salario</strong></TableCell>
                <TableCell align="right"><strong>Cuota Laboral (4.83%)</strong></TableCell>
                <TableCell align="right"><strong>Cuota Patronal (12.67%)</strong></TableCell>
                <TableCell align="right"><strong>Total IGSS</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {empleados.map((e) => (
                <TableRow key={e.emp_id} hover>
                  <TableCell>{e.nombre}</TableCell>
                  <TableCell align="right">{fmt(e.salario)}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>
                    -{fmt(e.cuota_laboral)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: 'success.main' }}>
                    {fmt(e.cuota_patronal)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {fmt(e.total_igss)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Totales */}
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>TOTALES</strong></TableCell>
                <TableCell align="right">
                  <strong>{fmt(empleados.reduce((s, e) => s + e.salario, 0))}</strong>
                </TableCell>
                <TableCell align="right" sx={{ color: 'error.main' }}>
                  <strong>-{fmt(empleados.reduce((s, e) => s + e.cuota_laboral, 0))}</strong>
                </TableCell>
                <TableCell align="right" sx={{ color: 'success.main' }}>
                  <strong>{fmt(empleados.reduce((s, e) => s + e.cuota_patronal, 0))}</strong>
                </TableCell>
                <TableCell align="right">
                  <strong>{fmt(empleados.reduce((s, e) => s + e.total_igss, 0))}</strong>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default CalculadoraIGSS;