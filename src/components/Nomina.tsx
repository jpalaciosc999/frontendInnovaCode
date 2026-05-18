import { Fragment, useEffect, useMemo, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
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
  TableFooter,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CalculateIcon from '@mui/icons-material/Calculate';
import DownloadIcon from '@mui/icons-material/Download';
import SummarizeIcon from '@mui/icons-material/Summarize';
import DeleteIcon from '@mui/icons-material/Delete';

import type { Nomina, NominaForm } from '../interfaces/nomina';
import type { NominaDetalle } from '../interfaces/nomina-detalle';
import type { Empleado } from '../interfaces/empleados';
import type { Periodo } from '../interfaces/periodo';
import type { Puesto } from '../interfaces/puestos';
import type { Departamento } from '../interfaces/departamentos';
import type { Ingreso } from '../interfaces/tipoIngresos';
import type { Descuento } from '../interfaces/descuentos';
import {
  obtenerNominas,
  actualizarNomina,
  eliminarNomina,
  generarNominas
} from '../services/nomina.service';
import { obtenerDetallesNomina } from '../services/nomina-detalle.service';
import { obtenerEmpleados } from '../services/empleados.service';
import { actualizarEstadoPeriodo, obtenerPeriodos } from '../services/periodo.service';
import { obtenerPuestos } from '../services/puestos.service';
import { obtenerDepartamentos } from '../services/departamentos.service';
import { obtenerIngresos } from '../services/tipoIngresos.service';
import { obtenerDescuentos } from '../services/descuentos.service';
import { getApiErrorMessage } from '../api/errors';
import { formatearFecha, formatearMoneda, obtenerNombreEmpleado } from '../utils/relations';
import {
  esPeriodoAbierto,
  esPeriodoAprobado,
  normalizePeriodoEstado,
  periodoEstadoLabels,
} from '../utils/payroll';
import PeriodoBadge from './common/PeriodoBadge';

type TotalesNomina = {
  ingresos: number;
  descuentos: number;
  liquido: number;
  cantidad: number;
};

type GeneracionNominaForm = {
  per_id: string;
  fecha_generacion: string;
  empleado_id: string;
};

type FilaPlanilla = {
  nomina: Nomina;
  empleadoId: number;
  colaborador: string;
  departamento: string;
  puesto: string;
  salarioBase: number;
  bonificacion: number;
  diasLaborados: number;
  salarioOrdinario: number;
  horasExtra: number;
  sueldoExtraordinario: number;
  comisiones: number;
  otrosIngresos: number;
  totalIngresos: number;
  anticipo: number;
  igss: number;
  isr: number;
  prestamo: number;
  descuentosJudiciales: number;
  otrosEgresos: number;
  totalEgresos: number;
  liquido: number;
  conceptos: number;
  duplicados: number;
  cuadra: boolean;
};

const totalesVacios: TotalesNomina = {
  ingresos: 0,
  descuentos: 0,
  liquido: 0,
  cantidad: 0,
};

const toInputDate = (value: string | null | undefined) => {
  if (!value) return '';

  const raw = String(value);
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const oracleMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (oracleMatch) return `${oracleMatch[3]}-${oracleMatch[2]}-${oracleMatch[1]}`;

  return raw.slice(0, 10);
};

const obtenerFechaLocalInput = () => {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

const fechaEnPeriodo = (fecha: string | undefined, periodo?: Periodo) => {
  if (!fecha || !periodo?.PER_FECHA_INICIO || !periodo?.PER_FECHA_FIN) return false;

  const salida = toInputDate(fecha);
  const inicio = toInputDate(periodo.PER_FECHA_INICIO);
  const fin = toInputDate(periodo.PER_FECHA_FIN);
  return salida >= inicio && salida <= fin;
};

const initialGeneracionForm: GeneracionNominaForm = {
  per_id: '',
  fecha_generacion: obtenerFechaLocalInput(),
  empleado_id: '',
};

const contarRespuesta = (data: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = data[key];
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'number') return value;
  }
  return undefined;
};

const redondearMoneda = (value: number) => Math.round(value * 100) / 100;

const obtenerClaveConcepto = (detalle: NominaDetalle) => {
  if (detalle.TIS_ID) return `I-${detalle.TIS_ID}`;
  if (detalle.TDS_ID) return `D-${detalle.TDS_ID}`;
  if (detalle.KRE_ID) return `K-${detalle.KRE_ID}`;
  return '';
};

const sumar = <T,>(items: T[], selector: (item: T) => number) =>
  items.reduce((total, item) => total + selector(item), 0);

const normalizarCodigo = (value?: string | null) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

const esCodigo = (codigo: string, tokens: string[]) =>
  tokens.some((token) => codigo.includes(token));

function NominaCRUD() {
  const [datos, setDatos] = useState<Nomina[]>([]);
  const [detalles, setDetalles] = useState<NominaDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [generacionForm, setGeneracionForm] = useState<GeneracionNominaForm>(initialGeneracionForm);
  const [generando, setGenerando] = useState(false);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [planillaPeriodoId, setPlanillaPeriodoId] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const [
        nominasData,
        detallesData,
        empleadosData,
        periodosData,
        puestosData,
        departamentosData,
        ingresosData,
        descuentosData,
      ] = await Promise.all([
        obtenerNominas(),
        obtenerDetallesNomina(),
        obtenerEmpleados(),
        obtenerPeriodos(),
        obtenerPuestos(),
        obtenerDepartamentos(),
        obtenerIngresos(),
        obtenerDescuentos(),
      ]);
      setDatos(nominasData);
      setDetalles(detallesData);
      setEmpleados(empleadosData);
      setPeriodos(periodosData);
      setPuestos(puestosData);
      setDepartamentos(departamentosData);
      setIngresos(ingresosData);
      setDescuentos(descuentosData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error cargando datos de nomina'));
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

  const puestosPorId = useMemo(
    () => new Map(puestos.map((puesto) => [String(puesto.PUE_ID), puesto])),
    [puestos]
  );

  const departamentosPorId = useMemo(
    () => new Map(departamentos.map((departamento) => [String(departamento.DEP_ID), departamento])),
    [departamentos]
  );

  const periodosPorId = useMemo(
    () => new Map(periodos.map((periodo) => [String(periodo.PER_ID), periodo])),
    [periodos]
  );

  const periodosAbiertos = useMemo(
    () => periodos.filter((periodo) => esPeriodoAbierto(periodo.PER_ESTADO)),
    [periodos]
  );

  const periodoGeneracion = periodosPorId.get(String(generacionForm.per_id));
  const periodoPlanilla = periodosPorId.get(String(planillaPeriodoId));
  const periodoPlanillaAbierto = esPeriodoAbierto(periodoPlanilla?.PER_ESTADO);
  const periodoPlanillaAprobado = esPeriodoAprobado(periodoPlanilla?.PER_ESTADO);
  const periodoGeneracionBloqueado = ['APROBADO', 'CERRADO'].includes(normalizePeriodoEstado(periodoGeneracion?.PER_ESTADO || ''));
  const periodoPlanillaLectura = ['APROBADO', 'CERRADO'].includes(normalizePeriodoEstado(periodoPlanilla?.PER_ESTADO || ''));
  const periodoActivo = periodoPlanilla || periodoGeneracion;

  const empleadosGenerables = useMemo(() => {
    const periodo = periodosPorId.get(String(generacionForm.per_id));
    return empleados.filter((empleado) => {
      const estado = String(empleado.EMP_ESTADO || 'A').toUpperCase();
      const estaLiquidado = Boolean(empleado.EMP_FECHA_LIQUIDACION) || estado === 'L';
      if (!estaLiquidado && estado === 'A') return true;
      return fechaEnPeriodo(empleado.EMP_FECHA_LIQUIDACION, periodo);
    });
  }, [empleados, periodosPorId, generacionForm.per_id]);

  useEffect(() => {
    if (!generacionForm.empleado_id) return;
    const empleadoDisponible = empleadosGenerables.some((empleado) => {
      return String(empleado.EMP_ID) === String(generacionForm.empleado_id);
    });
    if (!empleadoDisponible) {
      setGeneracionForm((prev) => ({ ...prev, empleado_id: '' }));
    }
  }, [empleadosGenerables, generacionForm.empleado_id]);

  const ingresosPorId = useMemo(
    () => new Map(ingresos.map((ingreso) => [String(ingreso.TIS_ID), ingreso])),
    [ingresos]
  );

  const descuentosPorId = useMemo(
    () => new Map(descuentos.map((descuento) => [String(descuento.TDS_ID), descuento])),
    [descuentos]
  );

  const duplicadosPorNomina = useMemo(() => {
    const agrupados = new Map<string, Set<string>>();
    const duplicados = new Map<string, number>();

    detalles.forEach((detalle) => {
      const key = String(detalle.NOM_ID);
      const concepto = obtenerClaveConcepto(detalle);
      if (!concepto) return;

      const conceptos = agrupados.get(key) ?? new Set<string>();
      if (conceptos.has(concepto)) {
        duplicados.set(key, (duplicados.get(key) ?? 0) + 1);
      }
      conceptos.add(concepto);
      agrupados.set(key, conceptos);
    });

    return duplicados;
  }, [detalles]);

  const obtenerDuplicadosNomina = (nominaId: number) => duplicadosPorNomina.get(String(nominaId)) ?? 0;

  const construirFilaPlanilla = (nomina: Nomina): FilaPlanilla => {
    const empleado = empleadosPorId.get(String(nomina.EMP_ID));
    const puesto = empleado?.PUE_ID ? puestosPorId.get(String(empleado.PUE_ID)) : undefined;
    const departamentoId = empleado?.DEP_ID ?? puesto?.DEP_ID;
    const departamento = departamentoId ? departamentosPorId.get(String(departamentoId)) : undefined;
    const detallesNomina = detalles.filter((detalle) => String(detalle.NOM_ID) === String(nomina.NOM_ID));
    const ingresosDetalle = detallesNomina.filter((detalle) => !detalle.TDS_ID);
    const descuentosDetalle = detallesNomina.filter((detalle) => detalle.TDS_ID);
    const ingresoPorCodigo = (tokens: string[]) =>
      sumar(ingresosDetalle, (detalle) => {
        const ingreso = detalle.TIS_ID ? ingresosPorId.get(String(detalle.TIS_ID)) : undefined;
        const codigo = ingreso ? normalizarCodigo(`${ingreso.TIS_CODIGO} ${ingreso.TIS_NOMBRE}`) : '';
        return ingreso && esCodigo(codigo, tokens) ? Number(detalle.DET_MONTO || 0) : 0;
      });
    const descuentoPorCodigo = (tokens: string[]) =>
      sumar(descuentosDetalle, (detalle) => {
        const descuento = descuentosPorId.get(String(detalle.TDS_ID));
        const codigo = descuento ? normalizarCodigo(`${descuento.TDS_CODIGO} ${descuento.TDS_NOMBRE}`) : '';
        return descuento && esCodigo(codigo, tokens) ? Number(detalle.DET_MONTO || 0) : 0;
      });
    const horasExtra = sumar(ingresosDetalle, (detalle) => {
      const ingreso = detalle.TIS_ID ? ingresosPorId.get(String(detalle.TIS_ID)) : undefined;
      const codigo = ingreso ? normalizarCodigo(`${ingreso.TIS_CODIGO} ${ingreso.TIS_NOMBRE}`) : '';
      return ingreso && esCodigo(codigo, ['EXTRA']) ? Number(detalle.DET_REFERENCIA || 0) : 0;
    });
    const salarioOrdinario = ingresoPorCodigo(['SALARIO', 'SUELDO']);
    const bonificacion = ingresoPorCodigo(['BONIF', 'BONIFICACION', 'DECRETO', 'INCENTIVO']);
    const sueldoExtraordinario = ingresoPorCodigo(['EXTRA']);
    const comisiones = ingresoPorCodigo(['COMISION', 'KPI']) + sumar(ingresosDetalle, (detalle) =>
      detalle.KRE_ID && !detalle.TIS_ID ? Number(detalle.DET_MONTO || 0) : 0
    );
    const ingresosClasificados = salarioOrdinario + bonificacion + sueldoExtraordinario + comisiones;
    const totalIngresos = sumar(ingresosDetalle, (detalle) => Number(detalle.DET_MONTO || 0));
    const anticipo = descuentoPorCodigo(['ANTICIPO']);
    const igss = descuentoPorCodigo(['IGSS']);
    const isr = descuentoPorCodigo(['ISR']);
    const prestamo = descuentoPorCodigo(['PRESTAMO']);
    const descuentosJudiciales = descuentoPorCodigo(['JUD', 'EMBARGO', 'PENSION']);
    const egresosClasificados = anticipo + igss + isr + prestamo + descuentosJudiciales;
    const totalEgresos = sumar(descuentosDetalle, (detalle) => Number(detalle.DET_MONTO || 0));
    const liquido = totalIngresos - totalEgresos;
    const duplicados = obtenerDuplicadosNomina(nomina.NOM_ID);
    const cuadra = Math.abs(Number(nomina.NOM_TOTAL_INGRESOS || 0) - totalIngresos) < 0.01
      && Math.abs(Number(nomina.NOM_TOTAL_DESCUENTO || 0) - totalEgresos) < 0.01
      && Math.abs(Number(nomina.NOM_SALARIO_LIQUIDO || 0) - liquido) < 0.01;

    return {
      nomina,
      empleadoId: nomina.EMP_ID,
      colaborador: obtenerNombreEmpleado(empleado) || `Empleado #${nomina.EMP_ID}`,
      departamento: departamento?.DEP_NOMBRE || 'Sin departamento',
      puesto: puesto?.PUE_NOMBRE || 'Sin puesto',
      salarioBase: Number(empleado?.EMP_SUELDO || puesto?.PUE_SALARIO_BASE || 0),
      bonificacion,
      diasLaborados: 0,
      salarioOrdinario,
      horasExtra,
      sueldoExtraordinario,
      comisiones,
      otrosIngresos: Math.max(0, totalIngresos - ingresosClasificados),
      totalIngresos,
      anticipo,
      igss,
      isr,
      prestamo,
      descuentosJudiciales,
      otrosEgresos: Math.max(0, totalEgresos - egresosClasificados),
      totalEgresos,
      liquido,
      conceptos: detallesNomina.length,
      duplicados,
      cuadra,
    };
  };

  const filasPlanilla = useMemo(
    () => datos
      .filter((nomina) => planillaPeriodoId && String(nomina.PER_ID) === String(planillaPeriodoId))
      .map(construirFilaPlanilla),
    [datos, detalles, empleadosPorId, puestosPorId, departamentosPorId, ingresosPorId, descuentosPorId, planillaPeriodoId, duplicadosPorNomina]
  );

  const planillaPorDepartamento = useMemo(() => {
    const grupos = new Map<string, FilaPlanilla[]>();
    filasPlanilla.forEach((fila) => {
      const actuales = grupos.get(fila.departamento) ?? [];
      actuales.push(fila);
      grupos.set(fila.departamento, actuales);
    });
    return Array.from(grupos.entries());
  }, [filasPlanilla]);

  const totalesPlanilla = useMemo(() => ({
    salarioBase: sumar(filasPlanilla, (fila) => fila.salarioBase),
    bonificacion: sumar(filasPlanilla, (fila) => fila.bonificacion),
    salarioOrdinario: sumar(filasPlanilla, (fila) => fila.salarioOrdinario),
    horasExtra: sumar(filasPlanilla, (fila) => fila.horasExtra),
    sueldoExtraordinario: sumar(filasPlanilla, (fila) => fila.sueldoExtraordinario),
    comisiones: sumar(filasPlanilla, (fila) => fila.comisiones),
    otrosIngresos: sumar(filasPlanilla, (fila) => fila.otrosIngresos),
    totalIngresos: sumar(filasPlanilla, (fila) => fila.totalIngresos),
    anticipo: sumar(filasPlanilla, (fila) => fila.anticipo),
    igss: sumar(filasPlanilla, (fila) => fila.igss),
    isr: sumar(filasPlanilla, (fila) => fila.isr),
    prestamo: sumar(filasPlanilla, (fila) => fila.prestamo),
    descuentosJudiciales: sumar(filasPlanilla, (fila) => fila.descuentosJudiciales),
    otrosEgresos: sumar(filasPlanilla, (fila) => fila.otrosEgresos),
    totalEgresos: sumar(filasPlanilla, (fila) => fila.totalEgresos),
    liquido: sumar(filasPlanilla, (fila) => fila.liquido),
  }), [filasPlanilla]);

  const planillaTieneInconsistencias = filasPlanilla.some((fila) => fila.conceptos === 0 || fila.duplicados > 0 || !fila.cuadra);
  const planillaPuedeEnviar = filasPlanilla.length > 0
    && periodoPlanillaAbierto
    && !planillaTieneInconsistencias
    && filasPlanilla.some((fila) => ['B', 'R'].includes(fila.nomina.NOM_ESTADO));
  const planillaPuedeExportar = filasPlanilla.length > 0
    && periodoPlanillaAprobado
    && !planillaTieneInconsistencias
    && filasPlanilla.every((fila) => fila.nomina.NOM_ESTADO === 'A');
  const nominasEliminables = filasPlanilla.filter((fila) => ['B', 'R'].includes(fila.nomina.NOM_ESTADO));
  const planillaPuedeEliminar = periodoPlanillaAbierto && nominasEliminables.length > 0;

  const obtenerEtiquetaPeriodo = (periodo?: Periodo) =>
    periodo
      ? `${formatearFecha(periodo.PER_FECHA_INICIO)} al ${formatearFecha(periodo.PER_FECHA_FIN)}`
      : '';

  const obtenerEtiquetaPeriodoConEstado = (periodo: Periodo) => {
    const estado = normalizePeriodoEstado(periodo.PER_ESTADO);
    const etiquetaEstado = estado ? periodoEstadoLabels[estado] : periodo.PER_ESTADO;
    return `${obtenerEtiquetaPeriodo(periodo)} - ${etiquetaEstado}`;
  };

  const crearPayloadNomina = (
    datosForm: NominaForm,
    totales: TotalesNomina = totalesVacios,
    estado = datosForm.nom_estado
  ): NominaForm => ({
    nom_total_ingresos: redondearMoneda(totales.ingresos),
    nom_total_descuento: redondearMoneda(totales.descuentos),
    nom_salario_liquido: redondearMoneda(totales.liquido),
    nom_fecha_generacion: datosForm.nom_fecha_generacion,
    per_id: datosForm.per_id,
    empleado_id: datosForm.empleado_id,
    liq_id: datosForm.liq_id || null,
    nom_estado: estado,
  });

  const handleGeneracionChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setGeneracionForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const generarNominaPeriodo = async (recalcular = false) => {
    if (!generacionForm.per_id || !generacionForm.fecha_generacion) {
      setError('Periodo y fecha de generacion son obligatorios para generar nomina');
      return;
    }
    if (!esPeriodoAbierto(periodoGeneracion?.PER_ESTADO)) {
      setError('Solo puedes generar o recalcular nomina en periodos abiertos.');
      return;
    }

    try {
      setGenerando(true);
      setError('');
      setMensaje('');

      const respuesta = await generarNominas({
        per_id: Number(generacionForm.per_id),
        fecha_generacion: generacionForm.fecha_generacion,
        estado: 'B',
        emp_ids: generacionForm.empleado_id ? [Number(generacionForm.empleado_id)] : undefined,
        recalcular,
      });

      const respuestaPlano = respuesta as Record<string, unknown>;
      const generadas = respuesta.resumen?.generadas ?? contarRespuesta(respuestaPlano, [
        'generadas',
        'creadas',
        'nominas_generadas',
        'nominasCreadas',
      ]);
      const omitidas = respuesta.resumen?.omitidas ?? contarRespuesta(respuestaPlano, [
        'omitidas',
        'duplicadas',
        'nominas_omitidas',
        'nominasOmitidas',
      ]);
      const errores = respuesta.resumen?.errores ?? contarRespuesta(respuestaPlano, ['errores']);
      const partes = [
        generadas !== undefined ? `${generadas} generadas` : '',
        omitidas !== undefined ? `${omitidas} omitidas` : '',
        errores !== undefined ? `${errores} con error` : '',
      ].filter(Boolean);

      setMensaje(respuesta.mensaje || respuesta.message || `${recalcular ? 'Recalculo' : 'Generacion'} finalizada${partes.length ? `: ${partes.join(', ')}` : ''}`);
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error generando nomina del periodo'));
    } finally {
      setGenerando(false);
    }
  };

  const enviarPlanillaAGerente = async () => {
    try {
      setError('');
      setMensaje('');

      if (!planillaPeriodoId) {
        setError('Selecciona un periodo para enviar la planilla.');
        return;
      }
      if (planillaTieneInconsistencias) {
        setError('La planilla tiene inconsistencias. Corrige duplicados o recalcula antes de enviarla.');
        return;
      }
      if (!periodoPlanilla || !periodoPlanillaAbierto) {
        setError('Solo puedes enviar a revision una planilla de un periodo abierto.');
        return;
      }

      const enviables = filasPlanilla.filter((fila) => ['B', 'R'].includes(fila.nomina.NOM_ESTADO));
      if (enviables.length === 0) {
        setMensaje('No hay nominas en borrador o rechazadas para enviar.');
        return;
      }

      await Promise.all(enviables.map((fila) => actualizarNomina(fila.nomina.NOM_ID, crearPayloadNomina({
        nom_total_ingresos: fila.nomina.NOM_TOTAL_INGRESOS,
        nom_total_descuento: fila.nomina.NOM_TOTAL_DESCUENTO,
        nom_salario_liquido: fila.nomina.NOM_SALARIO_LIQUIDO,
        nom_fecha_generacion: toInputDate(fila.nomina.NOM_FECHA_GENERACION),
        per_id: fila.nomina.PER_ID,
        empleado_id: fila.nomina.EMP_ID,
        liq_id: fila.nomina.LIQ_ID ?? null,
        nom_estado: fila.nomina.NOM_ESTADO,
      }, {
        ingresos: fila.totalIngresos,
        descuentos: fila.totalEgresos,
        liquido: fila.liquido,
        cantidad: fila.conceptos,
      }, 'P'))));

      await actualizarEstadoPeriodo(periodoPlanilla, 'EN_REVISION');
      setMensaje('Planilla enviada al gerente. Queda pendiente de aprobacion.');
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error enviando planilla a gerente'));
    }
  };

  const eliminarPlanillaActual = async () => {
    try {
      setError('');
      setMensaje('');

      if (!planillaPeriodoId) {
        setError('Selecciona el periodo de la planilla que quieres eliminar.');
        return;
      }

      if (!planillaPuedeEliminar) {
        setError('Solo se pueden eliminar nominas en Borrador o Rechazadas de un periodo abierto.');
        return;
      }

      const total = nominasEliminables.length;
      if (!window.confirm(`Se eliminaran ${total} nomina(s) en borrador/rechazadas de este periodo, incluyendo su detalle. Deseas continuar?`)) {
        return;
      }

      await Promise.all(nominasEliminables.map((fila) => eliminarNomina(fila.nomina.NOM_ID)));
      setMensaje(`Planilla eliminada: ${total} nomina(s) borradas. Ya puedes generar nuevamente.`);
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error eliminando planilla'));
    }
  };

  const exportarPlanillaCSV = () => {
    if (!planillaPuedeExportar) return;

    const periodo = periodosPorId.get(String(planillaPeriodoId));
    const encabezado = [
      ['EMPRESA "Innova"'],
      [`Periodo del ${formatearFecha(periodo?.PER_FECHA_INICIO)} al ${formatearFecha(periodo?.PER_FECHA_FIN)}`],
      ['NIT: 123456-6'],
      [],
    ];
    const headers = [
      'ID',
      'Colaborador',
      'Departamento',
      'Puesto',
      'Salario Base',
      'Bonificacion',
      'Dias Lab',
      'Salario Ord',
      'Horas Extra',
      'Sueldo Extraordinario',
      'Comisiones',
      'Otros Ingresos',
      'Total Ingresos',
      'Anticipo Nomina',
      'IGSS',
      'ISR',
      'Prestamo',
      'Descuentos Judiciales',
      'Otros Egresos',
      'Total Egresos',
      'Liquido a Percibir',
    ];
    const filas = filasPlanilla.map((fila) => [
      fila.empleadoId,
      fila.colaborador,
      fila.departamento,
      fila.puesto,
      fila.salarioBase.toFixed(2),
      fila.bonificacion.toFixed(2),
      fila.diasLaborados,
      fila.salarioOrdinario.toFixed(2),
      fila.horasExtra,
      fila.sueldoExtraordinario.toFixed(2),
      fila.comisiones.toFixed(2),
      fila.otrosIngresos.toFixed(2),
      fila.totalIngresos.toFixed(2),
      fila.anticipo.toFixed(2),
      fila.igss.toFixed(2),
      fila.isr.toFixed(2),
      fila.prestamo.toFixed(2),
      fila.descuentosJudiciales.toFixed(2),
      fila.otrosEgresos.toFixed(2),
      fila.totalEgresos.toFixed(2),
      fila.liquido.toFixed(2),
    ]);
    const total = [
      'TOTAL',
      '',
      '',
      '',
      totalesPlanilla.salarioBase.toFixed(2),
      totalesPlanilla.bonificacion.toFixed(2),
      '',
      totalesPlanilla.salarioOrdinario.toFixed(2),
      totalesPlanilla.horasExtra.toFixed(2),
      totalesPlanilla.sueldoExtraordinario.toFixed(2),
      totalesPlanilla.comisiones.toFixed(2),
      totalesPlanilla.otrosIngresos.toFixed(2),
      totalesPlanilla.totalIngresos.toFixed(2),
      totalesPlanilla.anticipo.toFixed(2),
      totalesPlanilla.igss.toFixed(2),
      totalesPlanilla.isr.toFixed(2),
      totalesPlanilla.prestamo.toFixed(2),
      totalesPlanilla.descuentosJudiciales.toFixed(2),
      totalesPlanilla.otrosEgresos.toFixed(2),
      totalesPlanilla.totalEgresos.toFixed(2),
      totalesPlanilla.liquido.toFixed(2),
    ];

    const csvContent = [...encabezado, headers, ...filas, [], total]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `planilla_periodo_${planillaPeriodoId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'A' || estado === 'Activo')
      return <Chip label="Aprobada" color="success" size="small" />;
    if (estado === 'R' || estado === 'Rechazada')
      return <Chip label="Rechazada" color="error" size="small" />;
    if (estado === 'I' || estado === 'Inactivo')
      return <Chip label="Inactiva" color="default" size="small" />;
    if (estado === 'P' || estado === 'Pendiente')
      return <Chip label="Pendiente" color="warning" size="small" />;
    if (estado === 'B' || estado === 'Borrador')
      return <Chip label="Borrador" color="default" size="small" />;
    return <Chip label={estado || 'Sin estado'} size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando nominas...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, flexWrap: 'wrap' }}>
          <CalculateIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Generar Nomina
          </Typography>
          {periodoActivo && (
            <Box sx={{ ml: 'auto' }}>
              <PeriodoBadge estado={periodoActivo.PER_ESTADO} />
            </Box>
          )}
        </Box>

        {periodoActivo && periodoPlanillaLectura && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Período cerrado o aprobado - sólo lectura. No se pueden generar ni editar registros de nómina.
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          Genera automaticamente las nominas del periodo en estado Borrador. Luego revisa los conceptos y usa Enviar para pasarlas a Pendiente de aprobacion gerencial.
        </Alert>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth required>
              <InputLabel>Periodo</InputLabel>
              <Select
                name="per_id"
                value={generacionForm.per_id}
                label="Periodo"
                onChange={handleGeneracionChange}
              >
                <MenuItem value="">Seleccione periodo</MenuItem>
                {periodosAbiertos.length === 0 && (
                  <MenuItem value="" disabled>
                    No hay periodos abiertos
                  </MenuItem>
                )}
                {periodosAbiertos.map((periodo) => (
                  <MenuItem key={periodo.PER_ID} value={String(periodo.PER_ID)}>
                    {obtenerEtiquetaPeriodo(periodo)} - Pago {formatearFecha(periodo.PER_FECHA_PAGO)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              required
              label="Fecha de generacion"
              name="fecha_generacion"
              type="date"
              value={generacionForm.fecha_generacion}
              onChange={handleGeneracionChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Empleado opcional</InputLabel>
              <Select
                name="empleado_id"
                value={generacionForm.empleado_id}
                label="Empleado opcional"
                onChange={handleGeneracionChange}
              >
                <MenuItem value="">Todos los elegibles</MenuItem>
                {empleadosGenerables.map((empleado) => (
                  <MenuItem key={empleado.EMP_ID} value={String(empleado.EMP_ID)}>
                    {obtenerNombreEmpleado(empleado)}
                    {empleado.EMP_FECHA_LIQUIDACION || String(empleado.EMP_ESTADO || 'A').toUpperCase() === 'L' ? ' - liquidado en este periodo' : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                startIcon={<CalculateIcon />}
                onClick={() => generarNominaPeriodo(false)}
                disabled={generando || periodoGeneracionBloqueado}
              >
                {generando ? 'Generando...' : 'Generar nomina del periodo'}
              </Button>

              <Button
                variant="outlined"
                color="warning"
                startIcon={<CalculateIcon />}
                onClick={() => generarNominaPeriodo(true)}
                disabled={generando || periodoGeneracionBloqueado}
              >
                Recalcular planilla
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <SummarizeIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Planilla del Periodo
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Esta es la vista operativa final de nomina. Desde aqui se revisa la planilla, se envia al gerente y se descarga el CSV cuando todo esta aprobado.
        </Alert>

        <Grid container spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Periodo de planilla</InputLabel>
              <Select
                value={planillaPeriodoId}
                label="Periodo de planilla"
                onChange={(event) => setPlanillaPeriodoId(event.target.value)}
              >
                <MenuItem value="">Seleccione periodo</MenuItem>
                {periodos.map((periodo) => (
                  <MenuItem key={periodo.PER_ID} value={String(periodo.PER_ID)}>
                    {obtenerEtiquetaPeriodoConEstado(periodo)} - Pago {formatearFecha(periodo.PER_FECHA_PAGO)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2.5 }}>
            <Button
              fullWidth
              variant="contained"
              color="warning"
              startIcon={<SendIcon />}
              onClick={enviarPlanillaAGerente}
              disabled={!planillaPuedeEnviar}
            >
              Enviar al gerente
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 2.5 }}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={exportarPlanillaCSV}
              disabled={!planillaPuedeExportar}
            >
              Descargar CSV
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={eliminarPlanillaActual}
              disabled={!planillaPuedeEliminar}
            >
              Eliminar planilla
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 1 }}>
            <Chip
              label={periodoPlanilla ? periodoEstadoLabels[normalizePeriodoEstado(periodoPlanilla.PER_ESTADO) || 'ABIERTO'] : `${filasPlanilla.length} filas`}
              color={filasPlanilla.length > 0 ? 'primary' : 'default'}
              sx={{ width: '100%' }}
            />
          </Grid>
        </Grid>

        {planillaPeriodoId && filasPlanilla.length === 0 && (
          <Alert severity="warning">No hay nominas generadas para este periodo.</Alert>
        )}

        {planillaTieneInconsistencias && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Hay nominas con detalle faltante, duplicado o descuadrado. Corrige en Detalle de Nomina y recalcula antes de enviar o exportar.
          </Alert>
        )}

        {filasPlanilla.length > 0 && (
          <TableContainer sx={{ maxHeight: 560 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell><strong>ID</strong></TableCell>
                  <TableCell><strong>Colaborador</strong></TableCell>
                  <TableCell><strong>Puesto</strong></TableCell>
                  <TableCell align="right"><strong>Salario Base</strong></TableCell>
                  <TableCell align="right"><strong>Bonif.</strong></TableCell>
                  <TableCell align="right"><strong>Salario Ord.</strong></TableCell>
                  <TableCell align="right"><strong>Horas Extra</strong></TableCell>
                  <TableCell align="right"><strong>Sueldo Extra</strong></TableCell>
                  <TableCell align="right"><strong>Comisiones</strong></TableCell>
                  <TableCell align="right"><strong>Otros Ing.</strong></TableCell>
                  <TableCell align="right" sx={{ backgroundColor: '#fffde7' }}><strong>Total Ingresos</strong></TableCell>
                  <TableCell align="right"><strong>Anticipo</strong></TableCell>
                  <TableCell align="right"><strong>IGSS</strong></TableCell>
                  <TableCell align="right"><strong>ISR</strong></TableCell>
                  <TableCell align="right"><strong>Prestamo</strong></TableCell>
                  <TableCell align="right"><strong>Judiciales</strong></TableCell>
                  <TableCell align="right"><strong>Otros Egr.</strong></TableCell>
                  <TableCell align="right" sx={{ backgroundColor: '#fffde7' }}><strong>Total Egresos</strong></TableCell>
                  <TableCell align="right"><strong>Liquido</strong></TableCell>
                  <TableCell><strong>Estado</strong></TableCell>
                  <TableCell><strong>Revision</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {planillaPorDepartamento.map(([departamento, filas]) => {
                  const subtotal = {
                    salarioBase: sumar(filas, (fila) => fila.salarioBase),
                    bonificacion: sumar(filas, (fila) => fila.bonificacion),
                    salarioOrdinario: sumar(filas, (fila) => fila.salarioOrdinario),
                    horasExtra: sumar(filas, (fila) => fila.horasExtra),
                    sueldoExtraordinario: sumar(filas, (fila) => fila.sueldoExtraordinario),
                    comisiones: sumar(filas, (fila) => fila.comisiones),
                    otrosIngresos: sumar(filas, (fila) => fila.otrosIngresos),
                    totalIngresos: sumar(filas, (fila) => fila.totalIngresos),
                    anticipo: sumar(filas, (fila) => fila.anticipo),
                    igss: sumar(filas, (fila) => fila.igss),
                    isr: sumar(filas, (fila) => fila.isr),
                    prestamo: sumar(filas, (fila) => fila.prestamo),
                    descuentosJudiciales: sumar(filas, (fila) => fila.descuentosJudiciales),
                    otrosEgresos: sumar(filas, (fila) => fila.otrosEgresos),
                    totalEgresos: sumar(filas, (fila) => fila.totalEgresos),
                    liquido: sumar(filas, (fila) => fila.liquido),
                  };

                  return (
                    <Fragment key={departamento}>
                      <TableRow key={`${departamento}-header`}>
                        <TableCell colSpan={20} sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                          {departamento.toUpperCase()}
                        </TableCell>
                      </TableRow>
                      {filas.map((fila) => (
                        <TableRow key={fila.nomina.NOM_ID} hover>
                          <TableCell>{fila.empleadoId}</TableCell>
                          <TableCell>{fila.colaborador}</TableCell>
                          <TableCell>{fila.puesto}</TableCell>
                          <TableCell align="right">{formatearMoneda(fila.salarioBase)}</TableCell>
                          <TableCell align="right">{formatearMoneda(fila.bonificacion)}</TableCell>
                          <TableCell align="right">{formatearMoneda(fila.salarioOrdinario)}</TableCell>
                          <TableCell align="right">{fila.horasExtra.toFixed(2)}</TableCell>
                          <TableCell align="right">{formatearMoneda(fila.sueldoExtraordinario)}</TableCell>
                          <TableCell align="right">{formatearMoneda(fila.comisiones)}</TableCell>
                          <TableCell align="right">{formatearMoneda(fila.otrosIngresos)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: '#fffde7' }}>{formatearMoneda(fila.totalIngresos)}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>{formatearMoneda(fila.anticipo)}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>{formatearMoneda(fila.igss)}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>{formatearMoneda(fila.isr)}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>{formatearMoneda(fila.prestamo)}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>{formatearMoneda(fila.descuentosJudiciales)}</TableCell>
                          <TableCell align="right" sx={{ color: 'error.main' }}>{formatearMoneda(fila.otrosEgresos)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main', backgroundColor: '#fffde7' }}>{formatearMoneda(fila.totalEgresos)}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main' }}>{formatearMoneda(fila.liquido)}</TableCell>
                          <TableCell>{obtenerChipEstado(fila.nomina.NOM_ESTADO)}</TableCell>
                          <TableCell>
                            {fila.conceptos === 0 || fila.duplicados > 0 || !fila.cuadra
                              ? <Chip label="Revisar" color="error" size="small" />
                              : <Chip label="OK" color="success" size="small" />}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow key={`${departamento}-subtotal`} sx={{ backgroundColor: '#fafafa' }}>
                        <TableCell colSpan={3}><strong>Sub-total</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.salarioBase)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.bonificacion)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.salarioOrdinario)}</strong></TableCell>
                        <TableCell align="right"><strong>{subtotal.horasExtra.toFixed(2)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.sueldoExtraordinario)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.comisiones)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.otrosIngresos)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.totalIngresos)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.anticipo)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.igss)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.isr)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.prestamo)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.descuentosJudiciales)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.otrosEgresos)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.totalEgresos)}</strong></TableCell>
                        <TableCell align="right"><strong>{formatearMoneda(subtotal.liquido)}</strong></TableCell>
                        <TableCell colSpan={2} />
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}><strong>Total</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.salarioBase)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.bonificacion)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.salarioOrdinario)}</strong></TableCell>
                  <TableCell align="right"><strong>{totalesPlanilla.horasExtra.toFixed(2)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.sueldoExtraordinario)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.comisiones)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.otrosIngresos)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.totalIngresos)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.anticipo)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.igss)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.isr)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.prestamo)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.descuentosJudiciales)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.otrosEgresos)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.totalEgresos)}</strong></TableCell>
                  <TableCell align="right"><strong>{formatearMoneda(totalesPlanilla.liquido)}</strong></TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        )}
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

export default NominaCRUD;
