import { useEffect, useMemo, useState } from 'react';
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
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import type { Empleado } from '../interfaces/empleados';
import type { Periodo } from '../interfaces/periodo';
import type { Puesto } from '../interfaces/puestos';
import type { Ingreso } from '../interfaces/tipoIngresos';
import type { Descuento } from '../interfaces/descuentos';
import type { NominaAsignacion, NominaAsignacionForm } from '../interfaces/nomina-asignacion';
import { obtenerEmpleados } from '../services/empleados.service';
import { obtenerPeriodos } from '../services/periodo.service';
import { obtenerPuestos } from '../services/puestos.service';
import { obtenerIngresos } from '../services/tipoIngresos.service';
import { obtenerDescuentos } from '../services/descuentos.service';
import {
  actualizarNominaAsignacion,
  crearNominaAsignacion,
  eliminarNominaAsignacion,
  obtenerNominaAsignaciones,
} from '../services/nomina-asignacion.service';
import { getApiErrorMessage } from '../api/errors';
import { formatearFecha, formatearMoneda, obtenerNombreEmpleado } from '../utils/relations';
import PeriodoBadge from './common/PeriodoBadge';
import { useUnsavedFormGuard } from '../hooks/useUnsavedFormGuard';

const initialForm: NominaAsignacionForm = {
  per_id: '',
  emp_id: '',
  nas_tipo: '',
  tis_id: null,
  tds_id: null,
  nas_monto: '',
  nas_cantidad: '',
  nas_referencia: '',
  nas_descripcion: '',
  nas_estado: 'A',
};

function NominaAsignaciones() {
  const [asignaciones, setAsignaciones] = useState<NominaAsignacion[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [form, setForm] = useState<NominaAsignacionForm>(initialForm);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const [asignacionesData, empleadosData, periodosData, puestosData, ingresosData, descuentosData] = await Promise.all([
        obtenerNominaAsignaciones(filtroPeriodo ? { per_id: filtroPeriodo } : undefined),
        obtenerEmpleados(),
        obtenerPeriodos(),
        obtenerPuestos(),
        obtenerIngresos(),
        obtenerDescuentos(),
      ]);
      setAsignaciones(asignacionesData);
      setEmpleados(empleadosData);
      setPeriodos(periodosData);
      setPuestos(puestosData);
      setIngresos(ingresosData);
      setDescuentos(descuentosData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error cargando asignaciones. Verifica que el backend tenga /nomina-asignaciones.'));
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

  const empleadosAsignables = useMemo(
    () => empleados.filter((empleado) => {
      const estado = String(empleado.EMP_ESTADO || 'A').toUpperCase();
      const estaLiquidado = Boolean(empleado.EMP_FECHA_LIQUIDACION);
      return (estado === 'A' && !estaLiquidado) || String(empleado.EMP_ID) === String(form.emp_id || '');
    }),
    [empleados, form.emp_id]
  );

  const periodosPorId = useMemo(
    () => new Map(periodos.map((periodo) => [String(periodo.PER_ID), periodo])),
    [periodos]
  );

  const normalizePeriodoEstado = (estado: string) => String(estado || '').trim().toUpperCase();
  const periodoForm = periodosPorId.get(String(form.per_id));
  const periodoFormBloqueado = ['APROBADO', 'CERRADO'].includes(normalizePeriodoEstado(periodoForm?.PER_ESTADO || ''));

  const puestosPorId = useMemo(
    () => new Map(puestos.map((puesto) => [String(puesto.PUE_ID), puesto])),
    [puestos]
  );

  const ingresosPorId = useMemo(
    () => new Map(ingresos.map((ingreso) => [String(ingreso.TIS_ID), ingreso])),
    [ingresos]
  );

  const descuentosPorId = useMemo(
    () => new Map(descuentos.map((descuento) => [String(descuento.TDS_ID), descuento])),
    [descuentos]
  );

  const asignacionesFiltradas = useMemo(
    () => filtroPeriodo
      ? asignaciones.filter((asignacion) => String(asignacion.PER_ID) === String(filtroPeriodo))
      : asignaciones,
    [asignaciones, filtroPeriodo]
  );

  const obtenerSalarioAsignado = (empleadoId: string | number | null | undefined) => {
    if (!empleadoId) return 0;

    const empleado = empleadosPorId.get(String(empleadoId));
    if (!empleado) return 0;

    const sueldoEmpleado = Number(empleado.EMP_SUELDO || 0);
    if (sueldoEmpleado > 0) return sueldoEmpleado;

    const puesto = empleado.PUE_ID ? puestosPorId.get(String(empleado.PUE_ID)) : undefined;
    return Number(puesto?.PUE_SALARIO_BASE || 0);
  };

  const esConceptoSalario = (ingresoId: string | number | null | undefined) => {
    if (!ingresoId) return false;

    const ingreso = ingresosPorId.get(String(ingresoId));
    const texto = `${ingreso?.TIS_CODIGO ?? ''} ${ingreso?.TIS_NOMBRE ?? ''}`.toUpperCase();
    return texto.includes('SALARIO') || texto.includes('SUELDO');
  };

  const obtenerMontoSugerido = (next: NominaAsignacionForm) => {
    if (next.nas_tipo === 'I' && next.tis_id) {
      const ingreso = ingresosPorId.get(String(next.tis_id));
      if (!ingreso) return 0;

      if (esConceptoSalario(next.tis_id)) {
        return obtenerSalarioAsignado(next.emp_id);
      }

      return Number(ingreso.TIS_VALOR_BASE || 0);
    }

    if (next.nas_tipo === 'D' && next.tds_id) {
      const descuento = descuentosPorId.get(String(next.tds_id));
      if (!descuento) return 0;

      const tipoCalculo = String(descuento.TDS_TIPO_CALCULO || '').toUpperCase();
      const porcentaje = Number(descuento.TDS_PORCENTAJE || 0);
      if (tipoCalculo.includes('PORC') && porcentaje > 0) {
        return obtenerSalarioAsignado(next.emp_id) * (porcentaje / 100);
      }

      return Number(descuento.TDS_VALOR_BASE || 0);
    }

    return 0;
  };

  const completarMontoSiAplica = (next: NominaAsignacionForm) => {
    const monto = obtenerMontoSugerido(next);
    if (monto <= 0) return next;

    const referencia = next.nas_referencia
      || (next.nas_tipo === 'I' && esConceptoSalario(next.tis_id) ? 'Salario base' : '');

    return {
      ...next,
      nas_monto: monto.toFixed(2),
      nas_referencia: referencia,
    };
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name as string]: value };
      if (name === 'nas_tipo') {
        return { ...next, tis_id: null, tds_id: null, nas_monto: '' };
      }
      if (name === 'emp_id' || name === 'tis_id' || name === 'tds_id') {
        return completarMontoSiAplica(next);
      }
      return next;
    });
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setEditandoId(null);
    setError('');
  };

  const validar = () => {
    if (!form.per_id || !form.emp_id || !form.nas_tipo || !form.nas_monto) {
      setError('Periodo, empleado, tipo y monto son obligatorios.');
      return false;
    }
    if (form.nas_tipo === 'I' && !form.tis_id) {
      setError('Selecciona el concepto de ingreso.');
      return false;
    }
    if (form.nas_tipo === 'D' && !form.tds_id) {
      setError('Selecciona el concepto de egreso.');
      return false;
    }
    if (Number(form.nas_monto) < 0) {
      setError('El monto no puede ser negativo.');
      return false;
    }
    return true;
  };

  const guardar = async () => {
    try {
      setError('');
      setMensaje('');
      if (periodoFormBloqueado) {
        setError('No se pueden guardar asignaciones en periodos aprobados o cerrados.');
        return false;
      }
      if (!validar()) return false;

      if (editandoId !== null) {
        await actualizarNominaAsignacion(editandoId, form);
        setMensaje('Asignacion actualizada correctamente.');
      } else {
        await crearNominaAsignacion(form);
        setMensaje('Asignacion creada correctamente.');
      }

      limpiarFormulario();
      await cargarDatos();
      return true;
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error guardando asignacion.'));
      return false;
    }
  };

  useUnsavedFormGuard(form, initialForm, guardar);

  const editar = (asignacion: NominaAsignacion) => {
    setEditandoId(asignacion.NAS_ID);
    setForm({
      per_id: asignacion.PER_ID,
      emp_id: asignacion.EMP_ID,
      nas_tipo: asignacion.NAS_TIPO,
      tis_id: asignacion.TIS_ID,
      tds_id: asignacion.TDS_ID,
      nas_monto: asignacion.NAS_MONTO,
      nas_cantidad: asignacion.NAS_CANTIDAD ?? '',
      nas_referencia: asignacion.NAS_REFERENCIA ?? '',
      nas_descripcion: asignacion.NAS_DESCRIPCION ?? '',
      nas_estado: asignacion.NAS_ESTADO || 'A',
    });
  };

  const eliminar = async (id: number) => {
    if (!window.confirm('Deseas eliminar esta asignacion?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarNominaAsignacion(id);
      setMensaje('Asignacion eliminada correctamente.');
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error eliminando asignacion.'));
    }
  };

  const obtenerPeriodo = (perId: number) => {
    const periodo = periodosPorId.get(String(perId));
    return periodo
      ? `${formatearFecha(periodo.PER_FECHA_INICIO)} al ${formatearFecha(periodo.PER_FECHA_FIN)}`
      : `Periodo #${perId}`;
  };

  const obtenerConcepto = (asignacion: NominaAsignacion) => {
    if (asignacion.NAS_TIPO === 'I') {
      const ingreso = ingresosPorId.get(String(asignacion.TIS_ID));
      return ingreso ? `${ingreso.TIS_CODIGO} - ${ingreso.TIS_NOMBRE}` : `Ingreso #${asignacion.TIS_ID}`;
    }

    const descuento = descuentosPorId.get(String(asignacion.TDS_ID));
    return descuento ? `${descuento.TDS_CODIGO} - ${descuento.TDS_NOMBRE}` : `Egreso #${asignacion.TDS_ID}`;
  };

  const montoSugeridoActual = obtenerMontoSugerido(form);
  const conceptoConMontoSugerido = Boolean(form.nas_tipo && (form.tis_id || form.tds_id));
  const conceptoSalarioSeleccionado = form.nas_tipo === 'I' && esConceptoSalario(form.tis_id);

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <AssignmentIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Asignaciones por Periodo
          </Typography>
          {periodoForm && (
            <Box sx={{ ml: 'auto' }}>
              <PeriodoBadge estado={periodoForm.PER_ESTADO} />
            </Box>
          )}
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Aqui se capturan ingresos y egresos variables antes de generar la nomina. La generacion toma estas asignaciones y crea el detalle final.
        </Alert>

        {periodoFormBloqueado && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Este periodo está {normalizePeriodoEstado(periodoForm?.PER_ESTADO)}. No se pueden agregar ni modificar asignaciones.
          </Alert>
        )}

        {conceptoConMontoSugerido && (
          <Alert severity={montoSugeridoActual > 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
            {montoSugeridoActual > 0
              ? `Monto sugerido detectado: ${formatearMoneda(montoSugeridoActual)}. Se carga automaticamente al seleccionar el concepto.`
              : conceptoSalarioSeleccionado
                ? 'No se encontro salario asignado para este empleado. Revisa EMP_SUELDO o el salario base del puesto.'
                : 'Este concepto no tiene valor base configurado. Revisa el catalogo de ingresos/descuentos o escribe el monto manualmente.'}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth required>
              <InputLabel>Periodo</InputLabel>
              <Select name="per_id" value={String(form.per_id)} label="Periodo" onChange={handleChange}>
                <MenuItem value="">Seleccione periodo</MenuItem>
                {periodos.map((periodo) => (
                  <MenuItem key={periodo.PER_ID} value={String(periodo.PER_ID)}>
                    {obtenerPeriodo(periodo.PER_ID)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth required>
              <InputLabel>Empleado</InputLabel>
              <Select name="emp_id" value={String(form.emp_id)} label="Empleado" onChange={handleChange}>
                <MenuItem value="">Seleccione empleado</MenuItem>
                {empleadosAsignables.map((empleado) => (
                  <MenuItem key={empleado.EMP_ID} value={String(empleado.EMP_ID)}>
                    {obtenerNombreEmpleado(empleado)}
                    {empleado.EMP_FECHA_LIQUIDACION || String(empleado.EMP_ESTADO || 'A').toUpperCase() !== 'A' ? ' - liquidado' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth required>
              <InputLabel>Tipo</InputLabel>
              <Select name="nas_tipo" value={form.nas_tipo} label="Tipo" onChange={handleChange}>
                <MenuItem value="">Seleccione tipo</MenuItem>
                <MenuItem value="I">Ingreso</MenuItem>
                <MenuItem value="D">Egreso</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {form.nas_tipo === 'I' && (
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Concepto de ingreso</InputLabel>
                <Select name="tis_id" value={String(form.tis_id ?? '')} label="Concepto de ingreso" onChange={handleChange}>
                  <MenuItem value="">Seleccione ingreso</MenuItem>
                  {ingresos.map((ingreso) => (
                    <MenuItem key={ingreso.TIS_ID} value={String(ingreso.TIS_ID)}>
                      {ingreso.TIS_CODIGO} - {ingreso.TIS_NOMBRE}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {form.nas_tipo === 'D' && (
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Concepto de egreso</InputLabel>
                <Select name="tds_id" value={String(form.tds_id ?? '')} label="Concepto de egreso" onChange={handleChange}>
                  <MenuItem value="">Seleccione egreso</MenuItem>
                  {descuentos.map((descuento) => (
                    <MenuItem key={descuento.TDS_ID} value={String(descuento.TDS_ID)}>
                      {descuento.TDS_CODIGO} - {descuento.TDS_NOMBRE}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth required label="Monto (Q)" name="nas_monto" type="number"
              value={form.nas_monto} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth label="Cantidad" name="nas_cantidad" type="number"
              value={form.nas_cantidad ?? ''} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Referencia" name="nas_referencia"
              value={form.nas_referencia} onChange={handleChange}
              placeholder="Ej. horas extra, anticipo, comision, orden judicial" />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Descripcion" name="nas_descripcion"
              value={form.nas_descripcion} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select name="nas_estado" value={form.nas_estado} label="Estado" onChange={handleChange}>
                <MenuItem value="A">Activa</MenuItem>
                <MenuItem value="I">Inactiva</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={guardar} disabled={cargando || periodoFormBloqueado}>
                {editandoId ? 'Actualizar asignacion' : 'Guardar asignacion'}
              </Button>
              <Button variant="outlined" color="secondary" startIcon={<CleaningServicesIcon />} onClick={limpiarFormulario}>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h6">Asignaciones: {asignacionesFiltradas.length}</Typography>
          <FormControl sx={{ minWidth: 320 }}>
            <InputLabel>Filtrar periodo</InputLabel>
            <Select value={filtroPeriodo} label="Filtrar periodo" onChange={(event) => setFiltroPeriodo(event.target.value)}>
              <MenuItem value="">Todos</MenuItem>
              {periodos.map((periodo) => (
                <MenuItem key={periodo.PER_ID} value={String(periodo.PER_ID)}>
                  {obtenerPeriodo(periodo.PER_ID)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {cargando ? (
          <Typography>Cargando asignaciones...</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Periodo</strong></TableCell>
                  <TableCell><strong>Empleado</strong></TableCell>
                  <TableCell><strong>Tipo</strong></TableCell>
                  <TableCell><strong>Concepto</strong></TableCell>
                  <TableCell align="right"><strong>Monto</strong></TableCell>
                  <TableCell><strong>Referencia</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Acciones</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {asignacionesFiltradas.length > 0 ? asignacionesFiltradas.map((asignacion) => {
                  const empleado = empleadosPorId.get(String(asignacion.EMP_ID));
                  return (
                    <TableRow key={asignacion.NAS_ID} hover>
                      <TableCell>{asignacion.NAS_ID}</TableCell>
                      <TableCell>{obtenerPeriodo(asignacion.PER_ID)}</TableCell>
                      <TableCell>{obtenerNombreEmpleado(empleado) || `Empleado #${asignacion.EMP_ID}`}</TableCell>
                      <TableCell>
                        <Chip
                          label={asignacion.NAS_TIPO === 'I' ? 'Ingreso' : 'Egreso'}
                          color={asignacion.NAS_TIPO === 'I' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{obtenerConcepto(asignacion)}</TableCell>
                      <TableCell align="right">{formatearMoneda(asignacion.NAS_MONTO)}</TableCell>
                      <TableCell>{asignacion.NAS_REFERENCIA || '-'}</TableCell>
                      <TableCell>{asignacion.NAS_ESTADO === 'A' ? 'Activa' : 'Inactiva'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => editar(asignacion)}
                            disabled={['APROBADO', 'CERRADO'].includes(normalizePeriodoEstado(periodosPorId.get(String(asignacion.PER_ID))?.PER_ESTADO || ''))}
                          >
                            Editar
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => eliminar(asignacion.NAS_ID)}
                            disabled={['APROBADO', 'CERRADO'].includes(normalizePeriodoEstado(periodosPorId.get(String(asignacion.PER_ID))?.PER_ESTADO || ''))}
                          >
                            Eliminar
                          </Button>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                }) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">No hay asignaciones registradas</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setMensaje('')} sx={{ width: '100%' }}>
          {mensaje}
        </Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default NominaAsignaciones;
