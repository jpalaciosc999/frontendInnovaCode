import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Snackbar,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
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
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import PaidIcon from '@mui/icons-material/Paid';
import PercentIcon from '@mui/icons-material/Percent';
import PeopleIcon from '@mui/icons-material/People';

import type { Nomina, NominaForm } from '../interfaces/nomina';
import type { NominaDetalle } from '../interfaces/nomina-detalle';
import type { Empleado } from '../interfaces/empleados';
import type { Periodo } from '../interfaces/periodo';
import type { Puesto } from '../interfaces/puestos';
import type { Departamento } from '../interfaces/departamentos';
import type { Ingreso } from '../interfaces/tipoIngresos';
import type { Descuento } from '../interfaces/descuentos';
import type { Liquidacion } from '../interfaces/liquidacion';
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
import { obtenerLiquidaciones } from '../services/liquidacion.service';
import { getApiErrorMessage } from '../api/errors';
import { formatearMoneda, obtenerNombreEmpleado } from '../utils/relations';
import {
  esPeriodoAbierto,
  esPeriodoAprobado,
  normalizePeriodoEstado,
  periodoEstadoLabels,
} from '../utils/payroll';
import { getDescuentoCategoria, getIngresoCategoria, isConceptoBaseBoleta } from '../utils/conceptClassifier';
import { downloadPayStubPdf } from '../utils/payStubPdf';
import PeriodoBadge from './common/PeriodoBadge';
import PageHeader from './common/PageHeader';
import SummaryCard from './common/SummaryCard';
import StateBlock from './common/StateBlock';
import LookupSelect from './common/LookupSelect';

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

const formatearFecha = (fecha: string | null | undefined) => {
  if (!fecha) return '';

  const raw = String(fecha);
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[3]}/${isoMatch[2]}/${isoMatch[1]}`;

  const slashMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (slashMatch) return `${slashMatch[1]}/${slashMatch[2]}/${slashMatch[3]}`;

  return raw.slice(0, 10);
};

const obtenerFechaLocalInput = () => {
  const ahora = new Date();
  const local = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
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

const sanitizarNombreArchivo = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();

const obtenerTextoEstadoNomina = (estado: string) => {
  if (estado === 'A' || estado === 'Activo') return 'Aprobada';
  if (estado === 'R' || estado === 'Rechazada') return 'Rechazada';
  if (estado === 'I' || estado === 'Inactivo') return 'Inactiva';
  if (estado === 'P' || estado === 'Pendiente') return 'Pendiente';
  if (estado === 'B' || estado === 'Borrador') return 'Borrador';
  return estado || 'Sin estado';
};

const numeroALetrasBasico = (value: number): string => {
  const unidades = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
  const especiales: Record<number, string> = {
    10: 'diez',
    11: 'once',
    12: 'doce',
    13: 'trece',
    14: 'catorce',
    15: 'quince',
    20: 'veinte',
  };
  const decenas = ['', '', 'veinti', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const centenas = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  const convertirMenorMil = (num: number): string => {
    if (num === 0) return '';
    if (num === 100) return 'cien';
    if (num < 10) return unidades[num];
    if (especiales[num]) return especiales[num];
    if (num < 20) return `dieci${unidades[num - 10]}`;
    if (num < 30) return num === 20 ? especiales[20] : `${decenas[2]}${unidades[num - 20]}`;
    if (num < 100) {
      const decena = Math.floor(num / 10);
      const unidad = num % 10;
      return unidad ? `${decenas[decena]} y ${unidades[unidad]}` : decenas[decena];
    }

    const centena = Math.floor(num / 100);
    const resto = num % 100;
    return `${centenas[centena]} ${convertirMenorMil(resto)}`.trim();
  };

  const entero = Math.floor(Math.abs(value));
  if (entero === 0) return 'cero';
  if (entero < 1000) return convertirMenorMil(entero);

  const miles = Math.floor(entero / 1000);
  const resto = entero % 1000;
  const textoMiles = miles === 1 ? 'mil' : `${convertirMenorMil(miles)} mil`;
  return `${textoMiles} ${convertirMenorMil(resto)}`.trim();
};

const montoEnLetras = (value: number) => {
  const centavos = Math.round((Math.abs(value) % 1) * 100);
  const letras = numeroALetrasBasico(value).toUpperCase();
  return `${letras} QUETZALES CON ${String(centavos).padStart(2, '0')}/100`;
};

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
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);
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
        liquidacionesData,
      ] = await Promise.all([
        obtenerNominas(),
        obtenerDetallesNomina(),
        obtenerEmpleados(),
        obtenerPeriodos(),
        obtenerPuestos(),
        obtenerDepartamentos(),
        obtenerIngresos(),
        obtenerDescuentos(),
        obtenerLiquidaciones(),
      ]);
      setDatos(nominasData);
      setDetalles(detallesData);
      setEmpleados(empleadosData);
      setPeriodos(periodosData);
      setPuestos(puestosData);
      setDepartamentos(departamentosData);
      setIngresos(ingresosData);
      setDescuentos(descuentosData);
      setLiquidaciones(liquidacionesData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error cargando datos de nomina'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
    setGeneracionForm((prev) => ({
      ...prev,
      fecha_generacion: obtenerFechaLocalInput(),
    }));
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

  const empleadosLiquidadosIds = useMemo(
    () => new Set(liquidaciones.map((liquidacion) => String(liquidacion.EMP_ID))),
    [liquidaciones]
  );

  const empleadoEstaLiquidado = useCallback((empleado?: Empleado) => {
    if (!empleado) return false;
    const estado = String(empleado.EMP_ESTADO || 'A').toUpperCase();
    return Boolean(empleado.EMP_FECHA_LIQUIDACION)
      || estado === 'L'
      || empleadosLiquidadosIds.has(String(empleado.EMP_ID));
  }, [empleadosLiquidadosIds]);

  const empleadosGenerables = useMemo(() => {
    return empleados.filter((empleado) => {
      const estado = String(empleado.EMP_ESTADO || 'A').toUpperCase();
      return estado === 'A' && !empleadoEstaLiquidado(empleado);
    });
  }, [empleados, empleadoEstaLiquidado]);

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
    const periodo = periodosPorId.get(String(nomina.PER_ID));
    const detallesNomina = detalles.filter((detalle) => String(detalle.NOM_ID) === String(nomina.NOM_ID));
    const ingresosDetalle = detallesNomina.filter((detalle) => !detalle.TDS_ID);
    const descuentosDetalle = detallesNomina.filter((detalle) => detalle.TDS_ID);
    const ingresoPorCategoria = (categoria: ReturnType<typeof getIngresoCategoria>) =>
      sumar(ingresosDetalle, (detalle) => {
        const ingreso = detalle.TIS_ID ? ingresosPorId.get(String(detalle.TIS_ID)) : undefined;
        return ingreso && getIngresoCategoria(ingreso) === categoria ? Number(detalle.DET_MONTO || 0) : 0;
      });
    const descuentoPorCategoria = (categoria: ReturnType<typeof getDescuentoCategoria>) =>
      sumar(descuentosDetalle, (detalle) => {
        const descuento = descuentosPorId.get(String(detalle.TDS_ID));
        return descuento && getDescuentoCategoria(descuento) === categoria ? Number(detalle.DET_MONTO || 0) : 0;
      });
    const horasExtra = sumar(ingresosDetalle, (detalle) => {
      const ingreso = detalle.TIS_ID ? ingresosPorId.get(String(detalle.TIS_ID)) : undefined;
      return ingreso && getIngresoCategoria(ingreso) === 'horas_extra' ? Number(detalle.DET_REFERENCIA || 0) : 0;
    });
    const salarioOrdinario = ingresoPorCategoria('salario');
    const bonificacion = ingresoPorCategoria('bonificacion');
    const sueldoExtraordinario = ingresoPorCategoria('horas_extra');
    const comisiones = ingresoPorCategoria('comision') + sumar(ingresosDetalle, (detalle) =>
      detalle.KRE_ID && !detalle.TIS_ID ? Number(detalle.DET_MONTO || 0) : 0
    );
    const ingresosClasificados = salarioOrdinario + bonificacion + sueldoExtraordinario + comisiones;
    const totalIngresos = sumar(ingresosDetalle, (detalle) => Number(detalle.DET_MONTO || 0));
    const anticipo = descuentoPorCategoria('anticipo');
    const igss = descuentoPorCategoria('igss');
    const isr = descuentoPorCategoria('isr');
    const prestamo = descuentoPorCategoria('prestamo');
    const descuentosJudiciales = descuentoPorCategoria('judicial');
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
      diasLaborados: Number(periodo?.DIAS_PERIODO || 0),
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
      .filter((nomina) => !empleadoEstaLiquidado(empleadosPorId.get(String(nomina.EMP_ID))))
      .map(construirFilaPlanilla),
    [datos, detalles, empleadosPorId, puestosPorId, departamentosPorId, periodosPorId, ingresosPorId, descuentosPorId, planillaPeriodoId, duplicadosPorNomina, empleadoEstaLiquidado]
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
  const filasEnviables = filasPlanilla.filter((fila) => ['B', 'R'].includes(fila.nomina.NOM_ESTADO));
  const planillaPuedeEnviar = filasPlanilla.length > 0
    && periodoPlanillaAbierto
    && !planillaTieneInconsistencias
    && filasEnviables.length > 0;
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

  const obtenerMotivoBloqueoEnvio = () => {
    if (!planillaPeriodoId) return 'Selecciona un periodo de planilla para enviarla al gerente.';
    if (filasPlanilla.length === 0) return 'No hay nominas generadas para este periodo.';
    if (!periodoPlanillaAbierto) return 'Solo se pueden enviar a gerencia las planillas de periodos abiertos.';
    if (planillaTieneInconsistencias) return 'Hay nominas con detalle faltante, duplicado o descuadrado.';
    if (filasEnviables.length === 0) return 'No hay nominas en Borrador o Rechazadas para enviar. Las nominas aprobadas ya no se envian al gerente.';
    return '';
  };

  const motivoBloqueoEnvio = planillaPuedeEnviar ? '' : obtenerMotivoBloqueoEnvio();

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

  const generarNominaPeriodo = async (recalcular = false) => {
    if (!generacionForm.per_id) {
      setError('Selecciona el periodo para generar nomina');
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
      const fechaGeneracionActual = obtenerFechaLocalInput();
      setGeneracionForm((prev) => ({
        ...prev,
        fecha_generacion: fechaGeneracionActual,
      }));
      const empleadosObjetivo = generacionForm.empleado_id
        ? [Number(generacionForm.empleado_id)]
        : empleadosGenerables.map((empleado) => Number(empleado.EMP_ID));

      if (empleadosObjetivo.length === 0) {
        setError('No hay empleados activos sin liquidacion para generar nomina en este periodo.');
        return;
      }

      const respuesta = await generarNominas({
        per_id: Number(generacionForm.per_id),
        fecha_generacion: fechaGeneracionActual,
        estado: 'B',
        emp_ids: empleadosObjetivo,
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
      setPlanillaPeriodoId(String(generacionForm.per_id));
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

  const obtenerConceptosBoleta = (nominaId: number) =>
    detalles
      .filter((detalle) => String(detalle.NOM_ID) === String(nominaId))
      .map((detalle) => {
        const ingreso = detalle.TIS_ID ? ingresosPorId.get(String(detalle.TIS_ID)) : undefined;
        const descuento = detalle.TDS_ID ? descuentosPorId.get(String(detalle.TDS_ID)) : undefined;
        const tipo = descuento ? 'Deduccion' : 'Ingreso';
        const codigo = ingreso?.TIS_CODIGO || descuento?.TDS_CODIGO || (detalle.KRE_ID ? `KPI-${detalle.KRE_ID}` : 'N/A');
        const nombre = ingreso?.TIS_NOMBRE || descuento?.TDS_NOMBRE || (detalle.KRE_ID ? 'Resultado KPI' : 'Concepto sin clasificar');

        return {
          tipo,
          codigo,
          nombre,
          referencia: detalle.DET_REFERENCIA,
          monto: Number(detalle.DET_MONTO || 0),
        };
      })
      .sort((a, b) => a.tipo.localeCompare(b.tipo) || a.nombre.localeCompare(b.nombre));

  const descargarBoletaPago = (fila: FilaPlanilla) => {
    const periodo = periodosPorId.get(String(fila.nomina.PER_ID));
    const empleado = empleadosPorId.get(String(fila.nomina.EMP_ID));
    const conceptos = obtenerConceptosBoleta(fila.nomina.NOM_ID);
    const periodoTexto = periodo
      ? `${formatearFecha(periodo.PER_FECHA_INICIO)} al ${formatearFecha(periodo.PER_FECHA_FIN)}`
      : `Periodo #${fila.nomina.PER_ID}`;
    const filename = `boleta_pago_${fila.empleadoId}_${sanitizarNombreArchivo(fila.colaborador || 'empleado')}.pdf`;
    const camposEmpleado = [
      { label: 'Nombre Completo:', value: fila.colaborador },
      { label: 'No. Empleado:', value: String(fila.empleadoId) },
      { label: 'DPI / NIT:', value: [empleado?.EMP_DPI, empleado?.EMP_NIT].filter(Boolean).join(' / ') },
      { label: 'Cargo / Puesto:', value: fila.puesto },
      { label: 'Departamento:', value: fila.departamento },
      { label: 'Fecha de Ingreso:', value: formatearFecha(empleado?.EMP_FECHA_CONTRATACION) },
    ].filter(({ value }) => value && value !== 'Sin puesto' && value !== 'Sin departamento');
    const esConceptoPlantillaCubierto = (concepto: ReturnType<typeof obtenerConceptosBoleta>[number]) => {
      return isConceptoBaseBoleta(concepto);
    };
    const conceptosAdicionales = conceptos
      .filter((concepto) => !esConceptoPlantillaCubierto(concepto))
      .map((concepto) => [`${concepto.codigo} - ${concepto.nombre}`, concepto.monto, concepto.tipo] as const);
    const ingresosPlantilla = [
      ['Salario base', fila.salarioOrdinario || fila.salarioBase],
      ['Horas extra', fila.sueldoExtraordinario],
      ['Comisiones', fila.comisiones],
      ['Bono incentivo', fila.bonificacion],
      ...conceptosAdicionales
        .filter(([, , tipo]) => tipo === 'Ingreso')
        .map(([label, monto]) => [label, monto] as [string, number]),
    ].filter(([, value]) => Number(value) > 0) as Array<[string, number]>;
    const deduccionesPlantilla = [
      ['IGSS', fila.igss],
      ['ISR', fila.isr],
      ['Prestamo empresa', fila.prestamo],
      ['Anticipo de salario', fila.anticipo],
      ['Descuentos judiciales', fila.descuentosJudiciales],
      ...conceptosAdicionales
        .filter(([, , tipo]) => tipo === 'Deduccion')
        .map(([label, monto]) => [label, monto] as [string, number]),
    ].filter(([, value]) => Number(value) > 0) as Array<[string, number]>;
    const camposNomina = [
      { label: 'Fecha Generacion:', value: formatearFecha(fila.nomina.NOM_FECHA_GENERACION) },
      { label: 'Dias Trabajados:', value: String(fila.diasLaborados || 'N/A') },
      { label: 'Estado:', value: obtenerTextoEstadoNomina(fila.nomina.NOM_ESTADO) },
      { label: 'Salario Base:', value: formatearMoneda(fila.salarioBase) },
    ];

    downloadPayStubPdf({
      filename,
      companyName: 'EMPRESA "Innova", S.A.',
      companyNit: '123456-6',
      title: 'BOLETA DE PAGO',
      correlativo: String(fila.nomina.NOM_ID),
      periodo: periodoTexto,
      fechaPago: formatearFecha(periodo?.PER_FECHA_PAGO) || 'N/A',
      employeeFields: camposEmpleado,
      payrollFields: camposNomina,
      incomeItems: ingresosPlantilla.map(([label, amount]) => ({ label, amount: formatearMoneda(amount) })),
      deductionItems: deduccionesPlantilla.map(([label, amount]) => ({ label, amount: formatearMoneda(amount) })),
      totalIncome: formatearMoneda(fila.totalIngresos),
      totalDeductions: formatearMoneda(fila.totalEgresos),
      netPay: formatearMoneda(fila.liquido),
      amountInWords: montoEnLetras(fila.liquido),
      employeeName: fila.colaborador,
      employeeDpi: String(empleado?.EMP_DPI ?? ''),
    });
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

  const guiaPasos = [
    {
      label: 'Selecciona el periodo',
      description: periodoGeneracion
        ? `Periodo listo: ${obtenerEtiquetaPeriodo(periodoGeneracion)}`
        : 'Elige un periodo abierto y confirma la fecha de generacion.',
      completed: Boolean(generacionForm.per_id && generacionForm.fecha_generacion),
      error: periodosAbiertos.length === 0,
    },
    {
      label: 'Genera la planilla',
      description: planillaPeriodoId
        ? `${filasPlanilla.length} nomina(s) cargadas para revision.`
        : 'Genera para todos los elegibles o para un empleado especifico.',
      completed: filasPlanilla.length > 0,
      error: Boolean(planillaPeriodoId && filasPlanilla.length === 0),
    },
    {
      label: 'Revisa totales',
      description: planillaTieneInconsistencias
        ? 'Hay nominas sin detalle, duplicadas o descuadradas.'
        : filasPlanilla.length > 0
          ? `Liquido total: ${formatearMoneda(totalesPlanilla.liquido)}`
          : 'Selecciona una planilla para ver ingresos, egresos y liquido.',
      completed: filasPlanilla.length > 0 && !planillaTieneInconsistencias,
      error: planillaTieneInconsistencias,
    },
    {
      label: 'Enviar o descargar',
      description: planillaPuedeExportar
        ? 'La planilla esta aprobada y lista para descargar CSV.'
        : planillaPuedeEnviar
          ? 'La planilla esta lista para enviarse a aprobacion gerencial.'
          : 'Cuando todo cuadre, envia a aprobacion. Al aprobarse, podras descargar CSV.',
      completed: planillaPuedeExportar,
      error: false,
    },
  ];

  const pasoActivo = Math.max(0, guiaPasos.findIndex((paso) => !paso.completed));
  const guiaCompletada = guiaPasos.every((paso) => paso.completed);

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <StateBlock title="Cargando nominas..." loading />
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <PageHeader
        title="Asistente para generar nomina"
        subtitle="Genera, valida y envia planillas con el mismo orden del proceso de pago."
        icon={<CalculateIcon />}
        meta={periodoActivo ? <PeriodoBadge estado={periodoActivo.PER_ESTADO} /> : undefined}
      />

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>

        <Stepper activeStep={guiaCompletada ? guiaPasos.length : pasoActivo} orientation="vertical" sx={{ mb: 3 }}>
          {guiaPasos.map((paso) => (
            <Step key={paso.label} completed={paso.completed}>
              <StepLabel
                error={paso.error}
                icon={paso.error ? <ErrorOutlinedIcon color="error" /> : paso.completed ? <CheckCircleIcon color="success" /> : undefined}
              >
                {paso.label}
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {paso.description}
                </Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>

        {periodoActivo && periodoPlanillaLectura && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Período cerrado o aprobado - sólo lectura. No se pueden generar ni editar registros de nómina.
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          Elige el periodo, genera la planilla en borrador y revisa que cada colaborador tenga conceptos y totales cuadrados.
        </Alert>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <LookupSelect
              required
              label="Periodo"
              value={generacionForm.per_id}
              placeholder="Buscar periodo abierto"
              options={periodosAbiertos.map((periodo) => ({
                value: String(periodo.PER_ID),
                label: obtenerEtiquetaPeriodo(periodo),
                description: `Pago ${formatearFecha(periodo.PER_FECHA_PAGO)}`,
              }))}
              onChange={(value) => setGeneracionForm((prev) => ({ ...prev, per_id: value }))}
              helperText={periodosAbiertos.length === 0 ? 'No hay periodos abiertos' : undefined}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              required
              label="Fecha de generacion"
              name="fecha_generacion"
              value={formatearFecha(generacionForm.fecha_generacion)}
              disabled
              helperText="Se usa automaticamente la fecha actual al generar."
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <LookupSelect
              label="Empleado opcional"
              value={generacionForm.empleado_id}
              placeholder="Todos los elegibles"
              options={empleadosGenerables.map((empleado) => ({
                value: String(empleado.EMP_ID),
                label: obtenerNombreEmpleado(empleado) || `Empleado #${empleado.EMP_ID}`,
                description: `ID ${empleado.EMP_ID}`,
              }))}
              onChange={(value) => setGeneracionForm((prev) => ({ ...prev, empleado_id: value }))}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
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
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <SummarizeIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Revision de planilla
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Cuando la revision marque OK, envia la planilla al gerente. Si ya esta aprobada, descarga el CSV para pago.
        </Alert>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard title="Empleados en planilla" value={filasPlanilla.length} helper="Filas revisadas" icon={<PeopleIcon />} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard title="Ingresos" value={formatearMoneda(totalesPlanilla.totalIngresos)} icon={<PaidIcon />} tone="success" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard title="Descuentos" value={formatearMoneda(totalesPlanilla.totalEgresos)} icon={<PercentIcon />} tone="warning" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SummaryCard title="Liquido" value={formatearMoneda(totalesPlanilla.liquido)} helper={planillaTieneInconsistencias ? 'Con revisiones pendientes' : 'Total a pagar'} icon={<CheckCircleIcon />} tone={planillaTieneInconsistencias ? 'error' : 'primary'} />
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <LookupSelect
              label="Periodo de planilla"
              value={planillaPeriodoId}
              placeholder="Buscar periodo"
              options={periodos.map((periodo) => ({
                value: String(periodo.PER_ID),
                label: obtenerEtiquetaPeriodoConEstado(periodo),
                description: `Pago ${formatearFecha(periodo.PER_FECHA_PAGO)}`,
              }))}
              onChange={setPlanillaPeriodoId}
            />
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

        {motivoBloqueoEnvio && filasPlanilla.length > 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Enviar al gerente esta deshabilitado: {motivoBloqueoEnvio}
          </Alert>
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
                  <TableCell><strong>Acciones</strong></TableCell>
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
                        <TableCell colSpan={22} sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
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
                          <TableCell>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<PictureAsPdfIcon />}
                              onClick={() => descargarBoletaPago(fila)}
                              disabled={fila.conceptos === 0}
                              sx={{ whiteSpace: 'nowrap' }}
                            >
                              Boleta PDF
                            </Button>
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
                        <TableCell colSpan={3} />
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
                  <TableCell colSpan={3} />
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
