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
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PaymentsIcon from '@mui/icons-material/Payments';
import CalculateIcon from '@mui/icons-material/Calculate';
import SummarizeIcon from '@mui/icons-material/Summarize';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import type { Empleado } from '../interfaces/empleados';
import type { ControlLaboral } from '../interfaces/controlLaboral';
import type { CuentaBancaria } from '../interfaces/cuentaBancaria';
import type { EmpleadoContrato } from '../interfaces/empleado_contrato';

import { obtenerEmpleados } from '../services/empleados.service';
import { obtenerControles } from '../services/controlLaboral.service';
import { obtenerCuentas } from '../services/cuentaBancaria.service';
import { obtenerContratos } from '../services/empleado_contrato.service';
import { useAuth } from '../context/AuthContext';

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
    title: 'Configurar ingresos y descuentos',
    helper: 'Confirma conceptos, descuentos, prestamos e ingresos variables.',
    path: '/tipo-ingresos',
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

function Home() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [controles, setControles] = useState<ControlLaboral[]>([]);
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [contratos, setContratos] = useState<EmpleadoContrato[]>([]);
  const [error, setError] = useState('');
  const { canAccessPath } = useAuth();

  useEffect(() => {
    const cargarDashboard = async () => {
      setError('');

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
  }, []);

  const metrics = useMemo(() => {
    const empleadosActivos = empleados.filter((emp) => emp.EMP_ESTADO === 'A').length;
    const empleadosSinCuenta = empleados.filter(
      (emp) => !cuentas.some((cuenta) => cuenta.EMP_ID === emp.EMP_ID)
    ).length;
    const empleadosSinContrato = empleados.filter(
      (emp) => !contratos.some((contrato) => Number(contrato.TIC_ID) === emp.EMP_ID)
    ).length;
    const controlesPendientes = controles.filter((control) => control.CTL_ESTADO === 'P').length;
    const progresoBase = [
      empleadosActivos > 0,
      empleadosSinCuenta === 0 && empleados.length > 0,
      empleadosSinContrato === 0 && empleados.length > 0,
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
  const startPath = visibleSteps[0]?.path || '/';

  return (
    <Box sx={{ py: 1 }}>
      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>Guia de nomina</Typography>
            <Typography color="text.secondary">
              Sigue el flujo de trabajo de izquierda a derecha hasta generar y revisar la planilla.
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip icon={<CheckCircleIcon />} label={`${metrics.progreso}% preparado`} color="primary" />
            <Chip label={`${empleados.length} empleados`} />
            <Chip color={metrics.controlesPendientes ? 'warning' : 'success'} label={`${metrics.controlesPendientes} pendientes`} />
          </Stack>
        </Stack>

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
          component={RouterLink}
          to={startPath}
          variant="contained"
          startIcon={<CalculateIcon />}
          disabled={!visibleSteps.length}
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
