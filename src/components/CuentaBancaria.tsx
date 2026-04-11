import { useEffect, useState } from 'react';
import type { CuentaBancaria, CuentaBancariaForm } from '../interfaces/cuentaBancaria';
import {
  obtenerCuentas,
  crearCuenta,
  actualizarCuenta,
  eliminarCuenta
} from '../services/cuentaBancaria.service';

import {
  Alert,
  Box,
  Button,
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
  Typography,
  Card,
  CardContent
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';

// Iconos
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CreditCardIcon from '@mui/icons-material/CreditCard';

const initialForm: CuentaBancariaForm = {
  ban_nombre: '',
  cue_numero: '',
  cue_tipo: '',
  emp_id: ''
};

function CuentaBancariaPage() {
  const [datos, setDatos] = useState<CuentaBancaria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cueId, setCueId] = useState<number | null>(null);
  const [form, setForm] = useState<CuentaBancariaForm>(initialForm);

  const cargarCuentas = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerCuentas();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando cuentas: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarCuentas(); }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name as string]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setCueId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!form.ban_nombre.trim() || !form.cue_numero.trim() || !form.cue_tipo || !form.emp_id) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const guardarCuenta = async () => {
    try {
      setError(''); setMensaje('');
      if (!validarFormulario()) return;

      if (modoEdicion && cueId !== null) {
        await actualizarCuenta(cueId, form);
        setMensaje('Cuenta actualizada correctamente');
      } else {
        await crearCuenta(form);
        setMensaje('Cuenta creada correctamente');
      }
      limpiarFormulario();
      await cargarCuentas();
    } catch (err: any) {
      setError('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar esta cuenta bancaria?')) return;
    try {
      setError(''); setMensaje('');
      await eliminarCuenta(id);
      setMensaje('Cuenta eliminada');
      await cargarCuentas();
    } catch (err: any) {
      setError('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (cue: CuentaBancaria) => {
    setModoEdicion(true);
    setCueId(cue.CUE_ID);
    setForm({
      ban_nombre: cue.CUE_NOMBRE || '',
      cue_numero: cue.CUE_NUMERO || '',
      cue_tipo: cue.CUE_TIPO || '',
      emp_id: String(cue.EMP_ID) || ''
    });
  };

  if (cargando) return <Box sx={{ p: 5, textAlign: 'center' }}><Typography>Cargando...</Typography></Box>;

  return (
    <Box sx={{ py: 3 }}>
      <Card sx={{ mb: 4, borderRadius: 2 }} elevation={3}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
            <AccountBalanceIcon color="primary" fontSize="large" />
            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Cuentas Bancarias</Typography>
          </Box>

          <Grid container spacing={3}>
            {/* ID Empleado */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="ID Empleado"
                name="emp_id"
                type="number"
                value={form.emp_id}
                onChange={handleChange}
              />
            </Grid>

            {/* Nombre del Banco */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Nombre del Banco"
                name="ban_nombre"
                value={form.ban_nombre}
                onChange={handleChange}
                slotProps={{ htmlInput: { maxLength: 100 } }}
              />
            </Grid>

            {/* Número de Cuenta */}
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                fullWidth
                label="Número de Cuenta"
                name="cue_numero"
                value={form.cue_numero}
                onChange={handleChange}
                slotProps={{ htmlInput: { maxLength: 50 } }}
              />
            </Grid>

            {/* Tipo de Cuenta */}
            <Grid size={{ xs: 12, md: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo de Cuenta</InputLabel>
                <Select
                  name="cue_tipo"
                  value={form.cue_tipo}
                  label="Tipo de Cuenta"
                  onChange={handleChange}
                >
                  <MenuItem value=""><em>Seleccione</em></MenuItem>
                  <MenuItem value="MON">Monetaria</MenuItem>
                  <MenuItem value="AHO">Ahorros</MenuItem>
                  <MenuItem value="COR">Corriente</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarCuenta}>
                  {modoEdicion ? 'Actualizar' : 'Guardar'}
                </Button>
                <Button variant="outlined" color="inherit" startIcon={<CleaningServicesIcon />} onClick={limpiarFormulario}>
                  Limpiar
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Emp.</strong></TableCell>
                <TableCell><strong>Banco</strong></TableCell>
                <TableCell><strong>Número</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? (
                datos.map((cue) => (
                  <TableRow key={cue.CUE_ID} hover>
                    <TableCell>{cue.CUE_ID}</TableCell>
                    <TableCell>#{cue.EMP_ID}</TableCell>
                    <TableCell>{cue.CUE_NOMBRE}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CreditCardIcon fontSize="small" color="disabled" />
                        {cue.CUE_NUMERO}
                      </Box>
                    </TableCell>
                    <TableCell>{cue.CUE_TIPO}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button size="small" onClick={() => handleEditar(cue)}><EditIcon fontSize="small" /></Button>
                        <Button size="small" color="error" onClick={() => handleEliminar(cue.CUE_ID)}><DeleteIcon fontSize="small" /></Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>No hay registros</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')}>
        <Alert severity="success" variant="filled">{mensaje}</Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
        <Alert severity="error" variant="filled">{error}</Alert>
      </Snackbar>
    </Box>
  );
}

export default CuentaBancariaPage;