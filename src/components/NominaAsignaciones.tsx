import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  ListItemText,
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
import { calcularISR } from '../utils/payroll';
import PeriodoBadge from './common/PeriodoBadge';
import { useUnsavedFormGuard } from '../hooks/useUnsavedFormGuard';
import LookupSelect from './common/LookupSelect';

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
  const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<string[]>([]);
  const [ingresosSeleccionados, setIngresosSeleccionados] = useState<string[]>([]);
  const [descuentosSeleccionados, setDescuentosSeleccionados] = useState<string[]>([]);
  const [montosConceptos, setMontosConceptos] = useState<Record<string, string>>({});
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const [empleadosData, periodosData, puestosData, ingresosData, descuentosData] = await Promise.all([
        obtenerEmpleados(),
        obtenerPeriodos(),
        obtenerPuestos(),
        obtenerIngresos(),
        obtenerDescuentos(),
      ]);
      setEmpleados(empleadosData);
      setPeriodos(periodosData);
      setPuestos(puestosData);
      setIngresos(ingresosData);
      setDescuentos(descuentosData);

      try {
        const asignacionesData = await obtenerNominaAsignaciones(filtroPeriodo ? { per_id: filtroPeriodo } : undefined);
        setAsignaciones(asignacionesData);
      } catch (err: unknown) {
        setAsignaciones([]);
        setError(getApiErrorMessage(err, 'No se pudieron cargar las asignaciones, pero ya puedes seleccionar periodo y empleados.'));
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error cargando empleados, periodos o conceptos para asignaciones.'));
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
    () => [...empleados].sort((a, b) => {
      const nombreA = obtenerNombreEmpleado(a) || `Empleado #${a.EMP_ID}`;
      const nombreB = obtenerNombreEmpleado(b) || `Empleado #${b.EMP_ID}`;
      return nombreA.localeCompare(nombreB, 'es');
    }),
    [empleados]
  );

  const periodosPorId = useMemo(
    () => new Map(periodos.map((periodo) => [String(periodo.PER_ID), periodo])),
    [periodos]
  );

  const normalizePeriodoEstado = (estado?: string) => String(estado || '').trim().toUpperCase();
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

      const codigo = String(descuento.TDS_CODIGO || '').toUpperCase();
      if (codigo === 'ISR') {
        return calcularISR(obtenerSalarioAsignado(next.emp_id)).isr_mensual;
      }

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

  const obtenerClaveConcepto = (tipo: 'I' | 'D', conceptoId: string | number) => `${tipo}-${conceptoId}`;

  const obtenerMontoInicialConcepto = (
    tipo: 'I' | 'D',
    conceptoId: string,
    empleadoId = empleadosSeleccionados[0] || form.emp_id
  ) => {
    const monto = obtenerMontoSugerido({
      ...form,
      emp_id: empleadoId || '',
      nas_tipo: tipo,
      tis_id: tipo === 'I' ? conceptoId : null,
      tds_id: tipo === 'D' ? conceptoId : null,
    });

    return monto >= 0 ? monto.toFixed(2) : '';
  };

  const sincronizarMontosConceptos = (
    ingresosIds: string[],
    descuentosIds: string[],
    empleadoId = empleadosSeleccionados[0] || form.emp_id
  ) => {
    setMontosConceptos((prev) => {
      const next: Record<string, string> = {};

      ingresosIds.forEach((ingresoId) => {
        const key = obtenerClaveConcepto('I', ingresoId);
        next[key] = prev[key] ?? obtenerMontoInicialConcepto('I', ingresoId, empleadoId);
      });

      descuentosIds.forEach((descuentoId) => {
        const key = obtenerClaveConcepto('D', descuentoId);
        next[key] = prev[key] ?? obtenerMontoInicialConcepto('D', descuentoId, empleadoId);
      });

      return next;
    });
  };

  const handleMontoConceptoChange = (key: string, value: string) => {
    setMontosConceptos((prev) => ({ ...prev, [key]: value }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name as string]: value };
      if (name === 'emp_id' || name === 'tis_id' || name === 'tds_id') {
        return completarMontoSiAplica(next);
      }
      return next;
    });
  };

  const handleEmpleadosChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const seleccionados = typeof value === 'string' ? value.split(',') : value;
    setEmpleadosSeleccionados(seleccionados);
    sincronizarMontosConceptos(ingresosSeleccionados, descuentosSeleccionados, seleccionados[0] || '');
    setForm((prev) => completarMontoSiAplica({
      ...prev,
      emp_id: seleccionados[0] || '',
    }));
  };

  const handleIngresosChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const seleccionados = typeof value === 'string' ? value.split(',') : value;
    setIngresosSeleccionados(seleccionados);
    sincronizarMontosConceptos(seleccionados, descuentosSeleccionados);
    setForm((prev) => completarMontoSiAplica({
      ...prev,
      nas_tipo: seleccionados.length > 0 ? 'I' : descuentosSeleccionados.length > 0 ? 'D' : '',
      tis_id: seleccionados[0] || null,
      tds_id: seleccionados.length > 0 ? null : descuentosSeleccionados[0] || null,
    }));
  };

  const handleDescuentosChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const seleccionados = typeof value === 'string' ? value.split(',') : value;
    setDescuentosSeleccionados(seleccionados);
    sincronizarMontosConceptos(ingresosSeleccionados, seleccionados);
    setForm((prev) => completarMontoSiAplica({
      ...prev,
      nas_tipo: ingresosSeleccionados.length > 0 ? 'I' : seleccionados.length > 0 ? 'D' : '',
      tis_id: ingresosSeleccionados[0] || null,
      tds_id: ingresosSeleccionados.length > 0 ? null : seleccionados[0] || null,
    }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setEmpleadosSeleccionados([]);
    setIngresosSeleccionados([]);
    setDescuentosSeleccionados([]);
    setMontosConceptos({});
    setEditandoId(null);
    setError('');
  };

  const validar = () => {
    const totalConceptos = ingresosSeleccionados.length + descuentosSeleccionados.length;
    if (!form.per_id || empleadosSeleccionados.length === 0 || totalConceptos === 0) {
      setError('Periodo, empleado y al menos un ingreso o descuento son obligatorios.');
      return false;
    }
    if (editandoId !== null && totalConceptos !== 1) {
      setError('Para editar una asignacion selecciona un unico ingreso o descuento.');
      return false;
    }
    const montoInvalido = [
      ...ingresosSeleccionados.map((id) => montosConceptos[obtenerClaveConcepto('I', id)]),
      ...descuentosSeleccionados.map((id) => montosConceptos[obtenerClaveConcepto('D', id)]),
    ].some((monto) => monto === '' || monto === undefined || Number(monto) < 0);

    if (montoInvalido) {
      setError('Cada ingreso o descuento seleccionado debe tener un monto valido.');
      return false;
    }
    return true;
  };

  const crearPayloadAsignacion = (
    empleadoId: string,
    tipo: 'I' | 'D',
    conceptoId: string
  ): NominaAsignacionForm => {
    const base: NominaAsignacionForm = {
      ...form,
      emp_id: empleadoId,
      nas_tipo: tipo,
      tis_id: tipo === 'I' ? conceptoId : null,
      tds_id: tipo === 'D' ? conceptoId : null,
    };
    return {
      ...base,
      nas_monto: montosConceptos[obtenerClaveConcepto(tipo, conceptoId)],
    };
  };

  const obtenerPayloadsAsignaciones = () =>
    empleadosSeleccionados.flatMap((empleadoId) => [
      ...ingresosSeleccionados.map((ingresoId) => crearPayloadAsignacion(empleadoId, 'I', ingresoId)),
      ...descuentosSeleccionados.map((descuentoId) => crearPayloadAsignacion(empleadoId, 'D', descuentoId)),
    ]);

  const obtenerAsignacionExistente = (payload: NominaAsignacionForm) =>
    asignaciones.find((asignacion) => {
      if (String(asignacion.PER_ID) !== String(payload.per_id)) return false;
      if (String(asignacion.EMP_ID) !== String(payload.emp_id)) return false;
      if (payload.nas_tipo === 'I') {
        return String(asignacion.TIS_ID ?? '') === String(payload.tis_id ?? '');
      }
      if (payload.nas_tipo === 'D') {
        return String(asignacion.TDS_ID ?? '') === String(payload.tds_id ?? '');
      }
      return false;
    });

  const guardar = async () => {
    try {
      setError('');
      setMensaje('');
      if (periodoFormBloqueado) {
        setError('No se pueden guardar asignaciones en periodos aprobados o cerrados.');
        return false;
      }
      if (!validar()) return false;

      const payloads = obtenerPayloadsAsignaciones();
      if (editandoId !== null) {
        await actualizarNominaAsignacion(editandoId, payloads[0]);
        setMensaje('Asignacion actualizada correctamente.');
      } else {
        let creadas = 0;
        let actualizadas = 0;

        await Promise.all(payloads.map(async (payload) => {
          const existente = obtenerAsignacionExistente(payload);
          if (existente) {
            actualizadas += 1;
            await actualizarNominaAsignacion(existente.NAS_ID, payload);
            return;
          }

          creadas += 1;
          await crearNominaAsignacion(payload);
        }));

        setMensaje(payloads.length === 1
          ? (actualizadas ? 'Asignacion actualizada correctamente.' : 'Asignacion creada correctamente.')
          : `${creadas} asignaciones creadas y ${actualizadas} actualizadas correctamente.`);
      }

      limpiarFormulario();
      await cargarDatos();
      return true;
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error guardando asignacion.'));
      return false;
    }
  };

  const formConSeleccion = useMemo(
    () => ({ ...form, emp_ids: empleadosSeleccionados, tis_ids: ingresosSeleccionados, tds_ids: descuentosSeleccionados, montos: montosConceptos }),
    [form, empleadosSeleccionados, ingresosSeleccionados, descuentosSeleccionados, montosConceptos]
  );

  const initialFormConSeleccion = useMemo(
    () => ({ ...initialForm, emp_ids: [] as string[], tis_ids: [] as string[], tds_ids: [] as string[], montos: {} as Record<string, string> }),
    []
  );

  useUnsavedFormGuard(formConSeleccion, initialFormConSeleccion, guardar);

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
    setEmpleadosSeleccionados([String(asignacion.EMP_ID)]);
    setIngresosSeleccionados(asignacion.TIS_ID ? [String(asignacion.TIS_ID)] : []);
    setDescuentosSeleccionados(asignacion.TDS_ID ? [String(asignacion.TDS_ID)] : []);
    setMontosConceptos({
      [obtenerClaveConcepto(asignacion.NAS_TIPO, asignacion.TIS_ID ?? asignacion.TDS_ID ?? '')]: String(asignacion.NAS_MONTO ?? ''),
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

  const conceptoPreviewForm: NominaAsignacionForm = ingresosSeleccionados.length > 0
    ? { ...form, nas_tipo: 'I', tis_id: ingresosSeleccionados[0], tds_id: null }
    : descuentosSeleccionados.length > 0
      ? { ...form, nas_tipo: 'D', tis_id: null, tds_id: descuentosSeleccionados[0] }
      : form;
  const montoSugeridoActual = obtenerMontoSugerido(conceptoPreviewForm);
  const conceptoConMontoSugerido = Boolean(conceptoPreviewForm.nas_tipo && (conceptoPreviewForm.tis_id || conceptoPreviewForm.tds_id));
  const conceptoSalarioSeleccionado = conceptoPreviewForm.nas_tipo === 'I' && esConceptoSalario(conceptoPreviewForm.tis_id);

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <AssignmentIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Asignaciones de Ingresos y Descuentos por Empleado
          </Typography>
          {periodoForm && (
            <Box sx={{ ml: 'auto' }}>
              <PeriodoBadge estado={periodoForm.PER_ESTADO} />
            </Box>
          )}
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Aqui se asignan ingresos y descuentos a un empleado especifico antes de generar la nomina. La generacion toma estas asignaciones y las refleja en el detalle final.
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
                : 'El valor base configurado para este concepto es Q0.00. Puedes ajustarlo manualmente si aplica.'}
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <LookupSelect
              required
              label="Periodo"
              value={String(form.per_id)}
              placeholder="Buscar periodo"
              options={periodos.map((periodo) => ({
                value: String(periodo.PER_ID),
                label: obtenerPeriodo(periodo.PER_ID),
                description: `Estado ${periodo.PER_ESTADO}`,
              }))}
              onChange={(value) => setForm((prev) => ({ ...prev, per_id: value }))}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth required>
              <InputLabel>Empleado</InputLabel>
              <Select
                multiple
                label="Empleado"
                value={empleadosSeleccionados}
                onChange={handleEmpleadosChange}
                renderValue={(selected) => {
                  if (selected.length === 0) return 'Buscar empleado';
                  if (selected.length === 1) {
                    const empleado = empleadosPorId.get(String(selected[0]));
                    return obtenerNombreEmpleado(empleado) || `Empleado #${selected[0]}`;
                  }
                  return `${selected.length} empleados seleccionados`;
                }}
                MenuProps={{ slotProps: { paper: { sx: { maxHeight: 360 } } } }}
              >
                {empleadosAsignables.length > 0 ? empleadosAsignables.map((empleado) => {
                  const empleadoId = String(empleado.EMP_ID);
                  const nombre = obtenerNombreEmpleado(empleado) || `Empleado #${empleado.EMP_ID}`;
                  const estadoNoActivo = empleado.EMP_FECHA_LIQUIDACION || String(empleado.EMP_ESTADO || 'A').toUpperCase() !== 'A';
                  return (
                    <MenuItem key={empleado.EMP_ID} value={empleadoId}>
                      <Checkbox checked={empleadosSeleccionados.includes(empleadoId)} />
                      <ListItemText
                        primary={nombre}
                        secondary={estadoNoActivo ? `ID ${empleado.EMP_ID} - liquidado` : `ID ${empleado.EMP_ID}`}
                      />
                    </MenuItem>
                  );
                }) : (
                  <MenuItem disabled value="">
                    <ListItemText primary="No hay empleados disponibles" />
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth required>
              <InputLabel>Tipo de Ingreso</InputLabel>
              <Select
                multiple
                label="Tipo de Ingreso"
                value={ingresosSeleccionados}
                onChange={handleIngresosChange}
                renderValue={(selected) => {
                  if (selected.length === 0) return 'Seleccione ingreso';
                  if (selected.length === 1) {
                    const ingreso = ingresosPorId.get(String(selected[0]));
                    return ingreso ? `${ingreso.TIS_CODIGO} - ${ingreso.TIS_NOMBRE}` : `Ingreso #${selected[0]}`;
                  }
                  return `${selected.length} ingresos seleccionados`;
                }}
                MenuProps={{ slotProps: { paper: { sx: { maxHeight: 360 } } } }}
              >
                {ingresos.length > 0 ? ingresos.map((ingreso) => {
                  const ingresoId = String(ingreso.TIS_ID);
                  return (
                    <MenuItem key={ingreso.TIS_ID} value={ingresoId}>
                      <Checkbox checked={ingresosSeleccionados.includes(ingresoId)} />
                      <ListItemText primary={`${ingreso.TIS_CODIGO} - ${ingreso.TIS_NOMBRE}`} />
                    </MenuItem>
                  );
                }) : (
                  <MenuItem disabled value="">
                    <ListItemText primary="No hay ingresos disponibles" />
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth required>
              <InputLabel>Tipo de Descuento</InputLabel>
              <Select
                multiple
                label="Tipo de Descuento"
                value={descuentosSeleccionados}
                onChange={handleDescuentosChange}
                renderValue={(selected) => {
                  if (selected.length === 0) return 'Seleccione descuento';
                  if (selected.length === 1) {
                    const descuento = descuentosPorId.get(String(selected[0]));
                    return descuento ? `${descuento.TDS_CODIGO} - ${descuento.TDS_NOMBRE}` : `Descuento #${selected[0]}`;
                  }
                  return `${selected.length} descuentos seleccionados`;
                }}
                MenuProps={{ slotProps: { paper: { sx: { maxHeight: 360 } } } }}
              >
                {descuentos.length > 0 ? descuentos.map((descuento) => {
                  const descuentoId = String(descuento.TDS_ID);
                  return (
                    <MenuItem key={descuento.TDS_ID} value={descuentoId}>
                      <Checkbox checked={descuentosSeleccionados.includes(descuentoId)} />
                      <ListItemText primary={`${descuento.TDS_CODIGO} - ${descuento.TDS_NOMBRE}`} />
                    </MenuItem>
                  );
                }) : (
                  <MenuItem disabled value="">
                    <ListItemText primary="No hay descuentos disponibles" />
                  </MenuItem>
                )}
              </Select>
            </FormControl>
          </Grid>

          {(ingresosSeleccionados.length > 0 || descuentosSeleccionados.length > 0) && (
            <Grid size={{ xs: 12 }}>
              <Grid container spacing={2}>
                {ingresosSeleccionados.map((ingresoId) => {
                  const ingreso = ingresosPorId.get(String(ingresoId));
                  const key = obtenerClaveConcepto('I', ingresoId);
                  return (
                    <Grid key={key} size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        label={`Monto ingreso: ${ingreso?.TIS_NOMBRE ?? ingresoId}`}
                        type="number"
                        value={montosConceptos[key] ?? ''}
                        onChange={(event) => handleMontoConceptoChange(key, event.target.value)}
                        slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
                      />
                    </Grid>
                  );
                })}

                {descuentosSeleccionados.map((descuentoId) => {
                  const descuento = descuentosPorId.get(String(descuentoId));
                  const key = obtenerClaveConcepto('D', descuentoId);
                  return (
                    <Grid key={key} size={{ xs: 12, md: 4 }}>
                      <TextField
                        fullWidth
                        required
                        label={`Monto descuento: ${descuento?.TDS_NOMBRE ?? descuentoId}`}
                        type="number"
                        value={montosConceptos[key] ?? ''}
                        onChange={(event) => handleMontoConceptoChange(key, event.target.value)}
                        slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
                      />
                    </Grid>
                  );
                })}
              </Grid>
            </Grid>
          )}

          {(ingresosSeleccionados.length > 0 || descuentosSeleccionados.length > 0) && (
            <Grid size={{ xs: 12 }}>
              <Grid container spacing={2}>
                {ingresosSeleccionados.length > 0 && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Ingreso seleccionado</strong></TableCell>
                            <TableCell align="right"><strong>Monto</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {ingresosSeleccionados.map((ingresoId) => {
                            const ingreso = ingresosPorId.get(String(ingresoId));
                            const key = obtenerClaveConcepto('I', ingresoId);
                            return (
                              <TableRow key={key}>
                                <TableCell>{ingreso ? `${ingreso.TIS_CODIGO} - ${ingreso.TIS_NOMBRE}` : `Ingreso #${ingresoId}`}</TableCell>
                                <TableCell align="right">{formatearMoneda(Number(montosConceptos[key] || 0))}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}

                {descuentosSeleccionados.length > 0 && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>Descuento seleccionado</strong></TableCell>
                            <TableCell align="right"><strong>Monto</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {descuentosSeleccionados.map((descuentoId) => {
                            const descuento = descuentosPorId.get(String(descuentoId));
                            const key = obtenerClaveConcepto('D', descuentoId);
                            return (
                              <TableRow key={key}>
                                <TableCell>{descuento ? `${descuento.TDS_CODIGO} - ${descuento.TDS_NOMBRE}` : `Descuento #${descuentoId}`}</TableCell>
                                <TableCell align="right">{formatearMoneda(Number(montosConceptos[key] || 0))}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                )}
              </Grid>
            </Grid>
          )}

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
          <Typography variant="h6">Asignaciones por empleado: {asignacionesFiltradas.length}</Typography>
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
                          label={asignacion.NAS_TIPO === 'I' ? 'Ingreso' : 'Descuento'}
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
