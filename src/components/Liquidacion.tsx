import { useEffect, useMemo, useState } from 'react';
import type { Liquidacion, LiquidacionForm } from '../interfaces/liquidacion';
import type { Empleado } from '../interfaces/empleados';
import {
  obtenerLiquidaciones,
  calcularLiquidacion,
  crearLiquidacion,
  actualizarLiquidacion,
  eliminarLiquidacion
} from '../services/liquidacion.service';
import { obtenerEmpleados } from '../services/empleados.service';
import { getApiErrorMessage } from '../api/errors';
import { formatearMoneda, obtenerNombreEmpleado } from '../utils/relations';

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

const initialForm: LiquidacionForm = {
  liq_fecha_salida: '',
  liq_tipo_retiro: '',
  liq_dias_trabajado: '',
  liq_indemnizacion: '',
  liq_vacaciones_pagadas: '',
  liq_aguinaldo_proporcional: '',
  liq_bono14_proporcional: '',
  liq_liquidacion: '',
  liq_fecha_registro: '',
  emp_id: ''
};

function LiquidacionCRUD() {
  const [datos, setDatos] = useState<Liquidacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [resumenCalculo, setResumenCalculo] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [liqId, setLiqId] = useState<number | null>(null);
  const [form, setForm] = useState<LiquidacionForm>(initialForm);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const [liquidacionesData, empleadosData] = await Promise.all([
        obtenerLiquidaciones(),
        obtenerEmpleados(),
      ]);
      setDatos(liquidacionesData);
      setEmpleados(empleadosData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error cargando liquidaciones'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const empleadosPorId = useMemo(
    () => new Map(empleados.map((empleado) => [String(empleado.EMP_ID), empleado])),
    [empleados]
  );

  useEffect(() => {
    const debeCalcular = form.emp_id && form.liq_fecha_salida && form.liq_tipo_retiro;
    if (!debeCalcular) {
      setResumenCalculo('');
      return;
    }

    let cancelado = false;
    setCalculando(true);
    calcularLiquidacion(form)
      .then((calculo) => {
        if (cancelado) return;
        setForm((prev) => ({
          ...prev,
          liq_dias_trabajado: calculo.dias_trabajado,
          liq_indemnizacion: calculo.indemnizacion,
          liq_vacaciones_pagadas: calculo.vacaciones_pagadas,
          liq_aguinaldo_proporcional: calculo.aguinaldo_proporcional,
          liq_bono14_proporcional: calculo.bono14_proporcional,
          liq_liquidacion: calculo.liquidacion,
          liq_fecha_registro: prev.liq_fecha_registro || new Date().toISOString().slice(0, 10),
        }));
        setResumenCalculo(
          `Inicio laboral ${calculo.fecha_inicio} | Salario base ${formatearMoneda(calculo.salario_base)} | Vacaciones pendientes ${calculo.vacaciones_pendientes} dias | Eliminacion definitiva ${calculo.fecha_eliminacion || '3 meses despues'}`
        );
      })
      .catch((err: unknown) => {
        if (cancelado) return;
        setResumenCalculo('');
        setError(getApiErrorMessage(err, 'No se pudo calcular la liquidacion'));
      })
      .finally(() => {
        if (!cancelado) setCalculando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [form.emp_id, form.liq_fecha_salida, form.liq_tipo_retiro]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setLiqId(null);
    setError('');
    setResumenCalculo('');
  };

  const validar = () => {
    if (!String(form.emp_id).trim() || !form.liq_fecha_salida.trim() || !form.liq_tipo_retiro.trim()) {
      setError('Empleado, fecha de salida y tipo de retiro son obligatorios');
      return false;
    }

    if (Number(form.liq_liquidacion || 0) <= 0) {
      setError('Primero espera a que el sistema calcule la liquidacion');
      return false;
    }

    return true;
  };

  const guardar = async () => {
    try {
      setError('');
      setMensaje('');
      if (!validar()) return;

      if (modoEdicion && liqId !== null) {
        await actualizarLiquidacion(liqId, form);
        setMensaje('Liquidacion actualizada correctamente');
      } else {
        await crearLiquidacion(form);
        setMensaje('Liquidacion creada. El empleado queda retenido 3 meses antes de eliminacion definitiva.');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error guardando liquidacion'));
    }
  };

  const handleEliminar = async (idEliminar: number) => {
    if (!window.confirm('Deseas eliminar esta liquidacion?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarLiquidacion(idEliminar);
      setMensaje('Liquidacion eliminada correctamente');
      if (liqId === idEliminar) limpiarFormulario();
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error eliminando liquidacion'));
    }
  };

  const handleEditar = (l: Liquidacion) => {
    setModoEdicion(true);
    setLiqId(l.LIQ_ID);
    setMensaje('');
    setError('');
    setResumenCalculo('');
    setForm({
      liq_fecha_salida: l.LIQ_FECHA_SALIDA ? String(l.LIQ_FECHA_SALIDA).split('T')[0] : '',
      liq_tipo_retiro: l.LIQ_TIPO_RETIRO,
      liq_dias_trabajado: String(l.LIQ_DIAS_TRABAJADO || ''),
      liq_indemnizacion: String(l.LIQ_INDEMNIZACION || ''),
      liq_vacaciones_pagadas: String(l.LIQ_VACACIONES_PAGADAS || ''),
      liq_aguinaldo_proporcional: String(l.LIQ_AGUINALDO_PROPORCIONAL || ''),
      liq_bono14_proporcional: String(l.LIQ_BONO14_PROPORCIONAL || ''),
      liq_liquidacion: String(l.LIQ_LIQUIDACION || ''),
      liq_fecha_registro: l.LIQ_FECHA_REGISTRO ? String(l.LIQ_FECHA_REGISTRO).split('T')[0] : '',
      emp_id: String(l.EMP_ID || '')
    });
  };

  const obtenerChipTipoRetiro = (tipo: string) => {
    const lower = tipo?.toLowerCase() || '';
    if (lower.includes('voluntar')) return <Chip label={tipo} color="info" size="small" />;
    if (lower.includes('despido')) return <Chip label={tipo} color="error" size="small" />;
    if (lower.includes('mutuo')) return <Chip label={tipo} color="success" size="small" />;
    return <Chip label={tipo || '-'} color="default" size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando liquidaciones...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AccountBalanceWalletIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Gestion de Liquidaciones
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar liquidacion' : 'Nueva liquidacion'}
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          Selecciona primero el empleado. El sistema calcula la liquidacion con contrato, salario del puesto y registros laborales. Al guardar, el empleado queda liquidado y retenido 3 meses antes de eliminacion definitiva.
        </Alert>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Empleado</InputLabel>
              <Select name="emp_id" value={String(form.emp_id)} label="Empleado" onChange={handleChange}>
                <MenuItem value="">Seleccione empleado</MenuItem>
                {empleados.map((empleado) => (
                  <MenuItem key={empleado.EMP_ID} value={String(empleado.EMP_ID)}>
                    {obtenerNombreEmpleado(empleado)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField
              fullWidth
              label="Fecha de salida"
              name="liq_fecha_salida"
              type="date"
              value={form.liq_fecha_salida}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo de retiro</InputLabel>
              <Select name="liq_tipo_retiro" value={form.liq_tipo_retiro} label="Tipo de retiro" onChange={handleChange}>
                <MenuItem value="">Seleccione tipo</MenuItem>
                <MenuItem value="Voluntario">Voluntario</MenuItem>
                <MenuItem value="Despido">Despido</MenuItem>
                <MenuItem value="Mutuo acuerdo">Mutuo acuerdo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {resumenCalculo && (
            <Grid size={{ xs: 12 }}>
              <Alert severity="success">{calculando ? 'Calculando liquidacion...' : resumenCalculo}</Alert>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Dias trabajados" value={form.liq_dias_trabajado} slotProps={{ input: { readOnly: true } }} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Indemnizacion" value={formatearMoneda(Number(form.liq_indemnizacion || 0))} slotProps={{ input: { readOnly: true } }} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Vacaciones pagadas" value={formatearMoneda(Number(form.liq_vacaciones_pagadas || 0))} slotProps={{ input: { readOnly: true } }} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Aguinaldo proporcional" value={formatearMoneda(Number(form.liq_aguinaldo_proporcional || 0))} slotProps={{ input: { readOnly: true } }} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Bono 14 proporcional" value={formatearMoneda(Number(form.liq_bono14_proporcional || 0))} slotProps={{ input: { readOnly: true } }} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Fecha de registro"
              name="liq_fecha_registro"
              type="date"
              value={form.liq_fecha_registro}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Total liquidacion (calculado)"
              value={formatearMoneda(Number(form.liq_liquidacion || 0))}
              slotProps={{ input: { readOnly: true } }}
              sx={{ backgroundColor: '#f5f5f5' }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={guardar} disabled={calculando}>
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
          Listado de liquidaciones: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Tipo Retiro</strong></TableCell>
                <TableCell><strong>Dias Trabajados</strong></TableCell>
                <TableCell><strong>Total Liquidacion</strong></TableCell>
                <TableCell><strong>Fecha Salida</strong></TableCell>
                <TableCell><strong>Eliminacion definitiva</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((l) => {
                  const empleado = empleadosPorId.get(String(l.EMP_ID));
                  return (
                    <TableRow key={l.LIQ_ID} hover>
                      <TableCell>{l.LIQ_ID}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{obtenerNombreEmpleado(empleado) || l.EMPLEADO || `Empleado #${l.EMP_ID}`}</Typography>
                        <Typography variant="caption" color="text.secondary">ID: {l.EMP_ID}</Typography>
                      </TableCell>
                      <TableCell>{obtenerChipTipoRetiro(l.LIQ_TIPO_RETIRO)}</TableCell>
                      <TableCell>{l.LIQ_DIAS_TRABAJADO}</TableCell>
                      <TableCell>{formatearMoneda(l.LIQ_LIQUIDACION)}</TableCell>
                      <TableCell>{l.LIQ_FECHA_SALIDA ? new Date(l.LIQ_FECHA_SALIDA).toLocaleDateString('es-GT') : '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{l.LIQ_FECHA_ELIMINACION_TXT || 'Ejecuta migracion'}</Typography>
                        <Chip size="small" color="warning" label={l.LIQ_ESTADO_RETENCION_TXT || 'RETENIDA'} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleEditar(l)}>
                            Editar
                          </Button>
                          <Button size="small" variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => handleEliminar(l.LIQ_ID)}>
                            Eliminar
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">No hay liquidaciones registradas</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setMensaje('')} sx={{ width: '100%' }}>{mensaje}</Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>{error}</Alert>
      </Snackbar>
    </Box>
  );
}

export default LiquidacionCRUD;
