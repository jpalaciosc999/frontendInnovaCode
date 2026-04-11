import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Divider,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import SecurityIcon from '@mui/icons-material/Security';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BadgeIcon from '@mui/icons-material/Badge';
import ApartmentIcon from '@mui/icons-material/Apartment';
import HistoryIcon from '@mui/icons-material/History';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupIcon from '@mui/icons-material/Group';
import PersonIcon from '@mui/icons-material/Person';
import EditNoteIcon from '@mui/icons-material/EditNote';
import InsightsIcon from '@mui/icons-material/Insights';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import ScheduleIcon from '@mui/icons-material/Schedule';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import GavelIcon from '@mui/icons-material/Gavel';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PercentIcon from '@mui/icons-material/Percent';
import DownloadIcon from '@mui/icons-material/Download';

type MenuItemType = {
  text: string;
  path: string;
  icon: React.ReactNode;
  dividerBefore?: boolean;
};

const menuItems: MenuItemType[] = [
  // ── General ──────────────────────────────────────────────────────────────
  { text: 'Inicio', path: '/', icon: <HomeIcon /> },

  // ── Empleados ─────────────────────────────────────────────────────────────
  { text: 'Empleados', path: '/empleados', icon: <PeopleIcon />, dividerBefore: true },
  { text: 'Departamentos', path: '/departamentos', icon: <BusinessIcon /> },
  { text: 'Puestos', path: '/puestos', icon: <WorkIcon /> },
  { text: 'Tipo Contrato', path: '/tipo-contrato', icon: <PersonIcon /> },
  { text: 'Empleado Contrato', path: '/empleado-contrato', icon: <BadgeIcon /> },
  { text: 'Sede', path: '/sede', icon: <ApartmentIcon /> },

  // ── Accesos ───────────────────────────────────────────────────────────────
  { text: 'Usuarios', path: '/usuarios', icon: <GroupIcon />, dividerBefore: true },
  { text: 'Roles', path: '/roles', icon: <AccountTreeIcon /> },
  { text: 'Permisos', path: '/permisos', icon: <SecurityIcon /> },
  { text: 'Rol Permisos', path: '/rol-permisos', icon: <AdminPanelSettingsIcon /> },

  // ── Nómina ────────────────────────────────────────────────────────────────
  { text: 'Nómina', path: '/nomina', icon: <DescriptionIcon />, dividerBefore: true },
  { text: 'Nómina Detalle', path: '/nomina-detalle', icon: <AssignmentIcon /> },
  { text: 'Periodo', path: '/periodo', icon: <CalendarMonthIcon /> },
  { text: 'Ingresos', path: '/tipo-ingresos', icon: <TrendingUpIcon /> },
  { text: 'Descuentos', path: '/descuentos', icon: <MoneyOffIcon /> },
  { text: 'Liquidación', path: '/liquidacion', icon: <DescriptionIcon /> },

  // ── Calculadoras ──────────────────────────────────────────────────────────
  { text: 'Calculadora IGSS', path: '/calculadora-igss', icon: <HealthAndSafetyIcon />, dividerBefore: true },
  { text: 'Calculadora ISR', path: '/calculadora-isr', icon: <GavelIcon /> },
  { text: 'Suspensiones IGSS', path: '/suspensiones-igss', icon: <MedicalServicesIcon /> },
  { text: 'Tipos Descuento', path: '/tipos-descuento', icon: <PercentIcon /> },
  { text: 'Generar CSV Depósito', path: '/generar-csv', icon: <DownloadIcon /> },

  // ── Préstamos ─────────────────────────────────────────────────────────────
  { text: 'Préstamos', path: '/prestamos', icon: <PaymentsIcon />, dividerBefore: true },
  { text: 'Detalle Préstamo', path: '/prestamo-detalle', icon: <ReceiptLongIcon /> },
  { text: 'Préstamos Banco', path: '/prestamos-banco', icon: <AccountBalanceIcon /> },

  // ── Control laboral ───────────────────────────────────────────────────────
  { text: 'Marcajes', path: '/marcajes', icon: <FactCheckIcon />, dividerBefore: true },
  { text: 'Control Laboral', path: '/control-laboral', icon: <AccessTimeIcon /> },
  { text: 'Horarios', path: '/horarios', icon: <ScheduleIcon /> },
  { text: 'Cuenta Bancaria', path: '/cuenta-bancaria', icon: <AccountBalanceIcon /> },

  // ── KPIs ──────────────────────────────────────────────────────────────────
  { text: 'KPIs', path: '/kpis', icon: <InsightsIcon />, dividerBefore: true },
  { text: 'Resultados KPI', path: '/kpi-resultado', icon: <QueryStatsIcon /> },

  // ── Auditoría ─────────────────────────────────────────────────────────────
  { text: 'Bitácora', path: '/bitacora', icon: <HistoryIcon />, dividerBefore: true },
  { text: 'Usuario Bitácora', path: '/usuario-bitacora', icon: <EditNoteIcon /> },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const toggleDrawer = (state: boolean) => () => {
    setOpen(state);
  };

  return (
    <>
      <AppBar position="sticky" elevation={2}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Frontend Innova
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={open} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 290 }} role="presentation" onClick={toggleDrawer(false)}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Menú principal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Navegación del sistema
            </Typography>
          </Box>

          <Divider />

          <List>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;

              return (
                <Box key={item.path}>
                  {item.dividerBefore && <Divider sx={{ my: 0.5 }} />}
                  <ListItemButton
                    component={NavLink}
                    to={item.path}
                    selected={isActive}
                    sx={{
                      mx: 1,
                      my: 0.5,
                      borderRadius: 2,
                      '&.Mui-selected': {
                        backgroundColor: 'primary.main',
                        color: 'white',
                      },
                      '&.Mui-selected .MuiListItemIcon-root': {
                        color: 'white',
                      },
                      '&:hover': {
                        backgroundColor: isActive ? 'primary.dark' : 'action.hover',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive ? 'white' : 'inherit',
                        minWidth: 40,
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </Box>
              );
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default Navbar;