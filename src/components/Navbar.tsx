import { useMemo, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
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
  Stack,
  Avatar,
} from '@mui/material';

import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
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
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import PercentIcon from '@mui/icons-material/Percent';
import FolderIcon from '@mui/icons-material/Folder';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SummarizeIcon from '@mui/icons-material/Summarize';
import ApprovalIcon from '@mui/icons-material/Approval';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import GavelIcon from '@mui/icons-material/Gavel';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import DownloadIcon from '@mui/icons-material/Download';
import { appViews } from '../config/roleViews';
import { useAuth } from '../context/AuthContext';
import { useUnsavedChanges } from '../context/UnsavedChangesContext';

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

const reportPaths = [
  '/reporte-marcajes',
  '/reporte-igss',
  '/reporte-isr',
  '/reporte-aguinaldo',
  '/reporte-vacaciones',
  '/reporte-descuentos',
  '/reporte-liquidacion',
  '/reporte-kpi',
  '/reporte-horas-extra',
  '/dashboard-ejecutivo',
];

const viewIcons: Record<string, ReactNode> = {
  marcaje: <FactCheckIcon />,
  'resumen-marcaje': <SummarizeIcon />,
  'reporte-marcajes': <SummarizeIcon />,
  'registro-empleados': <PeopleIcon />,
  departamentos: <BusinessIcon />,
  puestos: <WorkIcon />,
  sucursales: <ApartmentIcon />,
  horarios: <ScheduleIcon />,
  'cuenta-bancaria': <AccountBalanceIcon />,
  kpis: <InsightsIcon />,
  'kpi-resultado': <QueryStatsIcon />,
  'suspensiones-igss': <MedicalServicesIcon />,
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
  'nomina-asignaciones': <AssignmentIcon />,
  'nomina-detalle': <AssignmentIcon />,
  periodos: <CalendarMonthIcon />,
  'tipo-ingresos': <PaymentsIcon />,
  descuentos: <PercentIcon />,
  isr: <PercentIcon />,
  irtra: <PercentIcon />,
  intecap: <PercentIcon />,
  prestamos: <PaymentsIcon />,
  liquidacion: <DescriptionIcon />,
  'calculadora-igss': <HealthAndSafetyIcon />,
  'calculadora-isr': <GavelIcon />,
  'reporte-igss': <SummarizeIcon />,
  'reporte-isr': <SummarizeIcon />,
  'reporte-aguinaldo': <SummarizeIcon />,
  'reporte-vacaciones': <SummarizeIcon />,
  'reporte-descuentos': <SummarizeIcon />,
  'reporte-kpi':          <SummarizeIcon />,
  'reporte-horas-extra':  <SummarizeIcon />,
  'reporte-liquidacion':  <SummarizeIcon />,
  'dashboard-ejecutivo': <SummarizeIcon />,
  'generar-csv': <DownloadIcon />,
  'tipos-descuento': <PercentIcon />,
  'prestamos-banco': <AccountBalanceIcon />,
  'aprobacion-nomina': <ApprovalIcon />,
};

const reportViewKeys = new Set([
  'reportes',
  'reporte-marcajes',
  'reporte-igss',
  'reporte-isr',
  'reporte-aguinaldo',
  'reporte-vacaciones',
  'reporte-descuentos',
  'reporte-kpi',
  'reporte-horas-extra',
  'reporte-liquidacion',
  'dashboard-ejecutivo',
]);

const processSections: Array<{ key: string; text: string; icon: ReactNode; viewKeys: string[] }> = [
  {
    key: 'guia',
    text: 'Flujo de nomina',
    icon: <PlaylistAddCheckIcon />,
    viewKeys: [
      'registro-empleados',
      'empleado-contrato',
      'cuenta-bancaria',
      'control-laboral',
      'periodos',
      'tipo-ingresos',
      'descuentos',
      'prestamos',
      'nomina',
      'aprobacion-nomina',
    ],
  },
  {
    key: 'personas',
    text: 'Personas y estructura',
    icon: <PeopleIcon />,
    viewKeys: [
      'departamentos',
      'puestos',
      'sucursales',
      'horarios',
      'tipo-contrato',
      'kpis',
      'kpi-resultado',
      'suspensiones-igss',
    ],
  },
  {
    key: 'nomina',
    text: 'Operaciones de pago',
    icon: <PaymentsIcon />,
    viewKeys: ['nomina-asignaciones', 'nomina-detalle', 'liquidacion', 'calculadora-igss', 'calculadora-isr', 'generar-csv'],
  },
  {
    key: 'administracion',
    text: 'Administracion',
    icon: <AdminPanelSettingsIcon />,
    viewKeys: ['registro-usuarios', 'asignacion-roles', 'asignacion-permisos', 'roles-permisos'],
  },
  {
    key: 'auditoria',
    text: 'Auditoria y trazabilidad',
    icon: <HistoryIcon />,
    viewKeys: ['bitacora', 'usuario-bitacora'],
  },
  {
    key: 'asistencia',
    text: 'Asistencia',
    icon: <FactCheckIcon />,
    viewKeys: ['marcaje', 'resumen-marcaje'],
  },
];

const buildMenuSections = (): MenuSectionType[] =>
  processSections
    .map((section) => ({
      key: section.key,
      text: section.text,
      icon: section.icon,
      items: section.viewKeys
        .map((key) => appViews.find((view) => view.key === key))
        .filter((view): view is (typeof appViews)[number] => view !== undefined)
        .filter((view) => !reportViewKeys.has(view.key))
        .map((view) => ({
          text: view.text,
          path: view.path,
          icon: viewIcons[view.key] ?? <FolderIcon />,
        })),
    }))
    .filter((section) => section.items.length > 0);

function Navbar() {
  const [open, setOpen] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    guia: true,
    personas: false,
    nomina: false,
    administracion: false,
    auditoria: false,
    asistencia: false,
    Reportes: true,
  });

  const location = useLocation();
  const menuSections = useMemo(() => buildMenuSections(), []);
  const { requestNavigation } = useUnsavedChanges();

  const { canAccessPath, logout, user } = useAuth();
  const canSeeReportes = canAccessPath('/reportes') || reportPaths.some((path) => canAccessPath(path));
  const visibleSections = menuSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => canAccessPath(item.path)),
    }))
    .filter((section) => section.items.length > 0);

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

  const handleNavigation =
    (path: string) =>
    (event: MouseEvent<HTMLElement>) => {
      event.preventDefault();

      if (location.pathname !== path) {
        requestNavigation(path);
      }

      setOpen(false);
    };

  const renderSubItem = (item: MenuItemType) => {
    const isActive = location.pathname === item.path;

    return (
      <ListItemButton
        key={item.path}
        component={NavLink}
        to={item.path}
        selected={isActive}
        onClick={handleNavigation(item.path)}
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
      <AppBar position="sticky" elevation={0}>
        <Toolbar sx={{ minHeight: 66 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={toggleDrawer(true)}
            sx={{ mr: 1.5, border: '1px solid', borderColor: 'divider' }}
          >
            <MenuIcon />
          </IconButton>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
              Innova Nominas
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Gestion de planilla y asistencia
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {user && (
            <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mr: 1, display: { xs: 'none', sm: 'flex' } }}>
              <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.light', color: 'primary.dark', fontSize: 13 }}>
                {(user.nombre_completo || user.email || 'U').slice(0, 1).toUpperCase()}
              </Avatar>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {user.nombre_completo || user.email}
              </Typography>
            </Stack>
          )}

          <IconButton color="inherit" title="Cerrar sesión" onClick={logout}>
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={open}
        onClose={toggleDrawer(false)}
        slotProps={{ paper: { sx: { width: 328, bgcolor: 'background.default' } } }}
      >
        <Box role="presentation">
          <Box sx={{ p: 2.25 }}>
            <Typography variant="h6" sx={{ fontWeight: 900 }}>
              Menu principal
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Navegacion por proceso de nomina
            </Typography>
          </Box>

          <Divider />

          <List>
            <ListItemButton
              component={NavLink}
              to="/"
              selected={location.pathname === '/'}
              onClick={handleNavigation('/')}
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

            {canSeeReportes && (
              <Box>
                <ListItemButton onClick={() => toggleSection('Reportes')} selected={false} sx={getMenuItemSx(false)}>
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                    <SummarizeIcon />
                  </ListItemIcon>
                  <ListItemText primary="Reportes" />
                  {openSections['Reportes'] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
                <Collapse in={openSections['Reportes']} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    <ListItemButton
                      component={NavLink}
                      to="/reportes"
                      selected={location.pathname === '/reportes'}
                      onClick={handleNavigation('/reportes')}
                      sx={getMenuItemSx(location.pathname === '/reportes', { pl: 4 })}
                    >
                      <ListItemIcon
                        sx={{
                          color: location.pathname === '/reportes' ? 'white' : 'inherit',
                          minWidth: 40,
                        }}
                      >
                        <SummarizeIcon />
                      </ListItemIcon>
                      <ListItemText primary="Ver reportes" />
                    </ListItemButton>
                  </List>
                </Collapse>
                <Divider sx={{ my: 0.5 }} />
              </Box>
            )}

            {visibleSections.map((section) => {
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

