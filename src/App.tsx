import type { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, CssBaseline } from '@mui/material';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import AccessDenied from './components/common/AccessDenied';

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
import AprobacionNomina from './components/AprobacionNomina';
import ReporteMarcajes from './components/ReporteMarcajes';
import ReporteIgss from './components/ReporteIgss';
import ReporteIsr from './components/ReporteIsr';
import ReporteAguinaldo from './components/ReporteAguinaldo';
import ReporteVacaciones from './components/ReporteVacaciones';
import ReporteDescuentos from './components/ReporteDescuentos';
import ReporteKpi        from './components/ReporteKpi';
import ReporteHorasExtra from './components/ReporteHorasExtra';
import DashboardEjecutivo from './components/DashboardEjecutivo';
import ReporteLiquidacion from './components/ReporteLiquidacion';

function GuardedRoute({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const { canAccessPath } = useAuth();

  if (!canAccessPath(path)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

function Layout() {
  const guarded = (path: string, element: ReactNode) => (
    <GuardedRoute path={path}>
      {element}
    </GuardedRoute>
  );

  return (
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
          <Route path="/tipos-descuento" element={<Navigate to="/descuentos" replace />} />
          <Route path="/prestamos-banco" element={<Navigate to="/prestamos" replace />} />
          <Route path="/generar-csv" element={guarded('/generar-csv', <GenerarCSV />)} />

          <Route path="/resumen-marcaje" element={guarded('/resumen-marcaje', <MarcajePage />)} />
          <Route path="/registro-vacaciones" element={<Navigate to="/control-laboral" replace />} />
          <Route path="/isr" element={<Navigate to="/descuentos" replace />} />
          <Route path="/irtra" element={<Navigate to="/descuentos" replace />} />
          <Route path="/intecap" element={<Navigate to="/descuentos" replace />} />
          <Route path="/aprobacion-nomina" element={guarded('/aprobacion-nomina', <AprobacionNomina />)} />
          <Route path="/reporte-marcajes" element={guarded('/reporte-marcajes', <ReporteMarcajes />)} />
          <Route path="/reporte-igss" element={guarded('/reporte-igss', <ReporteIgss />)} />
          <Route path="/reporte-isr" element={guarded('/reporte-isr', <ReporteIsr />)} />
          <Route path="/reporte-aguinaldo" element={guarded('/reporte-aguinaldo', <ReporteAguinaldo />)} />
          <Route path="/reporte-vacaciones" element={guarded('/reporte-vacaciones', <ReporteVacaciones />)} />
          <Route path="/reporte-descuentos" element={guarded('/reporte-descuentos', <ReporteDescuentos />)} />
          <Route path="/reporte-kpi" element={guarded('/reporte-kpi', <ReporteKpi />)} />
          <Route path="/reporte-horas-extra" element={guarded('/reporte-horas-extra', <ReporteHorasExtra />)} />
          <Route path="/reporte-liquidacion" element={guarded('/reporte-liquidacion', <ReporteLiquidacion />)} />
          <Route path="/dashboard-ejecutivo" element={guarded('/dashboard-ejecutivo', <DashboardEjecutivo />)} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
    </Box>
  );
}

function App() {
  return (
    <AuthProvider>
      <CssBaseline />

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<Layout />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
