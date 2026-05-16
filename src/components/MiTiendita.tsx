import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputAdornment,
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
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';

import StorefrontIcon from '@mui/icons-material/Storefront';
import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { useAuth } from '../context/AuthContext';

import type {
  PagoMiTiendita,
  PagoMiTienditaForm,
  TipoGastoMiTiendita,
} from '../interfaces/miTiendita';

import {
  actualizarPagoMiTiendita,
  crearPagoMiTiendita,
  eliminarPagoMiTiendita,
  obtenerMisPagosMiTiendita,
} from '../services/miTiendita.service';

import { getApiErrorMessage } from '../api/errors';
import { formatearFecha, formatearMoneda } from '../utils/relations';

const hoy = () => new Date().toISOString().slice(0, 10);

const initialForm: PagoMiTienditaForm = {
  mit_tipo_gasto: '',
  mit_monto: '',
  mit_fecha: hoy(),
  mit_descripcion: '',
  tds_id: null,
};

const tiposGasto: Array<{
  value: TipoGastoMiTiendita;
  label: string;
  helper: string;
}> = [
  {
    value: 'SEGURO',
    label: 'Seguro',
    helper: 'Pago de seguro contratado por la empresa',
  },
  {
    value: 'PARQUEO',
    label: 'Parqueo',
    helper: 'Pago por uso de parqueo de la empresa',
  },
  {
    value: 'TIENDA',
    label: 'Tienda',
    helper: 'Compra o consumo en tienda de la empresa',
  },
];

const numero = (valor: number | string | null | undefined) => Number(valor || 0);

function MiTiendita() {
  const { user } = useAuth();

  const [datos, setDatos] = useState<PagoMiTiendita[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<PagoMiTienditaForm>(initialForm);

  const authUser = user as typeof user & {
    EMP_ID?: number | null;
  };

  const empIdLogueado = Number(authUser?.emp_id ?? authUser?.EMP_ID ?? 0);

  const nombreUsuario =
    user?.nombre_completo ||
    user?.username ||
    user?.correo ||
    'Usuario logueado';

  const montoGasto = numero(form.mit_monto);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');

      const pagosData = await obtenerMisPagosMiTiendita();
      setDatos(pagosData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error cargando pagos de Mi Tiendita'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name as string]: value,
    }));
  };

  const limpiarFormulario = () => {
    setForm({ ...initialForm, mit_fecha: hoy() });
    setModoEdicion(false);
    setId(null);
    setError('');
  };

  const validar = () => {
    if (!empIdLogueado) {
      setError('Tu usuario no tiene un empleado asociado. Contacta al administrador.');
      return false;
    }

    if (!form.mit_tipo_gasto) {
      setError('El tipo de gasto es obligatorio');
      return false;
    }

    if (!String(form.mit_monto).trim()) {
      setError('El monto es obligatorio');
      return false;
    }

    if (montoGasto <= 0) {
      setError('El monto debe ser mayor a 0');
      return false;
    }

    if (!form.mit_fecha.trim()) {
      setError('La fecha del gasto es obligatoria');
      return false;
    }

    return true;
  };

  const obtenerPayload = (): PagoMiTienditaForm => ({
    ...form,
    mit_monto: montoGasto.toFixed(2),
    mit_descripcion: form.mit_descripcion.trim(),
    tds_id: form.tds_id || null,
  });

  const guardar = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validar()) return;

      const payload = obtenerPayload();

      if (modoEdicion && id !== null) {
        await actualizarPagoMiTiendita(id, payload, empIdLogueado);
        setMensaje('Gasto actualizado correctamente');
      } else {
        await crearPagoMiTiendita(payload, empIdLogueado);
        setMensaje('Gasto registrado correctamente. Queda pendiente de aplicación en nómina.');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error guardando gasto de Mi Tiendita'));
    }
  };

  const handleEditar = (pago: PagoMiTiendita) => {
    if (pago.MIT_ESTADO !== 'PENDIENTE') {
      setError('Solo puedes editar gastos pendientes.');
      return;
    }

    setModoEdicion(true);
    setId(pago.MIT_ID);
    setMensaje('');
    setError('');

    setForm({
      mit_tipo_gasto: (pago.MIT_TIPO_GASTO as TipoGastoMiTiendita) || '',
      mit_monto: String(pago.MIT_MONTO),
      mit_fecha: formatearFecha(pago.MIT_FECHA),
      mit_descripcion: pago.MIT_DESCRIPCION ?? '',
      tds_id: pago.TDS_ID ?? null,
    });
  };

  const handleEliminar = async (pago: PagoMiTiendita) => {
    if (pago.MIT_ESTADO !== 'PENDIENTE') {
      setError('Solo puedes eliminar gastos pendientes.');
      return;
    }

    if (!window.confirm('¿Deseas eliminar este gasto de Mi Tiendita?')) return;

    try {
      setError('');
      setMensaje('');

      await eliminarPagoMiTiendita(pago.MIT_ID);

      setMensaje('Gasto eliminado correctamente');

      if (id === pago.MIT_ID) limpiarFormulario();

      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error eliminando gasto de Mi Tiendita'));
    }
  };

  const obtenerChipTipo = (tipo: string) => {
    const colorMap: Record<string, 'primary' | 'warning' | 'success'> = {
      SEGURO: 'primary',
      PARQUEO: 'warning',
      TIENDA: 'success',
    };

    return <Chip label={tipo} color={colorMap[tipo] ?? 'default'} size="small" />;
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'APLICADO') return <Chip label="Aplicado" color="success" size="small" />;
    if (estado === 'PENDIENTE') return <Chip label="Pendiente" color="warning" size="small" />;
    if (estado === 'ANULADO') return <Chip label="Anulado" color="default" size="small" />;

    return <Chip label={estado} size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando Mi Tiendita...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <StorefrontIcon color="primary" />

          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Mi Tiendita
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Estás registrando gastos para: <strong>{nombreUsuario}</strong>. Los gastos quedan
          en estado pendiente y serán aplicados posteriormente en nómina.
        </Alert>

        {!empIdLogueado ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Tu usuario no tiene un empleado asociado. No podrás registrar gastos hasta que el
            administrador relacione tu usuario con un empleado.
          </Alert>
        ) : null}

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar gasto' : 'Nuevo gasto'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo de gasto</InputLabel>

              <Select
                name="mit_tipo_gasto"
                value={form.mit_tipo_gasto}
                label="Tipo de gasto"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione tipo</MenuItem>

                {tiposGasto.map((tipo) => (
                  <MenuItem key={tipo.value} value={tipo.value} title={tipo.helper}>
                    {tipo.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Monto del gasto"
              name="mit_monto"
              type="number"
              value={form.mit_monto}
              onChange={handleChange}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">Q</InputAdornment>,
                },
                htmlInput: {
                  min: 0,
                  step: 0.01,
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Fecha del gasto"
              name="mit_fecha"
              type="date"
              value={form.mit_fecha}
              onChange={handleChange}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Descripción"
              name="mit_descripcion"
              value={form.mit_descripcion}
              onChange={handleChange}
              multiline
              minRows={2}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Resumen
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Monto registrado: {formatearMoneda(montoGasto)}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Estado inicial: Pendiente
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardar}
                disabled={!empIdLogueado}
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
          Mis registros de Mi Tiendita: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Monto</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((pago) => (
                  <TableRow key={pago.MIT_ID} hover>
                    <TableCell>{pago.MIT_ID}</TableCell>
                    <TableCell>{obtenerChipTipo(pago.MIT_TIPO_GASTO)}</TableCell>
                    <TableCell>{formatearMoneda(pago.MIT_MONTO)}</TableCell>
                    <TableCell>{formatearFecha(pago.MIT_FECHA)}</TableCell>
                    <TableCell>{pago.MIT_DESCRIPCION || '-'}</TableCell>
                    <TableCell>{obtenerChipEstado(pago.MIT_ESTADO)}</TableCell>

                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditIcon />}
                          disabled={pago.MIT_ESTADO !== 'PENDIENTE'}
                          onClick={() => handleEditar(pago)}
                        >
                          Editar
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<DeleteIcon />}
                          disabled={pago.MIT_ESTADO !== 'PENDIENTE'}
                          onClick={() => handleEliminar(pago)}
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
                    No hay gastos registrados
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

export default MiTiendita;