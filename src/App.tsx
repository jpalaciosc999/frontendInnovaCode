import { Routes, Route } from 'react-router-dom';
import { Box, Container, CssBaseline } from '@mui/material';

import Navbar from './components/Navbar';
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
import MarcajePage from './components/MarcajePage';
import EmpleadoContrato from './components/EmpleadoContrato';
import Sede from './components/Sede';
import Bitacora from './components/Bitacora';
import Liquidacion from './components/Liquidacion';
import Nomina from './components/Nomina';
import Usuario from './components/Usuario';
import TipoContrato from './components/TipoContrato';
import UsuarioBitacora from './components/UsuarioBitacora';
import HorarioCRUD from './components/HorarioCRUD';

function App() {
  return (
    <>
      <CssBaseline />

      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
        <Navbar />

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/empleados" element={<PruebaAxios />} />
            <Route path="/departamentos" element={<Departamentos />} />
            <Route path="/puestos" element={<Puestos />} />
            <Route path="/prestamos" element={<Prestamos />} />
            <Route path="/prestamo-detalle" element={<PrestamoDetalleView />} />
            <Route path="/permisos" element={<Permisos />} />
            <Route path="/rol-permisos" element={<RolPermisosView />} />
            <Route path="/roles" element={<Roles />} />
            <Route path="/periodo" element={<Periodo />} />
            <Route path="/control-laboral" element={<ControlLaboral />} />
            <Route path="/cuenta-bancaria" element={<CuentaBancaria />} />
            <Route path="/descuentos" element={<Descuentos />} />
            <Route path="/tipo-ingresos" element={<TipoIngresos />} />
            <Route path="/nomina-detalle" element={<NominaDetallePage />} />
            <Route path="/kpis" element={<KPIPage />} />
            <Route path="/kpi-resultado" element={<KPIResultadoPage />} />
            <Route path="/marcajes" element={<MarcajePage />} />
            <Route path="/empleado-contrato" element={<EmpleadoContrato />} />
            <Route path="/sede" element={<Sede />} />
            <Route path="/bitacora" element={<Bitacora />} />
            <Route path="/liquidacion" element={<Liquidacion />} />
            <Route path="/nomina" element={<Nomina />} />
            <Route path="/usuarios" element={<Usuario />} />
            <Route path="/tipo-contrato" element={<TipoContrato />} />
            <Route path="/usuario-bitacora" element={<UsuarioBitacora />} />
            <Route path="/horarios" element={<HorarioCRUD />} />
          </Routes>
        </Container>
      </Box>
    </>
  );
}

export default App;