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
import Descuentos from './components/descuentos';
import tipoIngresos from './components/tipoIngresos';
import IngresosCRUD from './components/tipoIngresos';


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
        <Route path="/descuentos" element={<Descuentos />} />
        <Route path="/tipoIngresos" element={<IngresosCRUD />} />
      </Routes>
    </>
  );
}

export default App;