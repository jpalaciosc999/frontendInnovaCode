import { useEffect, useState } from 'react';
import type { Descuento, DescuentoForm } from '../interfaces/descuentos';
import {
  obtenerDescuentos,
  crearDescuento,
  actualizarDescuento,
  eliminarDescuento
} from '../services/descuentos.service';

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
import PercentIcon from '@mui/icons-material/Percent';

const initialForm: DescuentoForm = {
  tds_codigo: '',
  tds_nombre: '',
  tds_descripcion: '',
  tds_tipo_calculo: '',
  tds_valor_base: 0,
  tds_porcentaje: 0,
  tds_es_obligatorio: 'N',
  tds_estado: 'A',
  tds_fecha_creacion: '',
  tds_modificacion: ''
};

function DescuentoCRUD() {
  const [datos, setDatos] = useState<Descuento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<DescuentoForm>(initialForm);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerDescuentos();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando descuentos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
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
    if (!form.tds_codigo.trim() || !form.tds_nombre.trim() || !form.tds_tipo_calculo.trim()) {
      setError('Código, nombre y tipo de cálculo son obligatorios');
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
        await actualizarDescuento(id, form);
        setMensaje('Descuento actualizado correctamente');
      } else {
        await crearDescuento(form);
        setMensaje('Descuento creado correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error guardando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (idEliminar: number) => {
    if (!window.confirm('¿Deseas eliminar este descuento?')) return;
    try {
      setError('');
      setMensaje('');
      await eliminarDescuento(idEliminar);
      setMensaje('Descuento eliminado correctamente');
      if (id === idEliminar) limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (d: Descuento) => {
    setModoEdicion(true);
    setId(d.TDS_ID);
    setMensaje('');
    setError('');
    setForm({
      tds_codigo: d.TDS_CODIGO,
      tds_nombre: d.TDS_NOMBRE,
      tds_descripcion: d.TDS_DESCRIPCION || '',
      tds_tipo_calculo: d.TDS_TIPO_CALCULO,
      tds_valor_base: d.TDS_VALOR_BASE,
      tds_porcentaje: d.TDS_PORCENTAJE,
      tds_es_obligatorio: d.TDS_ES_OBLIGATORIO,
      tds_estado: d.TDS_ESTADO,
      tds_fecha_creacion: d.TDS_FECHA_CREACION
        ? String(d.TDS_FECHA_CREACION).split('T')[0] : '',
      tds_modificacion: d.TDS_MODIFICACION
        ? String(d.TDS_MODIFICACION).split('T')[0] : ''
    });
  };

  const obtenerChipTipo = (tipo: string) => {
    const map: Record<string, 'primary' | 'warning' | 'info'> = {
      PORCENTAJE: 'primary',
      FIJO: 'warning',
      MIXTO: 'info'
    };
    return <Chip label={tipo} color={map[tipo] ?? 'default'} size="small" />;
  };

  const obtenerChipEstado = (estado: string) =>
    estado === 'A'
      ? <Chip label="Activo" color="success" size="small" />
      : <Chip label="Inactivo" color="default" size="small" />;

  if (cargando) {
    return <Box sx={{ p: 3 }}><Typography variant="h6">Cargando descuentos...</Typography></Box>;
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Formulario */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <PercentIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Tipos de Descuento
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar descuento' : 'Nuevo descuento'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Código" name="tds_codigo"
              value={form.tds_codigo} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Nombre" name="tds_nombre"
              value={form.tds_nombre} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label="Descripción" name="tds_descripcion"
              value={form.tds_descripcion} onChange={handleChange} />
          </Grid>

          {/* Tipo de cálculo */}
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo de cálculo</InputLabel>
              <Select name="tds_tipo_calculo" value={form.tds_tipo_calculo}
                label="Tipo de cálculo" onChange={handleChange}>
                <MenuItem value="">Seleccione</MenuItem>
                <MenuItem value="PORCENTAJE">Porcentaje</MenuItem>
                <MenuItem value="FIJO">Valor fijo</MenuItem>
                <MenuItem value="MIXTO">Mixto</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth label="Valor base (Q)" name="tds_valor_base"
              type="number" value={form.tds_valor_base} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth label="Porcentaje (%)" name="tds_porcentaje"
              type="number" value={form.tds_porcentaje} onChange={handleChange}
              slotProps={{ htmlInput: { min: 0, max: 100, step: 0.01 } }} />
          </Grid>

          {/* Es obligatorio */}
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>¿Es obligatorio?</InputLabel>
              <Select name="tds_es_obligatorio" value={form.tds_es_obligatorio}
                label="¿Es obligatorio?" onChange={handleChange}>
                <MenuItem value="S">Sí</MenuItem>
                <MenuItem value="N">No</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Estado */}
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select name="tds_estado" value={form.tds_estado}
                label="Estado" onChange={handleChange}>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Fecha de modificación"
              name="tds_modificacion" type="date" value={form.tds_modificacion}
              onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={guardar}>
                {modoEdicion ? 'Actualizar' : 'Guardar'}
              </Button>
              <Button variant="outlined" color="secondary"
                startIcon={<CleaningServicesIcon />} onClick={limpiarFormulario}>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listado de descuentos: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Código</strong></TableCell>
                <TableCell><strong>Nombre</strong></TableCell>
                <TableCell><strong>Tipo Cálculo</strong></TableCell>
                <TableCell><strong>Valor Base</strong></TableCell>
                <TableCell><strong>Porcentaje</strong></TableCell>
                <TableCell><strong>Obligatorio</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? datos.map((d) => (
                <TableRow key={d.TDS_ID} hover>
                  <TableCell>{d.TDS_ID}</TableCell>
                  <TableCell>{d.TDS_CODIGO}</TableCell>
                  <TableCell>{d.TDS_NOMBRE}</TableCell>
                  <TableCell>{obtenerChipTipo(d.TDS_TIPO_CALCULO)}</TableCell>
                  <TableCell>Q{Number(d.TDS_VALOR_BASE).toLocaleString('es-GT')}</TableCell>
                  <TableCell>{d.TDS_PORCENTAJE}%</TableCell>
                  <TableCell>
                    <Chip
                      label={d.TDS_ES_OBLIGATORIO === 'S' ? 'Sí' : 'No'}
                      color={d.TDS_ES_OBLIGATORIO === 'S' ? 'error' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{obtenerChipEstado(d.TDS_ESTADO)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button size="small" variant="outlined" startIcon={<EditIcon />}
                        onClick={() => handleEditar(d)}>Editar</Button>
                      <Button size="small" variant="contained" color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleEliminar(d.TDS_ID)}>Eliminar</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No hay descuentos registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setMensaje('')} sx={{ width: '100%' }}>
          {mensaje}
        </Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default DescuentoCRUD;