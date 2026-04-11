import { useEffect, useState } from 'react';
import type { KPIResultado, KPIResultadoForm } from '../interfaces/kpi-resultado';
import {
  obtenerResultados,
  crearResultado,
  actualizarResultado,
  eliminarResultado
} from '../services/kpi-resultado.service';

import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
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
  kre_fecha: '',
  kpi_id: ''
};

function KPIResultadoCRUD() {
  const [datos, setDatos] = useState<KPIResultado[]>([]);
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
      const data = await obtenerResultados();
      setDatos(data);
    } catch (err: any) {
      setError('Error al cargar resultados: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setIdActual(null);
    setError('');
  };

  const validarFormulario = () => {
    if (
      !form.kpi_id.trim() ||
      !form.kre_monto_total.trim() ||
      !form.kre_calculo.trim() ||
      !form.kre_fecha.trim()
    ) {
      setError('Todos los campos son obligatorios');
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
        setMensaje('Resultado actualizado correctamente');
      } else {
        await crearResultado(form);
        setMensaje('Resultado creado correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError(
        'Error al guardar: ' + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEditar = (r: KPIResultado) => {
    setModoEdicion(true);
    setIdActual(r.KRE_ID);
    setMensaje('');
    setError('');
    setForm({
      kpi_id: r.KPI_ID.toString(),
      kre_monto_total: r.KRE_MONTO_TOTAL.toString(),
      kre_calculo: r.KRE_CALCULO.toString(),
      kre_fecha: r.KRE_FECHA ? String(r.KRE_FECHA).split('T')[0] : ''
    });
  };

  const handleEliminar = async (id: number) => {
    const confirmar = window.confirm('¿Deseas eliminar este resultado?');
    if (!confirmar) return;

    try {
      setError('');
      setMensaje('');
      await eliminarResultado(id);
      setMensaje('Resultado eliminado correctamente');

      if (idActual === id) {
        limpiarFormulario();
      }

      await cargarDatos();
    } catch (err: any) {
      setError(
        'Error al eliminar: ' + (err.response?.data?.error || err.message)
      );
    }
  };

  const obtenerChipCalculo = (calculo: number) => {
    if (calculo >= 8) return <Chip label={calculo} color="success" size="small" />;
    if (calculo >= 5) return <Chip label={calculo} color="warning" size="small" />;
    return <Chip label={calculo} color="error" size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando resultados KPI...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Formulario */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AssessmentIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Resultados KPI
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar resultado' : 'Nuevo resultado'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="ID del KPI"
              name="kpi_id"
              type="number"
              value={form.kpi_id}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Monto Total"
              name="kre_monto_total"
              type="number"
              value={form.kre_monto_total}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Cálculo (0 - 10)"
              name="kre_calculo"
              type="number"
              value={form.kre_calculo}
              onChange={handleChange}
              slotProps={{ htmlInput: { min: 0, max: 10, step: 0.1 } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
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
                {modoEdicion ? 'Actualizar' : 'Guardar'}
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

      {/* Tabla */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listado de resultados: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>KPI ID</strong></TableCell>
                <TableCell><strong>Monto Total</strong></TableCell>
                <TableCell><strong>Cálculo</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((r) => (
                  <TableRow key={r.KRE_ID} hover>
                    <TableCell>{r.KRE_ID}</TableCell>
                    <TableCell>{r.KPI_ID}</TableCell>
                    <TableCell>Q{Number(r.KRE_MONTO_TOTAL).toLocaleString('es-GT')}</TableCell>
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No hay resultados registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Snackbars */}
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