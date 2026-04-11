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
  Collapse,
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
import FolderIcon from '@mui/icons-material/Folder';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

type MenuItemType = {
  text: string;
  path: string;
  icon: React.ReactNode;
};

type MenuSectionType = {
  key: string;
  text: string;
  icon: React.ReactNode;
  items: MenuItemType[];
};

const menuSections: MenuSectionType[] = [
  {
    key: 'configuracion',
    text: 'Configuración Inicial',
    icon: <FolderIcon />,
    items: [
      { text: 'Empleados', path: '/empleados', icon: <PeopleIcon /> },
      { text: 'Usuarios', path: '/usuarios', icon: <GroupIcon /> },
      { text: 'Roles', path: '/roles', icon: <AccountTreeIcon /> },
      { text: 'Permisos', path: '/permisos', icon: <SecurityIcon /> },
      { text: 'Rol Permisos', path: '/rol-permisos', icon: <AdminPanelSettingsIcon /> },
      { text: 'Departamentos', path: '/departamentos', icon: <BusinessIcon /> },
      { text: 'Puestos', path: '/puestos', icon: <WorkIcon /> },
      { text: 'Sede', path: '/sede', icon: <ApartmentIcon /> },
      { text: 'Horarios', path: '/horarios', icon: <ScheduleIcon /> },
      { text: 'Tipo Contrato', path: '/tipo-contrato', icon: <PersonIcon /> },
      { text: 'Empleado Contrato', path: '/empleado-contrato', icon: <BadgeIcon /> },
      { text: 'Cuenta Bancaria', path: '/cuenta-bancaria', icon: <AccountBalanceIcon /> },
      { text: 'Tipos Descuento', path: '/tipos-descuento', icon: <PercentIcon /> },
    ],
  },
  {
    key: 'nomina',
    text: 'Nómina',
    icon: <FolderIcon />,
    items: [
      { text: 'Nómina', path: '/nomina', icon: <DescriptionIcon /> },
      { text: 'Nómina Detalle', path: '/nomina-detalle', icon: <AssignmentIcon /> },
      { text: 'Periodo', path: '/periodo', icon: <CalendarMonthIcon /> },
      { text: 'Ingresos', path: '/tipo-ingresos', icon: <TrendingUpIcon /> },
      { text: 'Descuentos', path: '/descuentos', icon: <MoneyOffIcon /> },
      { text: 'Liquidación', path: '/liquidacion', icon: <DescriptionIcon /> },
    ],
  },
  {
    key: 'operaciones',
    text: 'Operaciones',
    icon: <FolderIcon />,
    items: [
      { text: 'Marcajes', path: '/marcajes', icon: <FactCheckIcon /> },
      { text: 'Control Laboral', path: '/control-laboral', icon: <AccessTimeIcon /> },
      { text: 'Préstamos', path: '/prestamos', icon: <PaymentsIcon /> },
      { text: 'Detalle Préstamo', path: '/prestamo-detalle', icon: <ReceiptLongIcon /> },
      { text: 'Préstamos Banco', path: '/prestamos-banco', icon: <AccountBalanceIcon /> },
    ],
  },
  {
    key: 'calculos',
    text: 'Cálculos y Procesos',
    icon: <FolderIcon />,
    items: [
      { text: 'Calculadora IGSS', path: '/calculadora-igss', icon: <HealthAndSafetyIcon /> },
      { text: 'Calculadora ISR', path: '/calculadora-isr', icon: <GavelIcon /> },
      { text: 'Suspensiones IGSS', path: '/suspensiones-igss', icon: <MedicalServicesIcon /> },
      { text: 'Generar CSV Depósito', path: '/generar-csv', icon: <DownloadIcon /> },
    ],
  },
  {
    key: 'reportes',
    text: 'Indicadores y Reportes',
    icon: <FolderIcon />,
    items: [
      { text: 'KPIs', path: '/kpis', icon: <InsightsIcon /> },
      { text: 'Resultados KPI', path: '/kpi-resultado', icon: <QueryStatsIcon /> },
    ],
  },
  {
    key: 'auditoria',
    text: 'Auditoría',
    icon: <FolderIcon />,
    items: [
      { text: 'Bitácora', path: '/bitacora', icon: <HistoryIcon /> },
      { text: 'Usuario Bitácora', path: '/usuario-bitacora', icon: <EditNoteIcon /> },
    ],
  },
];

function Navbar() {
  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    configuracion: true,
    nomina: true,
    operaciones: true,
    calculos: false,
    reportes: false,
    auditoria: false,
  });

  const location = useLocation();

  const toggleDrawer = (state: boolean) => () => {
    setOpen(state);
  };

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getMenuItemSx = (isActive: boolean, extraSx = {}) => ({
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
    ...extraSx,
  });

  const renderSubItem = (item: MenuItemType) => {
    const isActive = location.pathname === item.path;

    return (
      <ListItemButton
        key={item.path}
        component={NavLink}
        to={item.path}
        selected={isActive}
        onClick={toggleDrawer(false)}
        sx={getMenuItemSx(isActive, { pl: 4 })}
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
    );
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
        <Box sx={{ width: 310 }} role="presentation">
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
            <ListItemButton
              component={NavLink}
              to="/"
              selected={location.pathname === '/'}
              onClick={toggleDrawer(false)}
              sx={getMenuItemSx(location.pathname === '/')}
            >
              <ListItemIcon
                sx={{
                  color: location.pathname === '/' ? 'white' : 'inherit',
                  minWidth: 40,
                }}
              >
                <HomeIcon />
              </ListItemIcon>
              <ListItemText primary="Inicio" />
            </ListItemButton>

            <Divider sx={{ my: 0.5 }} />

            {menuSections.map((section) => {
              const isSectionActive = section.items.some(
                (item) => item.path === location.pathname
              );

              return (
                <Box key={section.key}>
                  <ListItemButton
                    onClick={() => toggleSection(section.key)}
                    selected={isSectionActive}
                    sx={getMenuItemSx(isSectionActive)}
                  >
                    <ListItemIcon
                      sx={{
                        color: isSectionActive ? 'white' : 'inherit',
                        minWidth: 40,
                      }}
                    >
                      {section.icon}
                    </ListItemIcon>
                    <ListItemText primary={section.text} />
                    {openSections[section.key] ? <ExpandLess /> : <ExpandMore />}
                  </ListItemButton>

                  <Collapse in={openSections[section.key]} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {section.items.map(renderSubItem)}
                    </List>
                  </Collapse>

                  <Divider sx={{ my: 0.5 }} />
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
