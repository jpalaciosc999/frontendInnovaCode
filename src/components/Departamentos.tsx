import { useEffect, useState } from 'react';
import type { Departamento, DepartamentoForm } from '../interfaces/departamentos';
import {
  obtenerDepartamentos,
  crearDepartamento,
  actualizarDepartamento,
  eliminarDepartamento
} from '../services/departamentos.service';

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
import BusinessIcon from '@mui/icons-material/Business';

const initialForm: DepartamentoForm = {
  nombre: '',
  descripcion: '',
  estado: ''
};

function Departamentos() {
  const [datos, setDatos] = useState<Departamento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [depId, setDepId] = useState<number | null>(null);
  const [form, setForm] = useState<DepartamentoForm>(initialForm);

  const cargarDepartamentos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerDepartamentos();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando departamentos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDepartamentos();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name as string]: value
    }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setDepId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!form.nombre.trim() || !form.descripcion.trim() || !form.estado.trim()) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const guardarDepartamento = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && depId !== null) {
        await actualizarDepartamento(depId, form);
        setMensaje('Departamento actualizado correctamente');
      } else {
        await crearDepartamento(form);
        setMensaje('Departamento creado correctamente');
      }

      limpiarFormulario();
      await cargarDepartamentos();
    } catch (err: any) {
      setError(
        'Error guardando departamento: ' +
        (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este departamento?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarDepartamento(id);
      setMensaje('Departamento eliminado correctamente');

      if (depId === id) limpiarFormulario();
      await cargarDepartamentos();
    } catch (err: any) {
      setError(
        'Error eliminando departamento: ' +
        (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEditar = (dep: Departamento) => {
    setModoEdicion(true);
    setDepId(dep.DEP_ID);
    setMensaje('');
    setError('');

    setForm({
      nombre: dep.DEP_NOMBRE || '',
      descripcion: dep.DEP_DESCRIPCION || '',
      estado: dep.DEP_ESTADO || ''
    });
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'A') return <Chip label="Activo" color="success" size="small" />;
    if (estado === 'I') return <Chip label="Inactivo" color="default" size="small" />;
    return <Chip label={estado || 'N/A'} size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Cargando departamentos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <BusinessIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            CRUD de Departamentos
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar departamento' : 'Nuevo departamento'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }}>
            <TextField
              fullWidth
              label="Nombre del Departamento"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="estado"
                value={form.estado}
                label="Estado"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione estado</MenuItem>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Descripción"
              name="descripcion"
              multiline
              rows={2}
              value={form.descripcion}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardarDepartamento}
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

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listado de departamentos: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((dep) => (
                  <TableRow key={dep.DEP_ID} hover>
                    <TableCell>{dep.DEP_ID}</TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>{dep.DEP_NOMBRE}</TableCell>
                    <TableCell>{dep.DEP_DESCRIPCION}</TableCell>
                    <TableCell>{obtenerChipEstado(dep.DEP_ESTADO)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(dep)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(dep.DEP_ID)}
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
                    No hay departamentos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Notificaciones Globales */}
      <Snackbar
        open={!!mensaje}
        autoHideDuration={3000}
        onClose={() => setMensaje('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" variant="filled" onClose={() => setMensaje('')} sx={{ width: '100%' }}>
          {mensaje}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!error}
        autoHideDuration={4000}
        onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="error" variant="filled" onClose={() => setError('')} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Departamentos;