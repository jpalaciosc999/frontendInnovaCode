import { useEffect, useState } from 'react';
import type { CuentaBancaria, CuentaBancariaForm } from '../interfaces/cuentaBancaria';
import type { Empleado } from '../interfaces/empleados';
import {
  obtenerCuentas,
  crearCuenta,
  actualizarCuenta,
  eliminarCuenta
} from '../services/cuentaBancaria.service';
import { obtenerEmpleados } from '../services/empleados.service';

import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  InputAdornment,
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
  Typography
} from '@mui/material';

import SaveIcon             from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon             from '@mui/icons-material/Edit';
import DeleteIcon           from '@mui/icons-material/Delete';
import AccountBalanceIcon   from '@mui/icons-material/AccountBalance';
import SearchIcon           from '@mui/icons-material/Search';
import CloseIcon            from '@mui/icons-material/Close';
import PersonSearchIcon     from '@mui/icons-material/PersonSearch';

// ─── Bancos de Guatemala ──────────────────────────────────────────────────────
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
  'Banco de América Central (BAC)',
  'Citibank Guatemala',
  'Vivibanco',
  'Acceso Financiero',
  'Crédito Hipotecario Nacional (CHN)',
  'Bancomext Guatemala',
];

const TIPOS_CUENTA = [
  { value: 'MON', label: 'Monetaria' },
  { value: 'AHO', label: 'Ahorros' },
  { value: 'COR', label: 'Corriente' },
];

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
  const [datos, setDatos]               = useState<CuentaBancaria[]>([]);
  const [cargando, setCargando]         = useState(true);
  const [error, setError]               = useState('');
  const [mensaje, setMensaje]           = useState('');
  const [modoEdicion, setModoEdicion]   = useState(false);
  const [cueId, setCueId]               = useState<number | null>(null);
  const [form, setForm]                 = useState<CuentaBancariaForm>(initialForm);
  const [empNombre, setEmpNombre]       = useState('');
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empleados, setEmpleados]       = useState<Empleado[]>([]);
  const [cargandoEmps, setCargandoEmps] = useState(false);
  const [filtroEmp, setFiltroEmp]       = useState('');
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

  const abrirModalEmpleados = async () => {
    setModalAbierto(true);
    setFiltroEmp('');
    if (empleados.length === 0) {
      try {
        setCargandoEmps(true);
        const data = await obtenerEmpleados();
        setEmpleados(data);
      } catch (err: any) {
        setError('Error cargando empleados: ' + err.message);
      } finally {
        setCargandoEmps(false);
      }
    }
  };

  const seleccionarEmpleado = (emp: Empleado) => {
    setForm(prev => ({ ...prev, emp_id: String(emp.EMP_ID) }));
    const nombre = [emp.EMP_NOMBRE, emp.EMP_APELLIDO].filter(Boolean).join(' ');
    setEmpNombre(nombre || `Empleado #${emp.EMP_ID}`);
    setModalAbierto(false);
  };

  const empleadosFiltrados = empleados.filter(emp => {
    const texto  = filtroEmp.toLowerCase();
    const nombre = [emp.EMP_NOMBRE, emp.EMP_APELLIDO].filter(Boolean).join(' ').toLowerCase();
    return nombre.includes(texto) || String(emp.EMP_ID).includes(texto);
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name as string]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setEmpNombre('');
    setModoEdicion(false);
    setCueId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!form.ban_nombre.trim() || !form.cue_numero.trim() || !form.cue_tipo || !form.emp_id) {
      setError('Todos los campos son obligatorios');
      return false;
    }

    if (!/^\d+$/.test(form.cue_numero)) {
      setError('El número de cuenta debe contener solo dígitos');
      return false;
    }
    if (form.cue_numero.length > 50) {
      setError('El número de cuenta no puede exceder 50 caracteres');
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
    setMensaje(''); setError('');
    setEmpNombre(`Empleado #${cue.EMP_ID}`);
    setForm({
      ban_nombre: cue.CUE_NOMBRE || '',
      cue_numero: cue.CUE_NUMERO || '',
      cue_tipo: cue.CUE_TIPO || '',
      emp_id: String(cue.EMP_ID) || ''
    });
  };

  const obtenerEtiquetaTipo = (tipo: string) => {
    const colores: Record<string, 'primary' | 'success' | 'info'> = {
      MON: 'primary', AHO: 'success', COR: 'info'
    };
    const etiquetas: Record<string, string> = {
      MON: 'Monetaria', AHO: 'Ahorros', COR: 'Corriente'
    };
    return (
      <Chip label={etiquetas[tipo] ?? tipo} color={colores[tipo] ?? 'default'} size="small" />
    );
  };

  if (cargando) {
    return <Box sx={{ p: 3 }}><Typography variant="h6">Cargando cuentas bancarias...</Typography></Box>;
  }

  return (
    <Box sx={{ py: 2 }}>

      {/* ── Formulario ─────────────────────────────────────────────────────── */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AccountBalanceIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Cuentas Bancarias
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar cuenta bancaria' : 'Nueva cuenta bancaria'}
        </Typography>

        <Grid container spacing={2}>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Empleado"
              value={empNombre ? `#${form.emp_id} — ${empNombre}` : ''}
              placeholder="Haz clic para seleccionar un empleado"
              onClick={abrirModalEmpleados}
              slotProps={{
                input: {
                  readOnly: true,
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={abrirModalEmpleados} edge="end">
                        <PersonSearchIcon color="primary" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { cursor: 'pointer' }
                }
              }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth label="Nombre del Banco" name="ban_nombre"
              value={form.ban_nombre} onChange={handleChange} required>
              <MenuItem value=""><em>Seleccione un banco</em></MenuItem>
              {BANCOS_GUATEMALA.map(banco => (
                <MenuItem key={banco} value={banco}>{banco}</MenuItem>
              ))}
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth label="Número de Cuenta" name="cue_numero" type="text"
              value={form.cue_numero} onChange={handleChange}
              placeholder="Ej: 0123456789"
              slotProps={{ htmlInput: { maxLength: 50, inputMode: 'numeric', pattern: '[0-9]*' } }}
              required
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField select fullWidth label="Tipo de Cuenta" name="cue_tipo"
              value={form.cue_tipo} onChange={handleChange} required>
              <MenuItem value=""><em>Seleccione tipo</em></MenuItem>
              {TIPOS_CUENTA.map(t => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
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

      {/* ── Tabla ───────────────────────────────────────────────────────────── */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listado de cuentas: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Emp. ID</strong></TableCell>
                <TableCell><strong>Banco</strong></TableCell>
                <TableCell><strong>Número de Cuenta</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? datos.map(cue => (
                <TableRow key={cue.CUE_ID} hover>
                  <TableCell>{cue.CUE_ID}</TableCell>
                  <TableCell>{cue.EMP_ID}</TableCell>
                  <TableCell>{cue.CUE_NOMBRE}</TableCell>
                  <TableCell>{cue.CUE_NUMERO}</TableCell>
                  <TableCell>{obtenerEtiquetaTipo(cue.CUE_TIPO)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleEditar(cue)}>
                        Editar
                      </Button>
                      <Button size="small" variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => handleEliminar(cue.CUE_ID)}>
                        Eliminar
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">No hay cuentas registradas</TableCell>
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

      <Dialog
        open={modalAbierto}
        onClose={() => setModalAbierto(false)}
        fullWidth
        maxWidth="sm"
        slotProps={{ paper: { sx: { borderRadius: 3 } } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonSearchIcon color="primary" />
            {/* ✅ FIX: fontWeight dentro de sx, no como prop directa */}
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Seleccionar Empleado
            </Typography>
          </Box>
          <IconButton onClick={() => setModalAbierto(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <TextField
            fullWidth
            autoFocus
            placeholder="Buscar por nombre o ID..."
            value={filtroEmp}
            onChange={e => setFiltroEmp(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }
            }}
          />

          {cargandoEmps ? (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
              Cargando empleados...
            </Typography>
          ) : (
            <TableContainer sx={{ maxHeight: 360 }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>ID</strong></TableCell>
                    <TableCell><strong>Nombre</strong></TableCell>
                    <TableCell><strong>Apellido</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {empleadosFiltrados.length > 0 ? (
                    empleadosFiltrados.map(emp => (
                      <TableRow
                        key={emp.EMP_ID}
                        hover
                        onClick={() => seleccionarEmpleado(emp)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{emp.EMP_ID}</TableCell>
                        <TableCell>{emp.EMP_NOMBRE}</TableCell>
                        <TableCell>{emp.EMP_APELLIDO}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">No se encontraron empleados</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Snackbars ───────────────────────────────────────────────────────── */}
      <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setMensaje('')} sx={{ width: '100%' }}>{mensaje}</Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>{error}</Alert>
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