import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';

import PeopleIcon from '@mui/icons-material/People';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import BadgeIcon from '@mui/icons-material/Badge';
import ScheduleIcon from '@mui/icons-material/Schedule';

import type { Empleado } from '../interfaces/empleados';
import type { ControlLaboral } from '../interfaces/controlLaboral';
import type { CuentaBancaria } from '../interfaces/cuentaBancaria';
import type { EmpleadoContrato } from '../interfaces/empleado_contrato';

import { obtenerEmpleados } from '../services/empleados.service';
import { obtenerControles } from '../services/controlLaboral.service';
import { obtenerCuentas } from '../services/cuentaBancaria.service';
import { obtenerContratos } from '../services/empleado_contrato.service';
import { getCurrentUserRole } from '../config/roleViews';

type MetricCardProps = {
  title: string;
  value: number;
  helper: string;
  icon: ReactNode;
  color: string;
  to: string;
};

const MetricCard = ({ title, value, helper, icon, color, to }: MetricCardProps) => (
  <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
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
    <Button component={RouterLink} to={to} size="small" sx={{ mt: 1.5 }}>
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
  const currentRole = getCurrentUserRole();

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
        setError('Algunos indicadores no pudieron cargarse. Las vistas principales siguen disponibles.');
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
    const vacacionesPendientes = controles.filter(
      (control) => control.CTL_MOTIVO === 'VAC' && control.CTL_ESTADO === 'P'
    ).length;

    return {
      empleadosActivos,
      empleadosSinCuenta,
      empleadosSinContrato,
      controlesPendientes,
      vacacionesPendientes,
    };
  }, [contratos, controles, cuentas, empleados]);

  if (currentRole !== 'RRHH' && currentRole !== 'SUPREMO') {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>Inicio</Typography>
        <Typography color="text.secondary">Selecciona una opcion del menu para comenzar.</Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ py: 1 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ mb: 3, justifyContent: 'space-between' }}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>Dashboard RRHH</Typography>
          <Typography color="text.secondary">Resumen operativo para revisar pendientes importantes.</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
          <Chip label={`${empleados.length} empleados registrados`} />
          <Chip color="warning" label={`${metrics.controlesPendientes} controles pendientes`} />
        </Stack>
      </Stack>

      {error ? <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert> : null}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            title="Empleados activos"
            value={metrics.empleadosActivos}
            helper="Personal disponible en sistema"
            icon={<PeopleIcon />}
            color="#1976d2"
            to="/empleados"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            title="Controles pendientes"
            value={metrics.controlesPendientes}
            helper="Permisos, vacaciones u otros por revisar"
            icon={<AccessTimeIcon />}
            color="#ed6c02"
            to="/control-laboral"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            title="Vacaciones pendientes"
            value={metrics.vacacionesPendientes}
            helper="Solicitudes esperando aprobacion"
            icon={<EventAvailableIcon />}
            color="#2e7d32"
            to="/registro-vacaciones"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            title="Sin cuenta bancaria"
            value={metrics.empleadosSinCuenta}
            helper="Empleados que necesitan cuenta registrada"
            icon={<AccountBalanceIcon />}
            color="#0288d1"
            to="/cuenta-bancaria"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            title="Sin contrato"
            value={metrics.empleadosSinContrato}
            helper="Empleados sin contrato asociado"
            icon={<BadgeIcon />}
            color="#6d4c41"
            to="/empleado-contrato"
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <MetricCard
            title="Horarios"
            value={empleados.filter((emp) => Boolean(emp.HOR_ID)).length}
            helper="Empleados con horario asignado"
            icon={<ScheduleIcon />}
            color="#7b1fa2"
            to="/horarios"
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Home;
