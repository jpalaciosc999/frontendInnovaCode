import { useEffect, useState } from 'react';
import type { Prestamo, PrestamoForm } from '../interfaces/prestamos';
import {
  obtenerPrestamos,
  crearPrestamo,
  actualizarPrestamo,
  eliminarPrestamo
} from '../services/prestamos.service';

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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

const initialForm: PrestamoForm = {
  pre_monto_total: '',
  pre_interes: '',
  pre_plazo: '',
  pre_cuota_mensual: '',
  pre_saldo_pendiente: '',
  pre_fecha_inicio: '',
  pre_estado: ''
};

function Prestamos() {
  const [datos, setDatos] = useState<Prestamo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [prestamoId, setPrestamoId] = useState<number | null>(null);
  const [form, setForm] = useState<PrestamoForm>(initialForm);

  const cargarPrestamos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerPrestamos();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando préstamos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPrestamos();
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
    setPrestamoId(null);
    setError('');
  };

  const validarFormulario = () => {
    const fields = Object.values(form);
    if (fields.some(field => !field.toString().trim())) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const guardarPrestamo = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && prestamoId !== null) {
        await actualizarPrestamo(prestamoId, form);
        setMensaje('Préstamo actualizado correctamente');
      } else {
        await crearPrestamo(form);
        setMensaje('Préstamo creado correctamente');
      }

      limpiarFormulario();
      await cargarPrestamos();
    } catch (err: any) {
      setError(
        'Error guardando préstamo: ' + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este préstamo?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarPrestamo(id);
      setMensaje('Préstamo eliminado correctamente');
      if (prestamoId === id) limpiarFormulario();
      await cargarPrestamos();
    } catch (err: any) {
      setError(
        'Error eliminando préstamo: ' + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEditar = (p: Prestamo) => {
    setModoEdicion(true);
    setPrestamoId(p.PRE_ID);
    setMensaje('');
    setError('');

    setForm({
      pre_monto_total: String(p.PRE_MONTO_TOTAL || ''),
      pre_interes: String(p.PRE_INTERES || ''),
      pre_plazo: p.PRE_PLAZO || '',
      pre_cuota_mensual: String(p.PRE_CUOTA_MENSUAL || ''),
      pre_saldo_pendiente: String(p.PRE_SALDO_PENDIENTE || ''),
      pre_fecha_inicio: p.PRE_FECHA_INICIO ? String(p.PRE_FECHA_INICIO).slice(0, 10) : '',
      pre_estado: p.PRE_ESTADO || ''
    });
  };

  const obtenerChipEstado = (estado: string) => {
    return estado === 'A'
      ? <Chip label="Activo" color="success" size="small" />
      : <Chip label="Inactivo" color="default" size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">Cargando préstamos...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AccountBalanceWalletIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Gestión de Préstamos
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar Préstamo' : 'Nuevo Préstamo'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type="number" label="Monto Total" name="pre_monto_total" value={form.pre_monto_total} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type="number" label="Interés (%)" name="pre_interes" value={form.pre_interes} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Plazo (Meses/Años)" name="pre_plazo" value={form.pre_plazo} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type="number" label="Cuota Mensual" name="pre_cuota_mensual" value={form.pre_cuota_mensual} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type="number" label="Saldo Pendiente" name="pre_saldo_pendiente" value={form.pre_saldo_pendiente} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <TextField fullWidth type="date" label="Fecha Inicio" name="pre_fecha_inicio" slotProps={{ inputLabel: { shrink: true } }} value={form.pre_fecha_inicio} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, md: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select name="pre_estado" value={form.pre_estado} label="Estado" onChange={handleChange}>
                <MenuItem value="">Seleccione</MenuItem>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarPrestamo}>
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
          Listado de Préstamos: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Monto / Saldo</strong></TableCell>
                <TableCell><strong>Interés / Plazo</strong></TableCell>
                <TableCell><strong>Cuota</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? (
                datos.map((p) => (
                  <TableRow key={p.PRE_ID} hover>
                    <TableCell>{p.PRE_ID}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Q. {Number(p.PRE_MONTO_TOTAL).toLocaleString()}</Typography>
                      <Typography variant="caption" color="error">Pend: Q. {Number(p.PRE_SALDO_PENDIENTE).toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{p.PRE_INTERES}%</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>{p.PRE_PLAZO}</Typography>
                    </TableCell>
                    <TableCell>Q. {Number(p.PRE_CUOTA_MENSUAL).toLocaleString()}</TableCell>
                    <TableCell>{p.PRE_FECHA_INICIO ? String(p.PRE_FECHA_INICIO).slice(0, 10) : ''}</TableCell>
                    <TableCell>{obtenerChipEstado(p.PRE_ESTADO)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleEditar(p)}>Editar</Button>
                        <Button size="small" variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => handleEliminar(p.PRE_ID)}>Eliminar</Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">No hay préstamos registrados</TableCell>
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

export default Prestamos;