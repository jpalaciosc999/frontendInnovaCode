import { useEffect, useState } from 'react';
import type { Puesto, PuestoForm } from '../interfaces/puestos';
import {
  obtenerPuestos,
  crearPuesto,
  actualizarPuesto,
  eliminarPuesto
} from '../services/puestos.service';

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
import WorkIcon from '@mui/icons-material/Work';

const initialForm: PuestoForm = {
  codigo: '',
  nombre: '',
  salario_base: '',
  descripcion: '',
  estado: '',
  dep_id: ''
};

function Puestos() {
  const [datos, setDatos] = useState<Puesto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [puestoId, setPuestoId] = useState<number | null>(null);
  const [form, setForm] = useState<PuestoForm>(initialForm);

  const cargarPuestos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerPuestos();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando puestos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPuestos();
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
    setPuestoId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!form.nombre.trim() || !form.salario_base.trim() || !form.estado.trim() || !form.dep_id.trim()) {
      setError('Nombre, salario, estado y departamento son obligatorios');
      return false;
    }
    return true;
  };

  const guardarPuesto = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && puestoId !== null) {
        await actualizarPuesto(puestoId, form);
        setMensaje('Puesto actualizado correctamente');
      } else {
        await crearPuesto(form);
        setMensaje('Puesto creado correctamente');
      }

      limpiarFormulario();
      await cargarPuestos();
    } catch (err: any) {
      setError(
        'Error guardando puesto: ' + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este puesto?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarPuesto(id);
      setMensaje('Puesto eliminado correctamente');

      if (puestoId === id) limpiarFormulario();
      await cargarPuestos();
    } catch (err: any) {
      setError(
        'Error eliminando puesto: ' + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEditar = (p: Puesto) => {
    setModoEdicion(true);
    setPuestoId(p.PUE_ID);
    setMensaje('');
    setError('');

    setForm({
      codigo: (p as any).PUE_CODIGO || '',
      nombre: p.PUE_NOMBRE || '',
      salario_base: String(p.PUE_SALARIO_BASE || ''),
      descripcion: p.PUE_DESCRIPCION || '',
      estado: p.PUE_ESTADO || '',
      dep_id: String((p as any).DEP_ID || '')
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
        <Typography variant="h6">Cargando puestos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <WorkIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            CRUD de Puestos
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar puesto' : 'Nuevo puesto'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth label="Código" name="codigo" value={form.codigo} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Nombre del Puesto" name="nombre" value={form.nombre} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Salario Base"
              name="salario_base"
              type="number"
              value={form.salario_base}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <TextField fullWidth label="Descripción" name="descripcion" value={form.descripcion} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField fullWidth label="ID Dep." name="dep_id" value={form.dep_id} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select name="estado" value={form.estado} label="Estado" onChange={handleChange}>
                <MenuItem value="">Seleccione</MenuItem>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarPuesto}>
                {modoEdicion ? 'Actualizar' : 'Guardar'}
              </Button>
              <Button variant="outlined" color="secondary" startIcon={<CleaningServicesIcon />} onClick={limpiarFormulario}>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listado de puestos: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID / Código</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Salario</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((p) => (
                  <TableRow key={p.PUE_ID} hover>
                    <TableCell>
                      <Typography variant="body2">{p.PUE_ID}</Typography>
                      <Typography variant="caption" color="text.secondary">{(p as any).PUE_CODIGO}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 'medium' }}>{p.PUE_NOMBRE}</Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>{p.PUE_DESCRIPCION}</Typography>
                    </TableCell>
                    <TableCell>Q. {Number(p.PUE_SALARIO_BASE).toLocaleString()}</TableCell>
                    <TableCell>{obtenerChipEstado(p.PUE_ESTADO)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleEditar(p)}>
                          Editar
                        </Button>
                        <Button size="small" variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => handleEliminar(p.PUE_ID)}>
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">No hay puestos registrados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" variant="filled" onClose={() => setMensaje('')}>{mensaje}</Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" variant="filled" onClose={() => setError('')}>{error}</Alert>
      </Snackbar>
    </Box>
  );
}

export default Puestos;