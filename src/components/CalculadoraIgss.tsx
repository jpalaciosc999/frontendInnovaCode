import { useEffect, useState } from 'react';
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
import DownloadIcon from '@mui/icons-material/Download';

import { obtenerEmpleados } from '../services/empleados.service';
import type { Empleado } from '../interfaces/empleados';

const TASA_LABORAL = 0.0483;
const TASA_PATRONAL = 0.1267;
const SALARIO_BASE_DEFAULT = 4000; // reemplazar cuando tengas endpoint de salarios

interface FilaIGSS {
  emp_id: number;
  nombre: string;
  apellido: string;
  salario: number;
  cuota_laboral: number;
  cuota_patronal: number;
  total_igss: number;
}

function CalculadoraIGSS() {
  const [salarioBase, setSalarioBase] = useState('');
  const [empleados, setEmpleados] = useState<FilaIGSS[]>([]);
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
            return {
              emp_id: e.EMP_ID,
              nombre: e.EMP_NOMBRE,
              apellido: e.EMP_APELLIDO,
              salario,
              cuota_laboral: salario * TASA_LABORAL,
              cuota_patronal: salario * TASA_PATRONAL,
              total_igss: salario * (TASA_LABORAL + TASA_PATRONAL)
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

  const cuotaLaboral = Number(salarioBase) * TASA_LABORAL;
  const cuotaPatronal = Number(salarioBase) * TASA_PATRONAL;
  const totalIGSS = cuotaLaboral + cuotaPatronal;

  const fmt = (v: number) =>
    `Q ${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const exportarCSV = () => {
    const headers = ['EMP_ID', 'Nombre', 'Apellido', 'Salario', 'Cuota Laboral (4.83%)', 'Cuota Patronal (12.67%)', 'Total IGSS'];
    const filas = empleados.map((e) => [
      e.emp_id, e.nombre, e.apellido,
      e.salario.toFixed(2), e.cuota_laboral.toFixed(2),
      e.cuota_patronal.toFixed(2), e.total_igss.toFixed(2)
    ]);
    const totalFila = ['TOTALES', '', '',
      empleados.reduce((s, e) => s + e.salario, 0).toFixed(2),
      empleados.reduce((s, e) => s + e.cuota_laboral, 0).toFixed(2),
      empleados.reduce((s, e) => s + e.cuota_patronal, 0).toFixed(2),
      empleados.reduce((s, e) => s + e.total_igss, 0).toFixed(2)
    ];
    const csv = [headers, ...filas, [], totalFila].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'planilla_igss.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <HealthAndSafetyIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Calculadora IGSS</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          Cuota laboral (empleado): <strong>4.83%</strong> &nbsp;|&nbsp;
          Cuota patronal (empresa): <strong>12.67%</strong>
        </Alert>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Salario base (Q)" type="number"
              value={salarioBase} onChange={(e) => setSalarioBase(e.target.value)} />
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
                  <Typography variant="caption" color="text.secondary">Cuota laboral (4.83%)</Typography>
                  <Typography variant="h5" color="error" sx={{ fontWeight: 'bold' }}>
                    -{fmt(cuotaLaboral)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Se descuenta del salario</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper variant="outlined" sx={{ p: 2, textAlign: 'center', borderColor: '#2e7d32' }}>
                  <Typography variant="caption" color="text.secondary">Cuota patronal (12.67%)</Typography>
                  <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                    {fmt(cuotaPatronal)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">Lo paga la empresa</Typography>
                </Paper>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 2, textAlign: 'center', backgroundColor: '#1976d2', color: 'white' }}>
                  <Typography variant="caption">Total aportado al IGSS (laboral + patronal)</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>{fmt(totalIGSS)}</Typography>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Planilla IGSS — {cargando ? 'Cargando...' : `${empleados.length} empleados activos`}
          </Typography>
          <Button variant="contained" color="success" startIcon={<DownloadIcon />}
            onClick={exportarCSV} disabled={empleados.length === 0}>
            Exportar CSV
          </Button>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
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
                  <TableCell>{e.emp_id}</TableCell>
                  <TableCell>{e.nombre} {e.apellido}</TableCell>
                  <TableCell align="right">{fmt(e.salario)}</TableCell>
                  <TableCell align="right" sx={{ color: 'error.main' }}>-{fmt(e.cuota_laboral)}</TableCell>
                  <TableCell align="right" sx={{ color: 'success.main' }}>{fmt(e.cuota_patronal)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{fmt(e.total_igss)}</TableCell>
                </TableRow>
              ))}
              {empleados.length > 0 && (
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell colSpan={2}><strong>TOTALES</strong></TableCell>
                  <TableCell align="right"><strong>{fmt(empleados.reduce((s, e) => s + e.salario, 0))}</strong></TableCell>
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
              )}
              {!cargando && empleados.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No hay empleados activos</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default CalculadoraIGSS;