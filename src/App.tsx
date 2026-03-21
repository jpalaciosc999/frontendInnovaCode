import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PruebaAxios from './components/PruebaAxios';
import Departamentos from './components/Departamentos';
import Puestos from './components/Puestos';
import Roles from './components/Roles';
import Prestamos from './components/Prestamos';
import PrestamoDetalleView from './components/PrestamoDetalle';

function App() {
  return (
<>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/empleados" element={<PruebaAxios />} />
        <Route path="/departamentos" element={<Departamentos />} />
        <Route path="/puestos" element={<Puestos />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/prestamos" element={<Prestamos />} />
        <Route path="/prestamo-detalle" element={<PrestamoDetalleView />} />
      </Routes>
    </>
  );
}

export default App;