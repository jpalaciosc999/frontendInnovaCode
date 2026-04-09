import { Routes, Route } from 'react-router-dom';
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
import KPIResultadoPage from "./components/KPIResultadoPage";
import EmpleadoContrato from "./components/EmpleadoContrato";


function App() {
  return (
    <>
      <Navbar />
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
        <Route path="/Control-Laboral" element={<ControlLaboral />} />
        <Route path="/cuenta-bancaria" element={<CuentaBancaria />} />
        <Route path="/descuentos" element={<Descuentos />} />
        <Route path="/tipoIngresos" element={<TipoIngresos />} />
        <Route path="/nomina-detalle" element={<NominaDetallePage />} />
        <Route path="/kpis" element={<KPIPage />} />
        <Route path="/kpi-resultado" element={<KPIResultadoPage />} />
        <Route path="/Empleado_contrato" element={<EmpleadoContrato />} />
      </Routes>
    </>
  );
}

export default App;