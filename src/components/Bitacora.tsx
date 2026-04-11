import { useEffect, useState } from 'react';
import type { Bitacora, BitacoraForm } from '../interfaces/bitacora';
import {
  obtenerBitacoras,
  crearBitacora,
  actualizarBitacora,
  eliminarBitacora
} from '../services/bitacora.service';

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
import HistoryIcon from '@mui/icons-material/History';

const initialForm: BitacoraForm = {
  bit_accion: '',
  bit_tabla_afectada: '',
  bit_id_registro: '',
  bit_descripcion: '',
  bit_valor_anterior: '',
  bit_valor_nuevo: '',
  bit_ip_usuario: '',
  bit_fecha: ''
};

function BitacoraCRUD() {
  const [datos, setDatos] = useState<Bitacora[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [bitId, setBitId] = useState<number | null>(null);
  const [form, setForm] = useState<BitacoraForm>(initialForm);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerBitacoras();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando bitácora: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

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
    setBitId(null);
    setError('');
  };

  const validar = () => {
    if (
      !form.bit_accion.trim() ||
      !form.bit_tabla_afectada.trim() ||
      !form.bit_fecha.trim()
    ) {
      setError('Acción, tabla afectada y fecha son obligatorios');
      return false;
    }
    return true;
  };

  const guardar = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validar()) return;

      if (modoEdicion && bitId !== null) {
        await actualizarBitacora(bitId, form);
        setMensaje('Registro actualizado correctamente');
      } else {
        await crearBitacora(form);
        setMensaje('Registro creado correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error guardando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (idEliminar: number) => {
    if (!window.confirm('¿Deseas eliminar este registro?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarBitacora(idEliminar);
      setMensaje('Registro eliminado correctamente');

      if (bitId === idEliminar) limpiarFormulario();

      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (b: Bitacora) => {
    setModoEdicion(true);
    setBitId(b.BIT_ID);
    setMensaje('');
    setError('');
    setForm({
      bit_accion: b.BIT_ACCION,
      bit_tabla_afectada: b.BIT_TABLA_AFECTADA,
      bit_id_registro: String(b.BIT_ID_REGISTRO || ''),
      bit_descripcion: b.BIT_DESCRIPCION || '',
      bit_valor_anterior: b.BIT_VALOR_ANTERIOR || '',
      bit_valor_nuevo: b.BIT_VALOR_NUEVO || '',
      bit_ip_usuario: b.BIT_IP_USUARIO || '',
      bit_fecha: b.BIT_FECHA
        ? String(b.BIT_FECHA).split('T')[0]
        : ''
    });
  };

  const obtenerChipAccion = (accion: string) => {
    const lower = accion?.toLowerCase() || '';
    if (lower === 'insert' || lower === 'crear')
      return <Chip label={accion} color="success" size="small" />;
    if (lower === 'update' || lower === 'actualizar')
      return <Chip label={accion} color="warning" size="small" />;
    if (lower === 'delete' || lower === 'eliminar')
      return <Chip label={accion} color="error" size="small" />;
    return <Chip label={accion || '—'} color="info" size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando bitácora...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      {/* Formulario */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Bitácora del Sistema
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar registro' : 'Nuevo registro'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Acción</InputLabel>
              <Select
                name="bit_accion"
                value={form.bit_accion}
                label="Acción"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione acción</MenuItem>
                <MenuItem value="INSERT">INSERT</MenuItem>
                <MenuItem value="UPDATE">UPDATE</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Tabla afectada"
              name="bit_tabla_afectada"
              value={form.bit_tabla_afectada}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="ID Registro"
              name="bit_id_registro"
              type="number"
              value={form.bit_id_registro}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="IP Usuario"
              name="bit_ip_usuario"
              value={form.bit_ip_usuario}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha"
              name="bit_fecha"
              type="date"
              value={form.bit_fecha}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Descripción"
              name="bit_descripcion"
              multiline
              rows={2}
              value={form.bit_descripcion}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Valor anterior"
              name="bit_valor_anterior"
              multiline
              rows={2}
              value={form.bit_valor_anterior}
              onChange={handleChange}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Valor nuevo"
              name="bit_valor_nuevo"
              multiline
              rows={2}
              value={form.bit_valor_nuevo}
              onChange={handleChange}
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
          Listado de registros: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Acción</strong></TableCell>
                <TableCell><strong>Tabla Afectada</strong></TableCell>
                <TableCell><strong>ID Registro</strong></TableCell>
                <TableCell><strong>IP Usuario</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((b) => (
                  <TableRow key={b.BIT_ID} hover>
                    <TableCell>{b.BIT_ID}</TableCell>
                    <TableCell>{obtenerChipAccion(b.BIT_ACCION)}</TableCell>
                    <TableCell>{b.BIT_TABLA_AFECTADA}</TableCell>
                    <TableCell>{b.BIT_ID_REGISTRO}</TableCell>
                    <TableCell>{b.BIT_IP_USUARIO}</TableCell>
                    <TableCell>
                      {b.BIT_FECHA
                        ? new Date(b.BIT_FECHA).toLocaleDateString('es-GT')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditar(b)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(b.BIT_ID)}
                        >
                          Eliminar
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay registros en la bitácora
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

export default BitacoraCRUD;