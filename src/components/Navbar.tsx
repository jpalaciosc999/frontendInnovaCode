import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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
  Chip,
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
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BadgeIcon from '@mui/icons-material/Badge';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupIcon from '@mui/icons-material/Group';
import InsightsIcon from '@mui/icons-material/Insights';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import ScheduleIcon from '@mui/icons-material/Schedule';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import GavelIcon from '@mui/icons-material/Gavel';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PercentIcon from '@mui/icons-material/Percent';
import FolderIcon from '@mui/icons-material/Folder';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SummarizeIcon from '@mui/icons-material/Summarize';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import ApprovalIcon from '@mui/icons-material/Approval';
import UserRoleSelector from './UserRoleSelector';
import {
  AUTH_USER_CHANGED_EVENT,
  appViews,
  getCurrentUserRole,
  roleLabels,
  roleOrder,
} from '../config/roleViews';
import type { AppRole } from '../config/roleViews';

type MenuItemType = {
  text: string;
  path: string;
  icon: ReactNode;
};

type MenuSectionType = {
  key: string;
  text: string;
  icon: ReactNode;
  items: MenuItemType[];
};

const viewIcons: Record<string, ReactNode> = {
  marcaje: <FactCheckIcon />,
  'resumen-marcaje': <SummarizeIcon />,
  'registro-empleados': <PeopleIcon />,
  departamentos: <BusinessIcon />,
  puestos: <WorkIcon />,
  sucursales: <ApartmentIcon />,
  horarios: <ScheduleIcon />,
  'cuenta-bancaria': <AccountBalanceIcon />,
  kpis: <InsightsIcon />,
  'kpi-resultado': <QueryStatsIcon />,
  'suspensiones-igss': <MedicalServicesIcon />,
  'registro-vacaciones': <EventAvailableIcon />,
  'control-laboral': <AccessTimeIcon />,
  'empleado-contrato': <BadgeIcon />,
  'tipo-contrato': <BadgeIcon />,
  'asignacion-roles': <AccountTreeIcon />,
  'asignacion-permisos': <SecurityIcon />,
  'registro-usuarios': <GroupIcon />,
  'roles-permisos': <AdminPanelSettingsIcon />,
  bitacora: <HistoryIcon />,
  'usuario-bitacora': <EditNoteIcon />,
  nomina: <DescriptionIcon />,
  'nomina-detalle': <AssignmentIcon />,
  periodos: <CalendarMonthIcon />,
  'tipo-ingresos': <PaymentsIcon />,
  descuentos: <PercentIcon />,
  isr: <PercentIcon />,
  irtra: <PercentIcon />,
  intecap: <PercentIcon />,
  prestamos: <PaymentsIcon />,
  'prestamo-detalle': <ReceiptLongIcon />,
  liquidacion: <DescriptionIcon />,
  'calculadora-igss': <HealthAndSafetyIcon />,
  'calculadora-isr': <GavelIcon />,
  'tipos-descuento': <PercentIcon />,
  'prestamos-banco': <AccountBalanceIcon />,
  'generar-csv': <DescriptionIcon />,
  'aprobacion-nomina': <ApprovalIcon />,
};

const buildMenuSections = (currentRole: AppRole | null): MenuSectionType[] =>
  roleOrder
    .filter((role) => !currentRole || currentRole === 'SUPREMO' || role === currentRole)
    .map((role) => ({
      key: role,
      text: `Rol ${roleLabels[role]}`,
      icon: <FolderIcon />,
      items: appViews
        .filter((view) => view.roles.includes(role))
        .map((view) => ({
          text: view.text,
          path: view.path,
          icon: viewIcons[view.key] ?? <FolderIcon />,
        })),
    }))
    .filter((section) => section.items.length > 0);

function Navbar() {
  const [open, setOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(getCurrentUserRole());
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    EMPLEADO: true,
    RRHH: true,
    ADMIN: true,
    CONTABILIDAD: true,
    GERENTE: true,
  });

  const location = useLocation();
  const menuSections = useMemo(() => buildMenuSections(currentRole), [currentRole]);

  useEffect(() => {
    const syncCurrentRole = () => setCurrentRole(getCurrentUserRole());

    window.addEventListener(AUTH_USER_CHANGED_EVENT, syncCurrentRole);
    window.addEventListener('storage', syncCurrentRole);

    return () => {
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, syncCurrentRole);
      window.removeEventListener('storage', syncCurrentRole);
    };
  }, []);

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
              Menu principal
            </Typography>
            {currentRole ? (
              <Chip size="small" label={`Rol: ${roleLabels[currentRole]}`} sx={{ mt: 1 }} />
            ) : (
              <Typography variant="body2" color="text.secondary">
                Navegacion del sistema
              </Typography>
            )}
          </Box>

          <Divider />

          <List>
            <Box sx={{ px: 2, py: 1.5 }}>
              <UserRoleSelector onUserChanged={() => setCurrentRole(getCurrentUserRole())} />
            </Box>

            <Divider sx={{ my: 0.5 }} />

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
