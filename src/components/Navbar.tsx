import { NavLink } from 'react-router-dom';

function Navbar() {
  const style = ({ isActive }: { isActive: boolean }) => ({
    padding: '6px',
    color: isActive ? 'white' : '#ccc',
    background: isActive ? '#2563eb' : 'transparent',
    borderRadius: '6px',
    textDecoration: 'none'
  });

  return (
    <nav style={{
      display: 'flex',
      gap: '10px',
      padding: '15px',
      background: '#111'
    }}>
      <NavLink to="/" style={style}>Inicio</NavLink>
      <NavLink to="/empleados" style={style}>Empleados</NavLink>
      <NavLink to="/departamentos" style={style}>Departamentos</NavLink>
      <NavLink to="/puestos" style={style}>Puestos</NavLink>
    </nav>
  );
}

export default Navbar;