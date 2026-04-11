import { useEffect, useState } from 'react';
import type { Nomina, NominaForm } from '../interfaces/nomina';
import {
  obtenerNominas,
  crearNomina,
  actualizarNomina,
  eliminarNomina
} from '../services/nomina.service';

import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
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

import type { SelectChangeEvent } from '@mui/material/Select';

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';

const initialForm: NominaForm = {
  nom_total_ingresos: '',
  nom_total_descuento: '',
  nom_salario_liquido: '',
  nom_fecha_generacion: '',
  per_id: '',
  empleado_id: '',
  liq_id: '',
  nom_estado: ''
};

function NominaCRUD() {
  const [datos, setDatos] = useState<Nomina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<NominaForm>(initialForm);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerNominas();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando nóminas: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Cálculo automático del salario líquido
  useEffect(() => {
    const total =
      Number(form.nom_total_ingresos || 0) -
      Number(form.nom_total_descuento || 0);

    setForm((prev) => ({
      ...prev,
      nom_salario_liquido: total.toString()
    }));
  }, [form.nom_total_ingresos, form.nom_total_descuento]);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setId(null);
    setError('');
  };

  const validar = () => {
    if (
      !String(form.nom_total_ingresos).trim() ||
      !String(form.nom_total_descuento).trim() ||
      !form.nom_fecha_generacion.trim() ||
      !String(form.per_id).trim() ||
      !String(form.empleado_id).trim() ||
      !String(form.liq_id).trim() ||
      !form.nom_estado.trim()
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

      if (!validar()) return;

      if (modoEdicion && id !== null) {
        await actualizarNomina(id, form);
        setMensaje('Nómina actualizada correctamente');
      } else {
        await crearNomina(form);
        setMensaje('Nómina creada correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error guardando nómina: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (n: Nomina) => {
    setModoEdicion(true);
    setId(n.NOM_ID);
    setMensaje('');
    setError('');
    setForm({
      nom_total_ingresos: String(n.NOM_TOTAL_INGRESOS),
      nom_total_descuento: String(n.NOM_TOTAL_DESCUENTO),
      nom_salario_liquido: String(n.NOM_SALARIO_LIQUIDO),
      nom_fecha_generacion: n.NOM_FECHA_GENERACION
        ? String(n.NOM_FECHA_GENERACION).split('T')[0]
        : '',
      per_id: String(n.PER_ID),
      empleado_id: String(n.EMP_ID),
      liq_id: String(n.LIQ_ID),
      nom_estado: n.NOM_ESTADO
    });
  };

  const handleEliminar = async (idEliminar: number) => {
    if (!window.confirm('¿Deseas eliminar esta nómina?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarNomina(idEliminar);
      setMensaje('Nómina eliminada correctamente');

      if (id === idEliminar) limpiarFormulario();

      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando nómina: ' + (err.response?.data?.error || err.message));
    }
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'A' || estado === 'Activo')
      return <Chip label="Activo" color="success" size="small" />;
    if (estado === 'I' || estado === 'Inactivo')
      return <Chip label="Inactivo" color="default" size="small" />;
    if (estado === 'P' || estado === 'Pendiente')
      return <Chip label="Pendiente" color="warning" size="small" />;
    return <Chip label={estado || 'Sin estado'} size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando nóminas...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Formulario */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <RequestQuoteIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Gestión de Nómina
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar nómina' : 'Nueva nómina'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Total Ingresos"
              name="nom_total_ingresos"
              type="number"
              value={form.nom_total_ingresos}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Total Descuentos"
              name="nom_total_descuento"
              type="number"
              value={form.nom_total_descuento}
              onChange={handleChange}
            />
          </Grid>

          {/* Salario líquido — solo lectura, calculado automáticamente */}
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Salario Líquido (calculado)"
              value={`Q ${Number(form.nom_salario_liquido).toLocaleString('es-GT')}`}
              slotProps={{ input: { readOnly: true } }}
              sx={{ backgroundColor: '#f5f5f5' }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha de generación"
              name="nom_fecha_generacion"
              type="date"
              value={form.nom_fecha_generacion}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Periodo ID"
              name="per_id"
              type="number"
              value={form.per_id}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Empleado ID"
              name="empleado_id"
              type="number"
              value={form.empleado_id}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Liquidación ID"
              name="liq_id"
              type="number"
              value={form.liq_id}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="nom_estado"
                value={form.nom_estado}
                label="Estado"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione estado</MenuItem>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
                <MenuItem value="P">Pendiente</MenuItem>
              </Select>
            </FormControl>
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
          Listado de nóminas: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Empleado ID</strong></TableCell>
                <TableCell><strong>Total Ingresos</strong></TableCell>
                <TableCell><strong>Total Descuentos</strong></TableCell>
                <TableCell><strong>Salario Líquido</strong></TableCell>
                <TableCell><strong>Fecha Generación</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((n) => (
                  <TableRow key={n.NOM_ID} hover>
                    <TableCell>{n.NOM_ID}</TableCell>
                    <TableCell>{n.EMP_ID}</TableCell>
                    <TableCell>Q{Number(n.NOM_TOTAL_INGRESOS).toLocaleString('es-GT')}</TableCell>
                    <TableCell>Q{Number(n.NOM_TOTAL_DESCUENTO).toLocaleString('es-GT')}</TableCell>
                    <TableCell>Q{Number(n.NOM_SALARIO_LIQUIDO).toLocaleString('es-GT')}</TableCell>
                    <TableCell>
                      {n.NOM_FECHA_GENERACION
                        ? new Date(n.NOM_FECHA_GENERACION).toLocaleDateString('es-GT')
                        : '—'}
                    </TableCell>
                    <TableCell>{obtenerChipEstado(n.NOM_ESTADO)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(n)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(n.NOM_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No hay nóminas registradas
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

export default NominaCRUD;