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
      background: '#111',
      flexWrap: 'wrap' // Tip: Agregué esto por si tienes muchos botones y no caben en una línea
    }}>
      <NavLink to="/" style={style}>Inicio</NavLink>
      <NavLink to="/empleados" style={style}>Empleados</NavLink>
      <NavLink to="/departamentos" style={style}>Departamentos</NavLink>
      <NavLink to="/puestos" style={style}>Puestos</NavLink>
      <NavLink to="/permisos" style={style}>permisos</NavLink>
      <NavLink to="/rol-permisos" style={style}>rolPermisos</NavLink>
      <NavLink to="/roles" style={style}>Roles</NavLink>
      <NavLink to="/prestamos" style={style}>prestamos</NavLink>
      <NavLink to="/prestamo-detalle" style={style}>prestamo-detalle</NavLink>
      <NavLink to="/periodo" style={style}>periodo</NavLink>
      <NavLink to="/Control-Laboral" style={style}>Control-Laboral</NavLink>
      <NavLink to="/cuenta-bancaria" style={style}>Cuenta Bancaria</NavLink>
      <NavLink to="/tipoIngresos" style={style}>Ingresos</NavLink>
      <NavLink to="/descuentos" style={style}>Descuentos</NavLink>
      <NavLink to="/nomina-detalle" style={style}>Nomina Detalle</NavLink>
      <NavLink to="/marcajes" style={style}>Marcajes</NavLink>
      <NavLink to="/Empleado_contrato" style={style}>Empleado Contrato</NavLink>
      <NavLink to="/sede" style={style}>Sede</NavLink>
      <NavLink to="/bitacora" style={style}>Bitácora</NavLink>
      <NavLink to="/liquidacion" style={style}>Liquidación</NavLink>
      <NavLink to="/nomina" style={style}>Nomina</NavLink>

      {/* SECCIÓN DE KPIs */}
      <NavLink to="/kpis" style={style}>KPIs</NavLink>
      <NavLink to="/kpi-resultado" style={style}>Resultados KPI</NavLink>

    </nav>
  );
}

export default Navbar;