import { Fragment, useEffect, useMemo, useState } from 'react';
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
  Typography
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import ApprovalIcon from '@mui/icons-material/Approval';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import type { Empleado } from '../interfaces/empleados';
import type { Nomina, NominaForm } from '../interfaces/nomina';
import type { NominaDetalle } from '../interfaces/nomina-detalle';
import type { Periodo } from '../interfaces/periodo';
import type { Puesto } from '../interfaces/puestos';
import type { Departamento } from '../interfaces/departamentos';
import type { Ingreso } from '../interfaces/tipoIngresos';
import type { Descuento } from '../interfaces/descuentos';
import { obtenerEmpleados } from '../services/empleados.service';
import { actualizarNomina, obtenerNominas } from '../services/nomina.service';
import { obtenerDetallesNomina } from '../services/nomina-detalle.service';
import { obtenerPeriodos } from '../services/periodo.service';
import { obtenerPuestos } from '../services/puestos.service';
import { obtenerDepartamentos } from '../services/departamentos.service';
import { obtenerIngresos } from '../services/tipoIngresos.service';
import { obtenerDescuentos } from '../services/descuentos.service';
import { getApiErrorMessage } from '../api/errors';
import { formatearFecha, formatearMoneda, obtenerNombreEmpleado } from '../utils/relations';

type TotalesNomina = {
  ingresos: number;
  descuentos: number;
  liquido: number;
  cantidad: number;
  duplicados: number;
};

type FilaPlanilla = {
  nomina: Nomina;
  empleadoId: number;
  colaborador: string;
  departamento: string;
  puesto: string;
  salarioBase: number;
  bonificacion: number;
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
  duplicados: 0,
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

const redondearMoneda = (value: number) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

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

const obtenerEstado = (estado: string) => {
  if (estado === 'P') return <Chip label="Pendiente" color="warning" size="small" />;
  if (estado === 'A') return <Chip label="Aprobada" color="success" size="small" />;
  if (estado === 'I' || estado === 'R') return <Chip label="Rechazada" color="error" size="small" />;
  if (estado === 'B') return <Chip label="Borrador" color="default" size="small" />;
  return <Chip label={estado || 'Sin estado'} size="small" />;
};

function AprobacionNomina() {
  const [nominas, setNominas] = useState<Nomina[]>([]);
  const [detalles, setDetalles] = useState<NominaDetalle[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [descuentos, setDescuentos] = useState<Descuento[]>([]);
  const [periodoRevisionId, setPeriodoRevisionId] = useState('');
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

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

      setNominas(nominasData);
      setDetalles(detallesData);
      setEmpleados(empleadosData);
      setPeriodos(periodosData);
      setPuestos(puestosData);
      setDepartamentos(departamentosData);
      setIngresos(ingresosData);
      setDescuentos(descuentosData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error cargando nominas para aprobacion'));
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

  const ingresosPorId = useMemo(
    () => new Map(ingresos.map((ingreso) => [String(ingreso.TIS_ID), ingreso])),
    [ingresos]
  );

  const descuentosPorId = useMemo(
    () => new Map(descuentos.map((descuento) => [String(descuento.TDS_ID), descuento])),
    [descuentos]
  );

  const pendientes = useMemo(
    () => nominas.filter((nomina) => nomina.NOM_ESTADO === 'P'),
    [nominas]
  );

  const periodosPendientes = useMemo(() => {
    const ids = new Set(pendientes.map((nomina) => String(nomina.PER_ID)));
    return periodos.filter((periodo) => ids.has(String(periodo.PER_ID)));
  }, [pendientes, periodos]);

  const periodoActivoId = periodoRevisionId || String(periodosPendientes[0]?.PER_ID ?? '');

  const nominasPendientesPeriodo = useMemo(
    () => pendientes.filter((nomina) => periodoActivoId && String(nomina.PER_ID) === periodoActivoId),
    [pendientes, periodoActivoId]
  );

  const detallesPorNomina = useMemo(() => {
    const agrupados = new Map<string, NominaDetalle[]>();
    detalles.forEach((detalle) => {
      const key = String(detalle.NOM_ID);
      const actuales = agrupados.get(key) ?? [];
      actuales.push(detalle);
      agrupados.set(key, actuales);
    });
    return agrupados;
  }, [detalles]);

  const resumenPorNomina = useMemo(() => {
    const resumen = new Map<string, TotalesNomina>();
    const conceptosPorNomina = new Map<string, Set<string>>();

    detalles.forEach((detalle) => {
      const key = String(detalle.NOM_ID);
      const actual = resumen.get(key) ?? { ...totalesVacios };
      const monto = Number(detalle.DET_MONTO || 0);

      if (detalle.TDS_ID) actual.descuentos += monto;
      else actual.ingresos += monto;

      const concepto = obtenerClaveConcepto(detalle);
      if (concepto) {
        const conceptos = conceptosPorNomina.get(key) ?? new Set<string>();
        if (conceptos.has(concepto)) actual.duplicados += 1;
        conceptos.add(concepto);
        conceptosPorNomina.set(key, conceptos);
      }

      actual.ingresos = redondearMoneda(actual.ingresos);
      actual.descuentos = redondearMoneda(actual.descuentos);
      actual.liquido = redondearMoneda(actual.ingresos - actual.descuentos);
      actual.cantidad += 1;
      resumen.set(key, actual);
    });

    return resumen;
  }, [detalles]);

  const obtenerResumenNomina = (nominaId: number) =>
    resumenPorNomina.get(String(nominaId)) ?? totalesVacios;

  const construirFilaPlanilla = (nomina: Nomina): FilaPlanilla => {
    const empleado = empleadosPorId.get(String(nomina.EMP_ID));
    const puesto = empleado?.PUE_ID ? puestosPorId.get(String(empleado.PUE_ID)) : undefined;
    const departamentoId = empleado?.DEP_ID ?? puesto?.DEP_ID;
    const departamento = departamentoId ? departamentosPorId.get(String(departamentoId)) : undefined;
    const detallesNomina = detallesPorNomina.get(String(nomina.NOM_ID)) ?? [];
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
    const resumen = obtenerResumenNomina(nomina.NOM_ID);
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
      conceptos: resumen.cantidad,
      duplicados: resumen.duplicados,
      cuadra,
    };
  };

  const filasPlanilla = useMemo(
    () => nominasPendientesPeriodo.map(construirFilaPlanilla),
    [nominasPendientesPeriodo, detallesPorNomina, empleadosPorId, puestosPorId, departamentosPorId, ingresosPorId, descuentosPorId, resumenPorNomina]
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
  const puedeAprobarPlanilla = filasPlanilla.length > 0 && !planillaTieneInconsistencias;

  const obtenerEtiquetaPeriodo = (periodo?: Periodo) =>
    periodo
      ? `${formatearFecha(periodo.PER_FECHA_INICIO)} al ${formatearFecha(periodo.PER_FECHA_FIN)}`
      : '';

  const crearPayloadNomina = (nomina: Nomina, fila: FilaPlanilla, estado: 'A' | 'I'): NominaForm => ({
    nom_total_ingresos: redondearMoneda(fila.totalIngresos),
    nom_total_descuento: redondearMoneda(fila.totalEgresos),
    nom_salario_liquido: redondearMoneda(fila.liquido),
    nom_fecha_generacion: toInputDate(nomina.NOM_FECHA_GENERACION),
    per_id: nomina.PER_ID,
    empleado_id: nomina.EMP_ID,
    liq_id: nomina.LIQ_ID ?? null,
    nom_estado: estado,
  });

  const cambiarEstadoPlanilla = async (estado: 'A' | 'I') => {
    try {
      setProcesando(true);
      setError('');
      setMensaje('');

      if (estado === 'A' && !puedeAprobarPlanilla) {
        setError('No se puede aprobar una planilla vacia, descuadrada, sin detalle o con conceptos duplicados.');
        return;
      }

      if (filasPlanilla.length === 0) {
        setError('No hay nominas pendientes para este periodo.');
        return;
      }

      await Promise.all(filasPlanilla.map((fila) =>
        actualizarNomina(fila.nomina.NOM_ID, crearPayloadNomina(fila.nomina, fila, estado))
      ));

      setMensaje(estado === 'A' ? 'Planilla aprobada correctamente' : 'Planilla rechazada correctamente');
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error actualizando estado de la planilla'));
    } finally {
      setProcesando(false);
    }
  };

  const handlePeriodoChange = (event: SelectChangeEvent) => {
    setPeriodoRevisionId(event.target.value);
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando nominas pendientes...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <ApprovalIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Aprobacion de Nomina
          </Typography>
        </Box>

        <Alert severity="info">
          Aqui el gerente revisa la planilla enviada por Contabilidad. Debe aprobarse completa para quedar lista para pago y CSV.
        </Alert>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Grid container spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
          <Grid size={{ xs: 12, md: 5 }}>
            <FormControl fullWidth>
              <InputLabel>Periodo pendiente</InputLabel>
              <Select value={periodoActivoId} label="Periodo pendiente" onChange={handlePeriodoChange}>
                {periodosPendientes.length === 0 && <MenuItem value="">Sin periodos pendientes</MenuItem>}
                {periodosPendientes.map((periodo) => (
                  <MenuItem key={periodo.PER_ID} value={String(periodo.PER_ID)}>
                    {obtenerEtiquetaPeriodo(periodo)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Chip
              label={`${filasPlanilla.length} empleados`}
              color={filasPlanilla.length > 0 ? 'primary' : 'default'}
              sx={{ width: '100%' }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2.5 }}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              startIcon={<CheckCircleIcon />}
              disabled={procesando || !puedeAprobarPlanilla}
              onClick={() => cambiarEstadoPlanilla('A')}
            >
              Aprobar planilla
            </Button>
          </Grid>

          <Grid size={{ xs: 12, md: 2.5 }}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<CancelIcon />}
              disabled={procesando || filasPlanilla.length === 0}
              onClick={() => cambiarEstadoPlanilla('I')}
            >
              Rechazar planilla
            </Button>
          </Grid>
        </Grid>

        {planillaTieneInconsistencias && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Hay nominas sin detalle, duplicadas o descuadradas. Contabilidad debe corregirlas antes de aprobacion.
          </Alert>
        )}

        {filasPlanilla.length > 0 ? (
          <TableContainer sx={{ maxHeight: 620 }}>
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
                      <TableRow>
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
                          <TableCell>{obtenerEstado(fila.nomina.NOM_ESTADO)}</TableCell>
                          <TableCell>
                            {fila.conceptos === 0 || fila.duplicados > 0 || !fila.cuadra
                              ? <Chip label="Revisar" color="error" size="small" />
                              : <Chip label="OK" color="success" size="small" />}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow sx={{ backgroundColor: '#fafafa' }}>
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
        ) : (
          <Alert severity="info">No hay nominas pendientes de aprobacion para este periodo.</Alert>
        )}
      </Paper>

      <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setMensaje('')} sx={{ width: '100%' }}>
          {mensaje}
        </Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AprobacionNomina;
