import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PruebaAxios from './components/PruebaAxios';
import Departamentos from './components/Departamentos';
import Puestos from './components/Puestos';

function App() {
  return (
<>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/empleados" element={<PruebaAxios />} />
        <Route path="/departamentos" element={<Departamentos />} />
        <Route path="/puestos" element={<Puestos />} />
      </Routes>
    </>
  );
}

export default App;