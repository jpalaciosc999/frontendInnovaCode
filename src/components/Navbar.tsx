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

type MenuItemType = {
  text: string;
  path: string;
  icon: React.ReactNode;
};

const menuItems: MenuItemType[] = [
  { text: 'Inicio', path: '/', icon: <HomeIcon /> },
  { text: 'Empleados', path: '/empleados', icon: <PeopleIcon /> },
  { text: 'Departamentos', path: '/departamentos', icon: <BusinessIcon /> },
  { text: 'Puestos', path: '/puestos', icon: <WorkIcon /> },
  { text: 'Permisos', path: '/permisos', icon: <SecurityIcon /> },
  { text: 'Rol Permisos', path: '/rol-permisos', icon: <AdminPanelSettingsIcon /> },
  { text: 'Roles', path: '/roles', icon: <AccountTreeIcon /> },
  { text: 'Préstamos', path: '/prestamos', icon: <PaymentsIcon /> },
  { text: 'Detalle Préstamo', path: '/prestamo-detalle', icon: <ReceiptLongIcon /> },
  { text: 'Periodo', path: '/periodo', icon: <CalendarMonthIcon /> },
  { text: 'Control Laboral', path: '/control-laboral', icon: <AccessTimeIcon /> },
  { text: 'Cuenta Bancaria', path: '/cuenta-bancaria', icon: <AccountBalanceIcon /> },
  { text: 'Ingresos', path: '/tipo-ingresos', icon: <TrendingUpIcon /> },
  { text: 'Descuentos', path: '/descuentos', icon: <MoneyOffIcon /> },
  { text: 'Nómina Detalle', path: '/nomina-detalle', icon: <AssignmentIcon /> },
  { text: 'Marcajes', path: '/marcajes', icon: <FactCheckIcon /> },
  { text: 'Empleado Contrato', path: '/empleado-contrato', icon: <BadgeIcon /> },
  { text: 'Sede', path: '/sede', icon: <ApartmentIcon /> },
  { text: 'Bitácora', path: '/bitacora', icon: <HistoryIcon /> },
  { text: 'Liquidación', path: '/liquidacion', icon: <DescriptionIcon /> },
  { text: 'Nómina', path: '/nomina', icon: <DescriptionIcon /> },
  { text: 'Usuarios', path: '/usuarios', icon: <GroupIcon /> },
  { text: 'Tipo Contrato', path: '/tipo-contrato', icon: <PersonIcon /> },
  { text: 'Usuario Bitácora', path: '/usuario-bitacora', icon: <EditNoteIcon /> },
  { text: 'KPIs', path: '/kpis', icon: <InsightsIcon /> },
  { text: 'Resultados KPI', path: '/kpi-resultado', icon: <QueryStatsIcon /> },
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
                <ListItemButton
                  key={item.path}
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
              );
            })}
          </List>
        </Box>
      </Drawer>
    </>
  );
}

export default Navbar;