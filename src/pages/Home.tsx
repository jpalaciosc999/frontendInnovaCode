import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Step,
  StepButton,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';

import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BadgeIcon from '@mui/icons-material/Badge';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PaymentsIcon from '@mui/icons-material/Payments';
import CalculateIcon from '@mui/icons-material/Calculate';
import SummarizeIcon from '@mui/icons-material/Summarize';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

import type { Empleado } from '../interfaces/empleados';
import type { ControlLaboral } from '../interfaces/controlLaboral';
import type { CuentaBancaria } from '../interfaces/cuentaBancaria';
import type { EmpleadoContrato } from '../interfaces/empleado_contrato';
import type { SuspensionIgss } from '../interfaces/suspensionIgss';

import { obtenerEmpleados } from '../services/empleados.service';
import { obtenerControles } from '../services/controlLaboral.service';
import { obtenerCuentas } from '../services/cuentaBancaria.service';
import { obtenerContratos } from '../services/empleado_contrato.service';
import { obtenerSuspensionesIgss } from '../services/suspensionIgss.service';
import { useAuth } from '../context/AuthContext';
import { usePayrollGuide } from '../context/PayrollGuideContext';
import { isRole } from '../auth/access';
import PageHeader from '../components/common/PageHeader';

type GuideStep = {
  title: string;
  helper: string;
  path: string;
  icon: ReactNode;
  optional?: boolean;
};

type MetricCardProps = {
  title: string;
  value: number | string;
  helper: string;
  icon: ReactNode;
  color: string;
  to: string;
  disabled?: boolean;
};

const payrollSteps: GuideStep[] = [
  {
    title: 'Preparar empleados',
    helper: 'Registra colaboradores, puestos, contratos y cuentas bancarias.',
    path: '/empleados',
    icon: <PeopleIcon />,
  },
  {
    title: 'Revisar asistencia',
    helper: 'Valida marcajes, permisos, suspensiones y pendientes laborales.',
    path: '/control-laboral',
    icon: <AccessTimeIcon />,
  },
  {
    title: 'Abrir periodo',
    helper: 'Define el rango y la fecha de pago que se usara para la nomina.',
    path: '/periodo',
    icon: <CalendarMonthIcon />,
  },
  {
    title: 'Revisar ingresos',
    helper: 'Confirma conceptos de ingreso antes de asignarlos.',
    path: '/tipo-ingresos',
    icon: <PaymentsIcon />,
  },
  {
    title: 'Revisar descuentos',
    helper: 'Confirma descuentos antes de asignarlos.',
    path: '/descuentos',
    icon: <PaymentsIcon />,
  },
  {
    title: 'Asignar ingresos y descuentos',
    helper: 'Selecciona periodo, empleado, concepto y monto.',
    path: '/nomina-asignaciones',
    icon: <PaymentsIcon />,
  },
  {
    title: 'Generar nomina',
    helper: 'Crea la planilla, revisa totales y envia a aprobacion.',
    path: '/nomina',
    icon: <CalculateIcon />,
  },
  {
    title: 'Consultar reportes',
    helper: 'Descarga respaldos y revisa reportes contables o gerenciales.',
    path: '/reportes',
    icon: <SummarizeIcon />,
    optional: true,
  },
];

const MetricCard = ({ title, value, helper, icon, color, to, disabled }: MetricCardProps) => (
  <Paper elevation={1} sx={{ p: 2, height: '100%', opacity: disabled ? 0.58 : 1 }}>
    <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
      <Box
        sx={{
          width: 44,
          height: 44,
          borderRadius: 2,
          display: 'grid',
          placeItems: 'center',
          bgcolor: color,
          color: 'white',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.1 }}>{value}</Typography>
        <Typography variant="caption" color="text.secondary">{helper}</Typography>
      </Box>
    </Stack>
    <Button
      component={RouterLink}
      to={to}
      size="small"
      disabled={disabled}
      sx={{ mt: 1.5 }}
    >
      Revisar
    </Button>
  </Paper>
);

const normalizarTexto = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const getEmpleadoSesion = (user: unknown, empleados: Empleado[]) => {
  const record = (user && typeof user === 'object' ? user : {}) as Record<string, unknown>;
  const empId = Number(record.emp_id ?? record.EMP_ID);
  if (Number.isFinite(empId) && empId > 0) {
    return empleados.find((empleado) => Number(empleado.EMP_ID) === empId) ?? null;
  }

  const nombreUsuario = normalizarTexto(record.nombre_completo);
  return empleados.find((empleado) =>
    normalizarTexto(`${empleado.EMP_NOMBRE} ${empleado.EMP_APELLIDO}`) === nombreUsuario
  ) ?? null;
};

const isEmpleadoActivoNomina = (empleado: Empleado) => {
  const estado = String(empleado.EMP_ESTADO || 'A').toUpperCase();
  return estado === 'A' && !empleado.EMP_FECHA_LIQUIDACION;
};

const isContratoActual = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value ?? '').trim().toUpperCase();
  return ['1', 'S', 'SI', 'Y', 'YES', 'TRUE', 'A', 'ACTUAL'].includes(normalized);
};

const empleadoTieneContrato = (empleado: Empleado, contratos: EmpleadoContrato[]) => {
  if (empleado.TIC_ID) return true;

  return contratos.some((contrato) => {
    if (Number(contrato.EMP_ID) !== Number(empleado.EMP_ID)) return false;
    const estado = String(contrato.TCO_ESTADO || 'A').toUpperCase();
    return isContratoActual(contrato.TCO_ES_ACTUAL) || estado === 'A';
  });
};

const getNombreEmpleado = (user: unknown, empleado: Empleado | null) => {
  if (empleado) return `${empleado.EMP_NOMBRE} ${empleado.EMP_APELLIDO}`;

  const record = (user && typeof user === 'object' ? user : {}) as Record<string, unknown>;
  const nombre = String(record.nombre_completo ?? '').trim();
  return nombre || 'bienvenido';
};

const getBienvenidaEmpleado = (fecha = new Date()) => {
  const hora = fecha.getHours();

  if (hora < 12) {
    return {
      saludo: 'Buenos dias',
      mensaje: 'Listo para iniciar la jornada con energia: revisa tu horario, marca asistencia y consulta tus pagos desde un solo lugar.',
    };
  }

  if (hora < 18) {
    return {
      saludo: 'Buenas tardes',
      mensaje: 'Tu jornada sigue avanzando: registra tu asistencia, confirma tu horario y mantente al dia con tus pagos.',
    };
  }

  return {
    saludo: 'Buenas noches',
    mensaje: 'Cierra tu jornada con tranquilidad: revisa tus marcajes, tu horario y tus pagos en un solo lugar.',
  };
};

const parseLocalDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const formatFechaLarga = (date: Date) =>
  date.toLocaleDateString('es-GT', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });

const getPaymentDayForMonth = (year: number, month: number, preferredDay: number) => {
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
  return Math.min(preferredDay, lastDayOfMonth);
};

const getProximoPago = (fecha = new Date()) => {
  const today = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  const year = today.getFullYear();
  const month = today.getMonth();
  const day = today.getDate();
  const firstPayDay = 15;
  const secondPayDay = getPaymentDayForMonth(year, month, 30);

  let paymentDate: Date;

  if (day <= firstPayDay) {
    paymentDate = new Date(year, month, firstPayDay);
  } else if (day <= secondPayDay) {
    paymentDate = new Date(year, month, secondPayDay);
  } else {
    paymentDate = new Date(year, month + 1, 15);
  }

  const daysRemaining = Math.max(
    0,
    Math.round((paymentDate.getTime() - today.getTime()) / 86400000)
  );

  return {
    date: paymentDate,
    daysRemaining,
    label: formatFechaLarga(paymentDate),
  };
};

const isDateInRange = (date: Date, start?: string, end?: string) => {
  const startDate = parseLocalDate(start);
  const endDate = parseLocalDate(end);
  if (!startDate || !endDate) return false;

  return date >= startDate && date <= endDate;
};

const getSituacionEmpleado = (
  empleado: Empleado | null,
  controles: ControlLaboral[],
  suspensiones: SuspensionIgss[],
  fecha = new Date()
) => {
  if (!empleado) return null;

  const empId = Number(empleado.EMP_ID);
  const suspensionIgss = suspensiones.find((suspension) =>
    Number(suspension.EMP_ID) === empId &&
    suspension.SUS_ESTADO === 'A' &&
    isDateInRange(fecha, suspension.SUS_FECHA_INICIO, suspension.SUS_FECHA_FIN)
  );

  if (suspensionIgss) {
    const fechaFin = parseLocalDate(suspensionIgss.SUS_FECHA_FIN);
    const regreso = fechaFin ? addDays(fechaFin, 1) : null;
    const tipo = suspensionIgss.SUS_TIPO ? suspensionIgss.SUS_TIPO.toLowerCase() : 'salud';

    return {
      icon: <MedicalServicesIcon />,
      titlePrefix: 'Estamos contigo',
      message: regreso
        ? `Tu suspension IGSS por ${tipo} esta activa. Cuidate con calma; tenemos registrado tu regreso estimado a labores para el ${formatFechaLarga(regreso)}.`
        : 'Tu suspension IGSS esta activa. Cuidate con calma; el equipo esta pendiente de tu recuperacion y seguimiento.',
    };
  }

  const controlActivo = controles.find((control) =>
    Number(control.EMP_ID) === empId &&
    control.CTL_ESTADO === 'A' &&
    isDateInRange(fecha, control.CTL_FECHA_INICIO, control.CTL_FECHA_REGRESO)
  );

  if (!controlActivo) return null;

  const regreso = parseLocalDate(controlActivo.CTL_FECHA_REGRESO);
  const regresoTexto = regreso ? ` Tu regreso a labores esta previsto para el ${formatFechaLarga(regreso)}.` : '';

  if (controlActivo.CTL_MOTIVO === 'VAC') {
    return {
      icon: <BeachAccessIcon />,
      titlePrefix: 'Felices vacaciones',
      message: `Disfruta este descanso, desconectate y recarga energia.${regresoTexto}`,
    };
  }

  if (controlActivo.CTL_MOTIVO === 'ENF') {
    return {
      icon: <MedicalServicesIcon />,
      titlePrefix: 'Pronta recuperacion',
      message: `Tu ausencia por salud esta registrada. Toma el tiempo necesario para recuperarte.${regresoTexto}`,
    };
  }

  if (controlActivo.CTL_MOTIVO === 'SUS') {
    return {
      icon: <ScheduleIcon />,
      titlePrefix: 'Ausencia registrada',
      message: `Tu suspension laboral esta registrada en el sistema.${regresoTexto}`,
    };
  }

  if (controlActivo.CTL_MOTIVO === 'PER') {
    return {
      icon: <ScheduleIcon />,
      titlePrefix: 'Permiso registrado',
      message: `Tu permiso esta aprobado y registrado en el sistema.${regresoTexto}`,
    };
  }

  return {
    icon: <ScheduleIcon />,
    titlePrefix: 'Ausencia registrada',
    message: `Tu control laboral esta activo y registrado en el sistema.${regresoTexto}`,
  };
};

const EmployeeActionCard = ({ title, helper, icon, to, color }: Omit<MetricCardProps, 'value'>) => (
  <Paper
    component={RouterLink}
    to={to}
    elevation={1}
    sx={{
      p: 2.25,
      height: '100%',
      display: 'block',
      textDecoration: 'none',
      color: 'inherit',
      border: '1px solid',
      borderColor: 'divider',
      transition: 'transform 140ms ease, box-shadow 140ms ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: 4,
      },
    }}
  >
    <Box sx={{ width: 46, height: 46, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: color, color: 'white', mb: 2 }}>
      {icon}
    </Box>
    <Typography variant="h6" sx={{ fontWeight: 800 }}>{title}</Typography>
    <Typography variant="body2" color="text.secondary">{helper}</Typography>
  </Paper>
);

function Home() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [controles, setControles] = useState<ControlLaboral[]>([]);
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [contratos, setContratos] = useState<EmpleadoContrato[]>([]);
  const [suspensionesIgss, setSuspensionesIgss] = useState<SuspensionIgss[]>([]);
  const [error, setError] = useState('');
  const { canAccessPath, user } = useAuth();
  const { startGuide } = usePayrollGuide();
  const esEmpleado = isRole(user as any, 'empleado');

  useEffect(() => {
    const cargarDashboard = async () => {
      setError('');

      if (esEmpleado) {
        const [empleadosRes, controlesRes, suspensionesRes] = await Promise.allSettled([
          obtenerEmpleados(),
          obtenerControles(),
          obtenerSuspensionesIgss(),
        ]);
        if (empleadosRes.status === 'fulfilled') setEmpleados(empleadosRes.value);
        if (controlesRes.status === 'fulfilled') setControles(controlesRes.value);
        if (suspensionesRes.status === 'fulfilled') setSuspensionesIgss(suspensionesRes.value);
        if ([empleadosRes, controlesRes, suspensionesRes].some((item) => item.status === 'rejected')) {
          setError('No pudimos cargar todos tus datos de asistencia por ahora.');
        }
        return;
      }

      const [empleadosRes, controlesRes, cuentasRes, contratosRes] = await Promise.allSettled([
        obtenerEmpleados(),
        obtenerControles(),
        obtenerCuentas(),
        obtenerContratos(),
      ]);

      if (empleadosRes.status === 'fulfilled') setEmpleados(empleadosRes.value);
      if (controlesRes.status === 'fulfilled') setControles(controlesRes.value);
      if (cuentasRes.status === 'fulfilled') setCuentas(cuentasRes.value);
      if (contratosRes.status === 'fulfilled') setContratos(contratosRes.value);

      if ([empleadosRes, controlesRes, cuentasRes, contratosRes].some((item) => item.status === 'rejected')) {
        setError('Algunos indicadores no pudieron cargarse. Puedes continuar desde los pasos disponibles.');
      }
    };

    cargarDashboard();
  }, [esEmpleado]);

  const metrics = useMemo(() => {
    const empleadosActivosNomina = empleados.filter(isEmpleadoActivoNomina);
    const empleadosActivos = empleadosActivosNomina.length;
    const empleadosSinCuenta = empleadosActivosNomina.filter(
      (emp) => !cuentas.some((cuenta) => Number(cuenta.EMP_ID) === Number(emp.EMP_ID))
    ).length;
    const empleadosSinContrato = empleadosActivosNomina.filter(
      (emp) => !empleadoTieneContrato(emp, contratos)
    ).length;
    const controlesPendientes = controles.filter((control) => control.CTL_ESTADO === 'P').length;
    const progresoBase = [
      empleadosActivos > 0,
      empleadosSinCuenta === 0 && empleadosActivos > 0,
      empleadosSinContrato === 0 && empleadosActivos > 0,
      controlesPendientes === 0,
      canAccessPath('/nomina'),
    ];

    return {
      empleadosActivos,
      empleadosSinCuenta,
      empleadosSinContrato,
      controlesPendientes,
      progreso: Math.round((progresoBase.filter(Boolean).length / progresoBase.length) * 100),
    };
  }, [canAccessPath, contratos, controles, cuentas, empleados]);

  const visibleSteps = payrollSteps.filter((step) => canAccessPath(step.path));
  const activeStep = visibleSteps.findIndex((step) => step.path === '/nomina');
  const empleadoSesion = useMemo(() => getEmpleadoSesion(user, empleados), [empleados, user]);
  const nombreEmpleado = useMemo(() => getNombreEmpleado(user, empleadoSesion), [empleadoSesion, user]);
  const bienvenidaEmpleado = useMemo(() => getBienvenidaEmpleado(), []);
  const situacionEmpleado = useMemo(
    () => getSituacionEmpleado(empleadoSesion, controles, suspensionesIgss),
    [controles, empleadoSesion, suspensionesIgss]
  );
  const proximoPago = useMemo(() => getProximoPago(), []);

  if (esEmpleado) {
    return (
      <Box sx={{ py: 1 }} data-skip-unsaved="true">
        <PageHeader
          title={`${situacionEmpleado?.titlePrefix ?? bienvenidaEmpleado.saludo}, ${nombreEmpleado}`}
          subtitle={situacionEmpleado?.message ?? bienvenidaEmpleado.mensaje}
          icon={situacionEmpleado?.icon ?? <PeopleIcon />}
          meta={
            <>
              <Chip
                icon={<CalendarMonthIcon />}
                label={new Date().toLocaleDateString('es-GT', { weekday: 'long', day: '2-digit', month: 'long' })}
                color="primary"
                variant="outlined"
              />
              <Chip
                icon={<PaymentsIcon />}
                label={`Proximo pago: ${proximoPago.label}`}
                color="success"
                variant="outlined"
              />
            </>
          }
        />

        {error ? <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert> : null}

        <Paper
          elevation={1}
          sx={{
            p: 2.25,
            mb: 2,
            border: '1px solid',
            borderColor: 'success.light',
            bgcolor: 'rgba(46, 125, 50, 0.06)',
          }}
        >
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            sx={{ alignItems: { xs: 'flex-start', md: 'center' }, justifyContent: 'space-between' }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: 2,
                  display: 'grid',
                  placeItems: 'center',
                  bgcolor: 'success.main',
                  color: 'white',
                  flexShrink: 0,
                }}
              >
                <PaymentsIcon />
              </Box>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Proximo pago
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, lineHeight: 1.1 }}>
                  {proximoPago.label}
                </Typography>
              </Box>
            </Stack>
            <Chip
              color={proximoPago.daysRemaining === 0 ? 'success' : 'primary'}
              label={
                proximoPago.daysRemaining === 0
                  ? 'Programado para hoy'
                  : `Faltan ${proximoPago.daysRemaining} dias`
              }
              sx={{ fontWeight: 800 }}
            />
          </Stack>
        </Paper>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <EmployeeActionCard
              title="Marcar asistencia"
              helper="Registra tu entrada o salida dentro de la ventana permitida por tu horario."
              icon={<AccessTimeIcon />}
              color="#1976d2"
              to="/marcajes"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <EmployeeActionCard
              title="Mi horario"
              helper="Consulta tu jornada asignada, horas de entrada y salida, y dias laborales."
              icon={<ScheduleIcon />}
              color="#0288d1"
              to="/horarios"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <EmployeeActionCard
              title="Boletas de Pago"
              helper="Consulta y descarga tus boletas generadas por periodo."
              icon={<ReceiptLongIcon />}
              color="#2e7d32"
              to="/nomina-detalle"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <EmployeeActionCard
              title="Mis resultados KPI"
              helper="Consulta tus bonos de productividad y resultados registrados."
              icon={<AssessmentIcon />}
              color="#7b1fa2"
              to="/kpi-resultado"
            />
          </Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      <PageHeader
        title="Guia de nomina"
        subtitle="Sigue el flujo de trabajo de izquierda a derecha hasta generar y revisar la planilla."
        icon={<PlaylistAddCheckIcon />}
        meta={
          <>
            <Chip icon={<CheckCircleIcon />} label={`${metrics.progreso}% preparado`} color="primary" />
            <Chip label={`${empleados.length} empleados`} />
            <Chip color={metrics.controlesPendientes ? 'warning' : 'success'} label={`${metrics.controlesPendientes} pendientes`} />
          </>
        }
      />

      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Box sx={{ mt: 3 }}>
          <LinearProgress variant="determinate" value={metrics.progreso} sx={{ height: 8, borderRadius: 1 }} />
        </Box>

        {error ? <Alert severity="warning" sx={{ mt: 2 }}>{error}</Alert> : null}

        {visibleSteps.length > 0 ? (
          <Stepper
            nonLinear
            activeStep={activeStep >= 0 ? activeStep : 0}
            sx={{ mt: 3, overflowX: 'auto', pb: 1 }}
          >
            {visibleSteps.map((step, index) => (
              <Step key={step.path} completed={index < Math.max(activeStep, 0)}>
                <StepButton component={RouterLink} to={step.path} icon={step.icon}>
                  <StepLabel optional={step.optional ? <Typography variant="caption">Opcional</Typography> : undefined}>
                    {step.title}
                  </StepLabel>
                </StepButton>
              </Step>
            ))}
          </Stepper>
        ) : (
          <Alert severity="info" sx={{ mt: 3 }}>No tienes vistas habilitadas para el flujo de nomina.</Alert>
        )}

        <Button
          variant="contained"
          startIcon={<CalculateIcon />}
          disabled={!visibleSteps.length}
          onClick={startGuide}
          sx={{ mt: 3 }}
        >
          Empezar flujo guiado
        </Button>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard
            title="Empleados activos"
            value={metrics.empleadosActivos}
            helper="Base para generar nomina"
            icon={<PeopleIcon />}
            color="#1976d2"
            to="/empleados"
            disabled={!canAccessPath('/empleados')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard
            title="Sin cuenta bancaria"
            value={metrics.empleadosSinCuenta}
            helper="Completar antes de pagar"
            icon={<AccountBalanceIcon />}
            color="#0288d1"
            to="/cuenta-bancaria"
            disabled={!canAccessPath('/cuenta-bancaria')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard
            title="Sin contrato"
            value={metrics.empleadosSinContrato}
            helper="Revisar expediente laboral"
            icon={<BadgeIcon />}
            color="#6d4c41"
            to="/empleado-contrato"
            disabled={!canAccessPath('/empleado-contrato')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 3 }}>
          <MetricCard
            title="Pendientes laborales"
            value={metrics.controlesPendientes}
            helper="Permisos o vacaciones por resolver"
            icon={<AccessTimeIcon />}
            color="#ed6c02"
            to="/control-laboral"
            disabled={!canAccessPath('/control-laboral')}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Home;
