import type { ReactNode } from 'react';
import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, CssBaseline, CircularProgress } from '@mui/material';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import AccessDenied from './components/common/AccessDenied';

const Home = lazy(() => import('./pages/Home'));
const PruebaAxios = lazy(() => import('./components/PruebaAxios'));
const Departamentos = lazy(() => import('./components/Departamentos'));
const Puestos = lazy(() => import('./components/Puestos'));
const Roles = lazy(() => import('./components/Roles'));
const Prestamos = lazy(() => import('./components/Prestamos'));
const Permisos = lazy(() => import('./components/permisos'));
const RolPermisosView = lazy(() => import('./components/RolPermisos'));
const Periodo = lazy(() => import('./components/Periodo'));
const ControlLaboral = lazy(() => import('./components/ControlLaboral'));
const CuentaBancaria = lazy(() => import('./components/CuentaBancaria'));
const Descuentos = lazy(() => import('./components/descuentos'));
const TipoIngresos = lazy(() => import('./components/tipoIngresos'));
const NominaDetallePage = lazy(() => import('./components/NominaDetallePage'));
const KPIPage = lazy(() => import('./components/KPIPage'));
const KPIResultadoPage = lazy(() => import('./components/KPIResultadoPage'));
const MarcajePage = lazy(() => import('./components/MarcajeCRUD'));
const EmpleadoContrato = lazy(() => import('./components/EmpleadoContrato'));
const Sede = lazy(() => import('./components/Sede'));
const Bitacora = lazy(() => import('./components/Bitacora'));
const Auditoria = lazy(() => import('./components/Auditoria'));
const Liquidacion = lazy(() => import('./components/Liquidacion'));
const Nomina = lazy(() => import('./components/Nomina'));
const NominaAsignaciones = lazy(() => import('./components/NominaAsignaciones'));
const Usuario = lazy(() => import('./components/Usuario'));
const TipoContrato = lazy(() => import('./components/TipoContrato'));
const UsuarioBitacora = lazy(() => import('./components/UsuarioBitacora'));
const HorarioCRUD = lazy(() => import('./components/HorarioCRUD'));
const SuspensionIgss = lazy(() => import('./components/SuspensionIgss'));
const AprobacionNomina = lazy(() => import('./components/AprobacionNomina'));
const ReporteMarcajes = lazy(() => import('./components/ReporteMarcajes'));
const ReporteIgss = lazy(() => import('./components/ReporteIgss'));
const ReporteIsr = lazy(() => import('./components/ReporteIsr'));
const ReporteAguinaldo = lazy(() => import('./components/ReporteAguinaldo'));
const ReporteVacaciones = lazy(() => import('./components/ReporteVacaciones'));
const ReporteDescuentos = lazy(() => import('./components/ReporteDescuentos'));
const ReporteKpi = lazy(() => import('./components/ReporteKpi'));
const ReporteHorasExtra = lazy(() => import('./components/ReporteHorasExtra'));
const ReporteLiquidacion = lazy(() => import('./components/ReporteLiquidacion'));
const DashboardEjecutivo = lazy(() => import('./components/DashboardEjecutivo'));

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
        <Suspense fallback={
          <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
            <CircularProgress />
          </Box>
        }>
          <Routes>
            <Route path="/" element={<Home />} />

          <Route path="/empleados" element={guarded('/empleados', <PruebaAxios />)} />
          <Route path="/departamentos" element={guarded('/departamentos', <Departamentos />)} />
          <Route path="/puestos" element={guarded('/puestos', <Puestos />)} />
          <Route path="/prestamos" element={guarded('/prestamos', <Prestamos />)} />
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
          <Route path="/auditoria" element={guarded('/auditoria', <Auditoria />)} />
          <Route path="/liquidacion" element={guarded('/liquidacion', <Liquidacion />)} />
          <Route path="/nomina-asignaciones" element={guarded('/nomina-asignaciones', <NominaAsignaciones />)} />
          <Route path="/nomina" element={guarded('/nomina', <Nomina />)} />
          <Route path="/usuarios" element={guarded('/usuarios', <Usuario />)} />
          <Route path="/tipo-contrato" element={guarded('/tipo-contrato', <TipoContrato />)} />
          <Route path="/usuario-bitacora" element={guarded('/usuario-bitacora', <UsuarioBitacora />)} />
          <Route path="/horarios" element={guarded('/horarios', <HorarioCRUD />)} />
          <Route path="/suspensiones-igss" element={guarded('/suspensiones-igss', <SuspensionIgss />)} />
          <Route path="/tipos-descuento" element={<Navigate to="/descuentos" replace />} />
          <Route path="/prestamos-banco" element={<Navigate to="/prestamos" replace />} />
          <Route path="/prestamo-detalle" element={<Navigate to="/prestamos" replace />} />
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
      </Suspense>
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
