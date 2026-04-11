import { useEffect, useState } from 'react';
import type { Empleado, EmpleadoForm } from '../interfaces/empleados';
import {
  obtenerEmpleados,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado
} from '../services/empleados.service';

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
import PeopleIcon from '@mui/icons-material/People';

const initialForm: EmpleadoForm = {
  emp_nombre: '',
  emp_apellido: '',
  emp_dpi: '',
  emp_nit: '',
  emp_telefono: '',
  emp_fecha_contratacion: '',
  emp_estado: ''
};

function PruebaAxios() {
  const [datos, setDatos] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [empleadoId, setEmpleadoId] = useState<number | null>(null);
  const [form, setForm] = useState<EmpleadoForm>(initialForm);

  const cargarEmpleados = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerEmpleados();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando empleados: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
  }, []);

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
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
    setEmpleadoId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (
      !form.emp_nombre.trim() ||
      !form.emp_apellido.trim() ||
      !form.emp_dpi.trim() ||
      !form.emp_nit.trim() ||
      !form.emp_telefono.trim() ||
      !form.emp_fecha_contratacion.trim() ||
      !form.emp_estado.trim()
    ) {
      setError('Todos los campos son obligatorios');
      return false;
    }

    return true;
  };

  const guardarEmpleado = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && empleadoId !== null) {
        await actualizarEmpleado(empleadoId, form);
        setMensaje('Empleado actualizado correctamente');
      } else {
        await crearEmpleado(form);
        setMensaje('Empleado creado correctamente');
      }

      limpiarFormulario();
      await cargarEmpleados();
    } catch (err: any) {
      setError(
        'Error guardando empleado: ' +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEliminar = async (id: number) => {
    const confirmar = window.confirm('¿Deseas eliminar este empleado?');
    if (!confirmar) return;

    try {
      setError('');
      setMensaje('');

      await eliminarEmpleado(id);
      setMensaje('Empleado eliminado correctamente');

      if (empleadoId === id) {
        limpiarFormulario();
      }

      await cargarEmpleados();
    } catch (err: any) {
      setError(
        'Error eliminando empleado: ' +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEditar = (empleado: Empleado) => {
    setModoEdicion(true);
    setEmpleadoId(empleado.EMP_ID);
    setMensaje('');
    setError('');

    setForm({
      emp_nombre: empleado.EMP_NOMBRE || '',
      emp_apellido: empleado.EMP_APELLIDO || '',
      emp_dpi: String(empleado.EMP_DPI || ''),
      emp_nit: String(empleado.EMP_NIT || ''),
      emp_telefono: String(empleado.EMP_TELEFONO || ''),
      emp_fecha_contratacion: empleado.EMP_FECHA_CONTRATACION
        ? String(empleado.EMP_FECHA_CONTRATACION).slice(0, 10)
        : '',
      emp_estado: empleado.EMP_ESTADO || ''
    });
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'A') {
      return <Chip label="Activo" color="success" size="small" />;
    }

    if (estado === 'I') {
      return <Chip label="Inactivo" color="default" size="small" />;
    }

    return <Chip label={estado || 'Sin estado'} size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando empleados...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 3
          }}
        >
          <PeopleIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            CRUD de Empleados
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar empleado' : 'Nuevo empleado'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Nombre"
              name="emp_nombre"
              value={form.emp_nombre}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Apellido"
              name="emp_apellido"
              value={form.emp_apellido}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="DPI"
              name="emp_dpi"
              value={form.emp_dpi}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="NIT"
              name="emp_nit"
              value={form.emp_nit}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Teléfono"
              name="emp_telefono"
              value={form.emp_telefono}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha de contratación"
              name="emp_fecha_contratacion"
              type="date"
              value={form.emp_fecha_contratacion}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="emp_estado"
                value={form.emp_estado}
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
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardarEmpleado}
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
          Listado de empleados: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Apellido</strong></TableCell>
                <TableCell><strong>DPI</strong></TableCell>
                <TableCell><strong>NIT</strong></TableCell>
                <TableCell><strong>Teléfono</strong></TableCell>
                <TableCell><strong>Fecha contratación</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((empleado) => (
                  <TableRow key={empleado.EMP_ID} hover>
                    <TableCell>{empleado.EMP_ID}</TableCell>
                    <TableCell>{empleado.EMP_NOMBRE}</TableCell>
                    <TableCell>{empleado.EMP_APELLIDO}</TableCell>
                    <TableCell>{empleado.EMP_DPI}</TableCell>
                    <TableCell>{empleado.EMP_NIT}</TableCell>
                    <TableCell>{empleado.EMP_TELEFONO}</TableCell>
                    <TableCell>
                      {empleado.EMP_FECHA_CONTRATACION
                        ? String(empleado.EMP_FECHA_CONTRATACION).slice(0, 10)
                        : ''}
                    </TableCell>
                    <TableCell>
                      {obtenerChipEstado(empleado.EMP_ESTADO)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(empleado)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(empleado.EMP_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No hay empleados registrados
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

export default PruebaAxios;