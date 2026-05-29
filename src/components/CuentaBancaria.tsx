import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

import type { CuentaBancaria, CuentaBancariaForm } from '../interfaces/cuentaBancaria';
import type { Empleado } from '../interfaces/empleados';
import {
  obtenerCuentas,
  crearCuenta,
  actualizarCuenta,
  eliminarCuenta,
} from '../services/cuentaBancaria.service';
import { obtenerEmpleados } from '../services/empleados.service';
import { useUnsavedFormGuard } from '../hooks/useUnsavedFormGuard';
import LookupSelect from './common/LookupSelect';
import PageHeader from './common/PageHeader';
import StateBlock from './common/StateBlock';
import {
  getBankAccountHelperText,
  getBankAccountRule,
  limitBankAccountNumber,
  validateBankAccountNumber,
} from '../utils/bankAccountRules';

const BANCOS_GUATEMALA = [
  'Banco Industrial (BI)',
  'Banco de Desarrollo Rural (Banrural)',
  'Banco Agromercantil (BAM)',
  'Banco G&T Continental',
  'Banco de los Trabajadores (Bantrab)',
  'Banco Inmobiliario',
  'Banco Internacional',
  'Banco Promerica',
  'Banco Azteca',
  'Banco de America Central (BAC)',
  'Citibank Guatemala',
  'Vivibanco',
  'Acceso Financiero',
  'Credito Hipotecario Nacional (CHN)',
  'Bancomext Guatemala',
];

const TIPOS_CUENTA = [
  { value: 'MON', label: 'Monetaria' },
  { value: 'AHO', label: 'Ahorros' },
  { value: 'COR', label: 'Corriente' },
];

const initialForm: CuentaBancariaForm = {
  cue_nombre: '',
  cue_numero: '',
  cue_tipo: '',
  emp_id: '',
};

function CuentaBancariaPage() {
  const [datos, setDatos] = useState<CuentaBancaria[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cueId, setCueId] = useState<number | null>(null);
  const [form, setForm] = useState<CuentaBancariaForm>(initialForm);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);

  const cargarCuentas = async () => {
    try {
      setCargando(true);
      setError('');
      const [cuentasData, empleadosData] = await Promise.all([
        obtenerCuentas(),
        obtenerEmpleados(),
      ]);
      setDatos(cuentasData);
      setEmpleados(empleadosData);
    } catch (err: any) {
      setError('Error cargando cuentas o empleados: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  const obtenerNombreEmpleado = (empId: number | string) => {
    const empleado = empleados.find((emp) => String(emp.EMP_ID) === String(empId));
    if (!empleado) return `Empleado #${empId}`;

    return [empleado.EMP_NOMBRE, empleado.EMP_APELLIDO].filter(Boolean).join(' ') || `Empleado #${empId}`;
  };

  const cuentaError = validateBankAccountNumber(form.cue_numero, form.cue_nombre, form.cue_tipo);
  const cuentaHelper = form.cue_nombre && form.cue_tipo
    ? cuentaError || getBankAccountHelperText(form.cue_nombre, form.cue_tipo)
    : 'Selecciona banco y tipo de cuenta para aplicar longitud permitida.';
  const cuentaRule = getBankAccountRule(form.cue_nombre, form.cue_tipo);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === 'cue_numero') {
        return { ...prev, cue_numero: limitBankAccountNumber(value, prev.cue_nombre, prev.cue_tipo) };
      }

      if (name === 'cue_nombre' || name === 'cue_tipo') {
        const next = { ...prev, [name]: value };
        return {
          ...next,
          cue_numero: limitBankAccountNumber(next.cue_numero, next.cue_nombre, next.cue_tipo),
        };
      }

      return { ...prev, [name]: value };
    });
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setCueId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!(form.cue_nombre || '').trim() || !(form.cue_numero || '').trim() || !form.cue_tipo || !form.emp_id) {
      setError('Todos los campos son obligatorios');
      return false;
    }

    const accountError = validateBankAccountNumber(form.cue_numero, form.cue_nombre, form.cue_tipo);
    if (accountError) {
      setError(accountError);
      return false;
    }

    return true;
  };

  const obtenerPayloadCuenta = (): CuentaBancariaForm => ({
    cue_nombre: form.cue_nombre || '',
    cue_numero: form.cue_numero || '',
    cue_tipo: form.cue_tipo || '',
    emp_id: form.emp_id || '',
  });

  const guardarCuenta = async () => {
    try {
      setError('');
      setMensaje('');
      if (!validarFormulario()) return false;

      const payload = obtenerPayloadCuenta();
      if (modoEdicion && cueId !== null) {
        await actualizarCuenta(cueId, payload);
        setMensaje('Cuenta actualizada correctamente');
      } else {
        await crearCuenta(payload);
        setMensaje('Cuenta creada correctamente');
      }

      limpiarFormulario();
      await cargarCuentas();
      return true;
    } catch (err: any) {
      setError('Error guardando cuenta: ' + (err.response?.data?.error || err.message));
      return false;
    }
  };

  useUnsavedFormGuard(form, initialForm, guardarCuenta);

  const handleEliminar = async (id: number) => {
    if (!window.confirm('Deseas eliminar esta cuenta bancaria?')) return;
    try {
      setError('');
      setMensaje('');
      await eliminarCuenta(id);
      setMensaje('Cuenta eliminada correctamente');
      if (cueId === id) limpiarFormulario();
      await cargarCuentas();
    } catch (err: any) {
      setError('Error eliminando cuenta: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (cue: CuentaBancaria) => {
    setModoEdicion(true);
    setCueId(cue.CUE_ID);
    setMensaje('');
    setError('');
    setForm({
      cue_nombre: cue.CUE_NOMBRE || '',
      cue_numero: limitBankAccountNumber(cue.CUE_NUMERO || '', cue.CUE_NOMBRE || '', cue.CUE_TIPO || ''),
      cue_tipo: cue.CUE_TIPO || '',
      emp_id: String(cue.EMP_ID) || '',
    });
  };

  const obtenerEtiquetaTipo = (tipo: string) => {
    const colores: Record<string, 'primary' | 'success' | 'info'> = {
      MON: 'primary',
      AHO: 'success',
      COR: 'info',
    };
    const etiquetas: Record<string, string> = {
      MON: 'Monetaria',
      AHO: 'Ahorros',
      COR: 'Corriente',
    };
    return <Chip label={etiquetas[tipo] ?? tipo} color={colores[tipo] ?? 'default'} size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <StateBlock title="Cargando cuentas bancarias..." loading />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <PageHeader
        title="Cuentas Bancarias"
        subtitle="Registra cuentas por empleado con validacion de longitud segun banco y tipo de cuenta."
        icon={<AccountBalanceIcon />}
      />

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar cuenta bancaria' : 'Nueva cuenta bancaria'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <LookupSelect
              required
              label="Empleado"
              value={form.emp_id}
              placeholder="Buscar empleado"
              options={empleados.map((empleado) => ({
                value: String(empleado.EMP_ID),
                label: obtenerNombreEmpleado(empleado.EMP_ID),
                description: `ID ${empleado.EMP_ID}`,
              }))}
              onChange={(value) => setForm((prev) => ({ ...prev, emp_id: value }))}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Nombre del Banco"
              name="cue_nombre"
              value={form.cue_nombre || ''}
              onChange={handleChange}
              required
            >
              <MenuItem value=""><em>Seleccione un banco</em></MenuItem>
              {BANCOS_GUATEMALA.map((banco) => (
                <MenuItem key={banco} value={banco}>{banco}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Numero de Cuenta"
              name="cue_numero"
              type="tel"
              value={form.cue_numero}
              onChange={handleChange}
              placeholder="Ej: 0123456789"
              error={Boolean(cuentaError)}
              helperText={cuentaHelper}
              slotProps={{
                htmlInput: {
                  maxLength: cuentaRule.max,
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                },
              }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              select
              fullWidth
              label="Tipo de Cuenta"
              name="cue_tipo"
              value={form.cue_tipo}
              onChange={handleChange}
              required
            >
              <MenuItem value=""><em>Seleccione tipo</em></MenuItem>
              {TIPOS_CUENTA.map((tipo) => (
                <MenuItem key={tipo.value} value={tipo.value}>{tipo.label}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarCuenta}>
                {modoEdicion ? 'Actualizar' : 'Guardar'}
              </Button>
              <Button variant="outlined" color="secondary" startIcon={<CleaningServicesIcon />} onClick={limpiarFormulario}>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listado de cuentas: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Banco</strong></TableCell>
                <TableCell><strong>Numero de Cuenta</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? datos.map((cuenta) => (
                <TableRow key={cuenta.CUE_ID} hover>
                  <TableCell>{cuenta.CUE_ID}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{obtenerNombreEmpleado(cuenta.EMP_ID)}</Typography>
                    <Typography variant="caption" color="text.secondary">#{cuenta.EMP_ID}</Typography>
                  </TableCell>
                  <TableCell>{cuenta.CUE_NOMBRE}</TableCell>
                  <TableCell>{cuenta.CUE_NUMERO}</TableCell>
                  <TableCell>{obtenerEtiquetaTipo(cuenta.CUE_TIPO)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleEditar(cuenta)}>
                        Editar
                      </Button>
                      <Button size="small" variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => handleEliminar(cuenta.CUE_ID)}>
                        Eliminar
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">No hay cuentas registradas</TableCell>
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

export default CuentaBancariaPage;
