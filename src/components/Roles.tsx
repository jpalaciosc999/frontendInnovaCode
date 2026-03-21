import { useEffect, useState } from 'react';
import type { Rol, RolForm } from '../interfaces/roles';
import {
  obtenerRoles,
  crearRol,
  actualizarRol,
  eliminarRol
} from '../services/roles.service';

const initialForm: RolForm = {
  nombre: '',
  descripcion: '',
  nivel_acceso: '',
  estado: ''
};

function Roles() {
  const [datos, setDatos]             = useState<Rol[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState('');
  const [mensaje, setMensaje]         = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rolId, setRolId]             = useState<number | null>(null);
  const [form, setForm]               = useState<RolForm>(initialForm);

  const cargarRoles = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerRoles();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando roles: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarRoles(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setRolId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!form.nombre.trim() || !form.descripcion.trim() || !form.nivel_acceso.trim() || !form.estado.trim()) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const guardarRol = async () => {
    try {
      setError(''); setMensaje('');
      if (!validarFormulario()) return;
      if (modoEdicion && rolId !== null) {
        await actualizarRol(rolId, form);
        setMensaje('Rol actualizado correctamente');
      } else {
        await crearRol(form);
        setMensaje('Rol creado correctamente');
      }
      limpiarFormulario();
      await cargarRoles();
    } catch (err: any) {
      setError('Error guardando rol: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este rol?')) return;
    try {
      setError(''); setMensaje('');
      await eliminarRol(id);
      setMensaje('Rol eliminado correctamente');
      if (rolId === id) limpiarFormulario();
      await cargarRoles();
    } catch (err: any) {
      setError('Error eliminando rol: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (r: Rol) => {
    setModoEdicion(true);
    setRolId(r.ROL_ID);
    setMensaje(''); setError('');
    setForm({
      nombre:       r.ROL_NOMBRE       || '',
      descripcion:  r.ROL_DESCRIPCION  || '',
      nivel_acceso: r.ROL_NIVEL_ACCESO || '',
      estado:       r.ROL_ESTADO       || ''
    });
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>CRUD de Roles</h2>

      {error   && <p style={{ color: 'red',   fontWeight: 'bold' }}>{error}</p>}
      {mensaje && <p style={{ color: 'green', fontWeight: 'bold' }}>{mensaje}</p>}

      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', marginBottom: '24px', maxWidth: '700px' }}>
        <h3>{modoEdicion ? 'Editar rol' : 'Nuevo rol'}</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          <input type="text" name="nombre"       placeholder="Nombre"        value={form.nombre}       onChange={handleChange} />
          <input type="text" name="descripcion"  placeholder="Descripción"   value={form.descripcion}  onChange={handleChange} />
          <input type="text" name="nivel_acceso" placeholder="Nivel de acceso" value={form.nivel_acceso} onChange={handleChange} />
          <select name="estado" value={form.estado} onChange={handleChange}>
            <option value="">Seleccione estado</option>
            <option value="A">Activo</option>
            <option value="I">Inactivo</option>
          </select>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={guardarRol}>{modoEdicion ? 'Actualizar' : 'Guardar'}</button>
            <button onClick={limpiarFormulario}>Limpiar</button>
          </div>
        </div>
      </div>

      <h3>Listado de roles: {datos.length}</h3>
      <div style={{ overflowX: 'auto' }}>
        <table border={1} cellPadding={8} cellSpacing={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Nivel acceso</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? datos.map(r => (
              <tr key={r.ROL_ID}>
                <td>{r.ROL_ID}</td>
                <td>{r.ROL_NOMBRE}</td>
                <td>{r.ROL_DESCRIPCION}</td>
                <td>{r.ROL_NIVEL_ACCESO}</td>
                <td>{r.ROL_ESTADO}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditar(r)}>Editar</button>
                    <button onClick={() => handleEliminar(r.ROL_ID)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>No hay roles registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Roles;