import { useEffect, useState } from 'react';
import type { Rol, RolForm } from '../interfaces/roles';
import {
  obtenerRoles,
  crearRol,
  actualizarRol,
  eliminarRol
} from '../services/roles.service';

const initialForm: RolForm = {
  rol_nombre: '',
  rol_descripcion: '',
  rol_nivel_acceso: '',
  rol_estado: '',
  rol_fecha_creacion: ''
};

function Roles() {
  const [datos, setDatos] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rolId, setRolId] = useState<number | null>(null);
  const [form, setForm] = useState<RolForm>(initialForm);

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

  useEffect(() => {
    cargarRoles();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setRolId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (
      !form.rol_nombre.trim() ||
      !form.rol_descripcion.trim() ||
      !form.rol_nivel_acceso.trim() ||
      !form.rol_estado.trim() ||
      !form.rol_fecha_creacion.trim()
    ) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const guardarRol = async () => {
    try {
      setError('');
      setMensaje('');

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

  const handleEditar = (rol: Rol) => {
    setModoEdicion(true);
    setRolId(rol.ROL_ID);
    setForm({
      rol_nombre: rol.ROL_NOMBRE || '',
      rol_descripcion: rol.ROL_DESCRIPCION || '',
      rol_nivel_acceso: rol.ROL_NIVEL_ACCESO || '',
      rol_estado: rol.ROL_ESTADO || '',
      rol_fecha_creacion: rol.ROL_FECHA_CREACION
        ? String(rol.ROL_FECHA_CREACION).slice(0, 10)
        : ''
    });
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este rol?')) return;

    try {
      await eliminarRol(id);
      setMensaje('Rol eliminado correctamente');
      await cargarRoles();
    } catch (err: any) {
      setError('Error eliminando rol: ' + (err.response?.data?.error || err.message));
    }
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>CRUD de Roles</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}

      <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', marginBottom: '24px', maxWidth: '700px' }}>
        <h3>{modoEdicion ? 'Editar rol' : 'Nuevo rol'}</h3>

        <div style={{ display: 'grid', gap: '10px' }}>
          <input
            type="text"
            name="rol_nombre"
            placeholder="Nombre rol"
            value={form.rol_nombre}
            onChange={handleChange}
          />
          <input
            type="text"
            name="rol_descripcion"
            placeholder="Descripción"
            value={form.rol_descripcion}
            onChange={handleChange}
          />
          <input
            type="text"
            name="rol_nivel_acceso"
            placeholder="Nivel acceso"
            value={form.rol_nivel_acceso}
            onChange={handleChange}
          />
          <select
            name="rol_estado"
            value={form.rol_estado}
            onChange={handleChange}
          >
            <option value="">Seleccione estado</option>
            <option value="A">Activo</option>
            <option value="I">Inactivo</option>
          </select>
          <input
            type="date"
            name="rol_fecha_creacion"
            value={form.rol_fecha_creacion}
            onChange={handleChange}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={guardarRol}>
              {modoEdicion ? 'Actualizar' : 'Guardar'}
            </button>
            <button onClick={limpiarFormulario}>Limpiar</button>
          </div>
        </div>
      </div>

      <table border={1} cellPadding={8} cellSpacing={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Nivel acceso</th>
            <th>Estado</th>
            <th>Fecha creación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datos.length > 0 ? (
            datos.map((rol) => (
              <tr key={rol.ROL_ID}>
                <td>{rol.ROL_ID}</td>
                <td>{rol.ROL_NOMBRE}</td>
                <td>{rol.ROL_DESCRIPCION}</td>
                <td>{rol.ROL_NIVEL_ACCESO}</td>
                <td>{rol.ROL_ESTADO}</td>
                <td>{rol.ROL_FECHA_CREACION ? String(rol.ROL_FECHA_CREACION).slice(0, 10) : ''}</td>
                <td>
                  <button onClick={() => handleEditar(rol)}>Editar</button>
                  <button onClick={() => handleEliminar(rol.ROL_ID)}>Eliminar</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7}>No hay roles registrados</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Roles;