import { useEffect, useState } from 'react';
import type { KPI, KPIForm } from '../interfaces/kpi';
import {
  obtenerKPIs,
  crearKPI,
  actualizarKPI,
  eliminarKPI
} from '../services/kpi.service';

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
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const initialForm: KPIForm = {
  kpi_nombre: '',
  kpi_tipo: '',
  kpi_valor: ''
};

function KPICRUD() {
  const [datos, setDatos] = useState<KPI[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [kpiId, setKpiId] = useState<number | null>(null);
  const [form, setForm] = useState<KPIForm>(initialForm);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerKPIs();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando KPIs: ' + err.message);
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
    setKpiId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!form.kpi_nombre.trim() || !form.kpi_tipo.trim() || !String(form.kpi_valor).trim()) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const guardarKPI = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && kpiId !== null) {
        await actualizarKPI(kpiId, form);
        setMensaje('KPI actualizado correctamente');
      } else {
        await crearKPI(form);
        setMensaje('KPI creado correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error guardando KPI: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este KPI?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarKPI(id);
      setMensaje('KPI eliminado correctamente');

      if (kpiId === id) limpiarFormulario();

      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando KPI: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (k: KPI) => {
    setModoEdicion(true);
    setKpiId(k.KPI_ID);
    setMensaje('');
    setError('');
    setForm({
      kpi_nombre: k.KPI_NOMBRE,
      kpi_tipo: k.KPI_TIPO,
      kpi_valor: k.KPI_VALOR?.toString() || ''
    });
  };

  const obtenerChipTipo = (tipo: string) => {
    const colores: Record<string, 'primary' | 'success' | 'warning' | 'info'> = {
      Bono: 'success',
      Descuento: 'warning',
      bono: 'success',
      descuento: 'warning'
    };
    const color = colores[tipo] ?? 'info';
    return <Chip label={tipo} color={color} size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando maestro de KPIs...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Formulario */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <TrendingUpIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Maestro de KPIs
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar KPI' : 'Nuevo KPI'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre del KPI"
              name="kpi_nombre"
              placeholder="Ej: Puntualidad"
              value={form.kpi_nombre}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Tipo"
              name="kpi_tipo"
              placeholder="Ej: Bono / Descuento"
              value={form.kpi_tipo}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Valor Base"
              name="kpi_valor"
              type="number"
              placeholder="0"
              value={form.kpi_valor}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardarKPI}
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
          Listado de KPIs: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Valor Base</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((k) => (
                  <TableRow key={k.KPI_ID} hover>
                    <TableCell>{k.KPI_ID}</TableCell>
                    <TableCell>{k.KPI_NOMBRE}</TableCell>
                    <TableCell>{obtenerChipTipo(k.KPI_TIPO)}</TableCell>
                    <TableCell>
                      Q{Number(k.KPI_VALOR).toLocaleString('es-GT')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(k)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(k.KPI_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No hay KPIs registrados
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

export default KPICRUD;
