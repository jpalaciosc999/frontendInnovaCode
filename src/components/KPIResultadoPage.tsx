import { useEffect, useMemo, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { KPIResultado, KPIResultadoForm } from '../interfaces/kpi-resultado';
import type { KPI } from '../interfaces/kpi';
import type { Empleado } from '../interfaces/empleados';
import {
  obtenerResultados,
  crearResultado,
  actualizarResultado,
  eliminarResultado
} from '../services/kpi-resultado.service';
import { obtenerKPIs } from '../services/kpi.service';
import { obtenerEmpleados } from '../services/empleados.service';

import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssessmentIcon from '@mui/icons-material/Assessment';

const initialForm: KPIResultadoForm = {
  kre_monto_total: '',
  kre_calculo: '',
  kre_fecha: new Date().toISOString().slice(0, 10),
  kpi_id: '',
  emp_id: ''
};

const obtenerNombreEmpleado = (empleado?: Empleado) =>
  empleado ? `${empleado.EMP_NOMBRE ?? ''} ${empleado.EMP_APELLIDO ?? ''}`.trim() : '';

const formatearMoneda = (valor: number) => `Q${Number(valor || 0).toLocaleString('es-GT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

function KPIResultadoCRUD() {
  const [datos, setDatos] = useState<KPIResultado[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idActual, setIdActual] = useState<number | null>(null);
  const [form, setForm] = useState<KPIResultadoForm>(initialForm);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const [resultadosData, kpisData, empleadosData] = await Promise.all([
        obtenerResultados(),
        obtenerKPIs(),
        obtenerEmpleados(),
      ]);

      setDatos(resultadosData);
      setKpis(kpisData);
      setEmpleados(empleadosData);
    } catch (err: any) {
      setError('Error al cargar resultados, KPIs o empleados: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const kpisPorId = useMemo(
    () => new Map(kpis.map((kpi) => [String(kpi.KPI_ID), kpi])),
    [kpis]
  );

  const empleadosPorId = useMemo(
    () => new Map(empleados.map((empleado) => [String(empleado.EMP_ID), empleado])),
    [empleados]
  );

  const calcularBono = (kpi: KPI | undefined, calculo: string | number) => {
    const valorBase = Number(kpi?.KPI_VALOR || 0);
    const porcentaje = Number(calculo || 0);
    return Math.max(0, (valorBase * porcentaje) / 100);
  };

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name as string]: value };
      const nextKpi = name === 'kpi_id' ? kpisPorId.get(String(value)) : kpisPorId.get(next.kpi_id);

      if (name === 'kre_calculo' || name === 'kpi_id') {
        next.kre_monto_total = calcularBono(nextKpi, next.kre_calculo).toFixed(2);
      }

      return next;
    });
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setIdActual(null);
    setError('');
  };

  const validarFormulario = () => {
    if (
      !form.emp_id?.trim() ||
      !form.kpi_id.trim() ||
      !form.kre_monto_total.trim() ||
      !form.kre_calculo.trim() ||
      !form.kre_fecha.trim()
    ) {
      setError('Empleado, KPI, porcentaje y fecha son obligatorios');
      return false;
    }
    return true;
  };

  const guardar = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && idActual !== null) {
        await actualizarResultado(idActual, form);
        setMensaje('Bono de productividad actualizado correctamente');
      } else {
        await crearResultado(form);
        setMensaje('Bono de productividad asignado correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error al guardar: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (r: KPIResultado) => {
    setModoEdicion(true);
    setIdActual(r.KRE_ID);
    setMensaje('');
    setError('');
    setForm({
      emp_id: r.EMP_ID ? String(r.EMP_ID) : '',
      kpi_id: r.KPI_ID.toString(),
      kre_monto_total: r.KRE_MONTO_TOTAL.toString(),
      kre_calculo: r.KRE_CALCULO.toString(),
      kre_fecha: r.KRE_FECHA ? String(r.KRE_FECHA).split('T')[0] : ''
    });
  };

  const handleEliminar = async (id: number) => {
    const confirmar = window.confirm('Deseas eliminar este bono de productividad?');
    if (!confirmar) return;

    try {
      setError('');
      setMensaje('');
      await eliminarResultado(id);
      setMensaje('Bono eliminado correctamente');

      if (idActual === id) {
        limpiarFormulario();
      }

      await cargarDatos();
    } catch (err: any) {
      setError('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  const obtenerChipCalculo = (calculo: number) => {
    if (calculo >= 90) return <Chip label={`${calculo}%`} color="success" size="small" />;
    if (calculo >= 70) return <Chip label={`${calculo}%`} color="warning" size="small" />;
    return <Chip label={`${calculo}%`} color="error" size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando bonos de productividad...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AssessmentIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Bonos de Productividad por Empleado
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Selecciona un KPI, asigna el porcentaje de productividad por empleado y el sistema calcula el bono automaticamente.
        </Alert>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar bono' : 'Asignacion individual'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Empleado</InputLabel>
              <Select name="emp_id" value={form.emp_id ?? ''} label="Empleado" onChange={handleChange}>
                {empleados.map((empleado) => (
                  <MenuItem key={empleado.EMP_ID} value={String(empleado.EMP_ID)}>
                    {obtenerNombreEmpleado(empleado)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>KPI</InputLabel>
              <Select name="kpi_id" value={form.kpi_id} label="KPI" onChange={handleChange}>
                {kpis.map((kpi) => (
                  <MenuItem key={kpi.KPI_ID} value={String(kpi.KPI_ID)}>
                    {kpi.KPI_NOMBRE} - Base {formatearMoneda(kpi.KPI_VALOR)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Productividad"
              name="kre_calculo"
              type="number"
              value={form.kre_calculo}
              onChange={handleChange}
              slotProps={{
                htmlInput: { min: 0, max: 100, step: 0.01 },
                input: { endAdornment: <InputAdornment position="end">%</InputAdornment> },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Bono calculado"
              name="kre_monto_total"
              type="number"
              value={form.kre_monto_total}
              onChange={handleChange}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">Q</InputAdornment>,
                }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Fecha"
              name="kre_fecha"
              type="date"
              value={form.kre_fecha}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardar}
              >
                {modoEdicion ? 'Actualizar' : 'Guardar bono'}
              </Button>

              <Button
                variant="outlined"
                color="secondary"
                startIcon={<CleaningServicesIcon />}
                onClick={limpiarFormulario}
              >
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Bonos registrados: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>KPI</strong></TableCell>
                <TableCell><strong>Bono</strong></TableCell>
                <TableCell><strong>Productividad</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((r) => {
                  const empleado = empleadosPorId.get(String(r.EMP_ID));
                  const kpi = kpisPorId.get(String(r.KPI_ID));

                  return (
                    <TableRow key={r.KRE_ID} hover>
                      <TableCell>{r.KRE_ID}</TableCell>
                      <TableCell>{obtenerNombreEmpleado(empleado) || `Empleado #${r.EMP_ID ?? '-'}`}</TableCell>
                      <TableCell>{kpi?.KPI_NOMBRE ?? `KPI #${r.KPI_ID}`}</TableCell>
                      <TableCell>{formatearMoneda(Number(r.KRE_MONTO_TOTAL))}</TableCell>
                      <TableCell>{obtenerChipCalculo(Number(r.KRE_CALCULO))}</TableCell>
                      <TableCell>
                        {r.KRE_FECHA
                          ? new Date(r.KRE_FECHA).toLocaleDateString('es-GT')
                          : ''}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditar(r)}
                          >
                            Editar
                          </Button>

                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleEliminar(r.KRE_ID)}
                          >
                            Eliminar
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay bonos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar
        open={!!mensaje}
        autoHideDuration={3000}
        onClose={() => setMensaje('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setMensaje('')} sx={{ width: '100%' }}>
          {mensaje}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default KPIResultadoCRUD;
