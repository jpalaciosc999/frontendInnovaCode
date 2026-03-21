import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import PruebaAxios from './components/PruebaAxios';

function App() {
  return (
<>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/empleados" element={<PruebaAxios />} />
      </Routes>
    </>
  );
}

export default App;