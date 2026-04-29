import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Box, Container, CssBaseline } from '@mui/material';

import Navbar from './components/Navbar';
import AccessDenied from './components/common/AccessDenied';
import PendingView from './components/common/PendingView';
import Home from './pages/Home';
import PruebaAxios from './components/PruebaAxios';
import Departamentos from './components/Departamentos';
import Puestos from './components/Puestos';
import Roles from './components/Roles';
import Prestamos from './components/Prestamos';
import PrestamoDetalleView from './components/PrestamoDetalle';
import Permisos from './components/permisos';
import RolPermisosView from './components/RolPermisos';
import Periodo from './components/Periodo';
import ControlLaboral from './components/ControlLaboral';
import CuentaBancaria from './components/CuentaBancaria';
import Descuentos from './components/descuentos';
import TipoIngresos from './components/tipoIngresos';
import NominaDetallePage from './components/NominaDetallePage';
import KPIPage from './components/KPIPage';
import KPIResultadoPage from './components/KPIResultadoPage';
import MarcajePage from './components/MarcajeCRUD';
import EmpleadoContrato from './components/EmpleadoContrato';
import Sede from './components/Sede';
import Bitacora from './components/Bitacora';
import Liquidacion from './components/Liquidacion';
import Nomina from './components/Nomina';
import Usuario from './components/Usuario';
import TipoContrato from './components/TipoContrato';
import UsuarioBitacora from './components/UsuarioBitacora';
import HorarioCRUD from './components/HorarioCRUD';
import CalculadoraIgss from './components/CalculadoraIgss';
import CalculadoraISR from './components/CalculadoraIsr'; 
import GenerarCSV from './components/Generarcsv';   
import SuspensionIgss from './components/SuspensionIgss';
import {
  AUTH_USER_CHANGED_EVENT,
  allViews,
  canAccessPath,
  getCurrentUserRole,
  roleLabels,
} from './config/roleViews';

function GuardedRoute({
  path,
  currentRole,
  children,
}: {
  path: string;
  currentRole: ReturnType<typeof getCurrentUserRole>;
  children: ReactNode;
}) {
  const view = allViews.find((item) => item.path === path);

  if (!canAccessPath(path, currentRole)) {
    return <AccessDenied requiredRoles={view?.roles.map((role) => roleLabels[role])} />;
  }

  return children;
}

function App() {
  const [currentRole, setCurrentRole] = useState(getCurrentUserRole());

  useEffect(() => {
    const syncCurrentRole = () => setCurrentRole(getCurrentUserRole());

    window.addEventListener(AUTH_USER_CHANGED_EVENT, syncCurrentRole);
    window.addEventListener('storage', syncCurrentRole);

    return () => {
      window.removeEventListener(AUTH_USER_CHANGED_EVENT, syncCurrentRole);
      window.removeEventListener('storage', syncCurrentRole);
    };
  }, []);

  const guarded = (path: string, element: ReactNode) => (
    <GuardedRoute path={path} currentRole={currentRole}>
      {element}
    </GuardedRoute>
  );

  return (
    <>
      <CssBaseline />

      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
        <Navbar />

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/empleados" element={guarded('/empleados', <PruebaAxios />)} />
            <Route path="/departamentos" element={guarded('/departamentos', <Departamentos />)} />
            <Route path="/puestos" element={guarded('/puestos', <Puestos />)} />
            <Route path="/prestamos" element={guarded('/prestamos', <Prestamos />)} />
            <Route path="/prestamo-detalle" element={guarded('/prestamo-detalle', <PrestamoDetalleView />)} />
            <Route path="/permisos" element={guarded('/permisos', <Permisos />)} />
            <Route path="/rol-permisos" element={guarded('/rol-permisos', <RolPermisosView />)} />
            <Route path="/roles" element={guarded('/roles', <Roles />)} />
            <Route path="/periodo" element={guarded('/periodo', <Periodo />)} />
            <Route path="/control-laboral" element={guarded('/control-laboral', <ControlLaboral />)} />
            <Route path="/cuenta-bancaria" element={guarded('/cuenta-bancaria', <CuentaBancaria />)} />
            <Route path="/descuentos" element={guarded('/descuentos', <Descuentos />)} />
            <Route path="/tipo-ingresos" element={guarded('/tipo-ingresos', <TipoIngresos />)} />
            <Route path="/nomina-detalle" element={guarded('/nomina-detalle', <NominaDetallePage />)} />
            <Route path="/kpis" element={guarded('/kpis', <KPIPage />)} />
            <Route path="/kpi-resultado" element={guarded('/kpi-resultado', <KPIResultadoPage />)} />
            <Route path="/marcajes" element={guarded('/marcajes', <MarcajePage />)} />
            <Route path="/empleado-contrato" element={guarded('/empleado-contrato', <EmpleadoContrato />)} />
            <Route path="/sede" element={guarded('/sede', <Sede />)} />
            <Route path="/sucursales" element={guarded('/sucursales', <Sede />)} />
            <Route path="/bitacora" element={guarded('/bitacora', <Bitacora />)} />
            <Route path="/liquidacion" element={guarded('/liquidacion', <Liquidacion />)} />
            <Route path="/nomina" element={guarded('/nomina', <Nomina />)} />
            <Route path="/usuarios" element={guarded('/usuarios', <Usuario />)} />
            <Route path="/tipo-contrato" element={guarded('/tipo-contrato', <TipoContrato />)} />
            <Route path="/usuario-bitacora" element={guarded('/usuario-bitacora', <UsuarioBitacora />)} />
            <Route path="/horarios" element={guarded('/horarios', <HorarioCRUD />)} />
            <Route path="/calculadora-igss" element={guarded('/calculadora-igss', <CalculadoraIgss />)} />
            <Route path="/calculadora-isr" element={guarded('/calculadora-isr', <CalculadoraISR />)} />
            <Route path="/suspensiones-igss" element={guarded('/suspensiones-igss', <SuspensionIgss />)} />
            <Route path="/tipos-descuento" element={guarded('/tipos-descuento', <Descuentos />)} />
            <Route path="/prestamos-banco" element={guarded('/prestamos-banco', <Prestamos />)} />
            <Route path="/generar-csv" element={guarded('/generar-csv', <GenerarCSV />)} />
            <Route path="/resumen-marcaje" element={guarded('/resumen-marcaje', <PendingView title="Resumen de Marcaje" roleName="RRHH" />)} />
            <Route path="/registro-vacaciones" element={guarded('/registro-vacaciones', <PendingView title="Registro de Vacaciones" roleName="RRHH" />)} />
            <Route path="/isr" element={guarded('/isr', <PendingView title="ISR" roleName="Contabilidad" />)} />
            <Route path="/irtra" element={guarded('/irtra', <PendingView title="IRTRA" roleName="Contabilidad" />)} />
            <Route path="/intecap" element={guarded('/intecap', <PendingView title="INTECAP" roleName="Contabilidad" />)} />
            <Route path="/aprobacion-nomina" element={guarded('/aprobacion-nomina', <PendingView title="Aprobacion de Nomina" roleName="Gerente" />)} />
          </Routes>
        </Container>
      </Box>
    </>
  );
}

export default App;
