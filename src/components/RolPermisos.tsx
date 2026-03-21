import { useEffect, useState } from 'react';
import type { RolPermiso, RolPermisoForm } from '../interfaces/rolPermisos';
import {
  obtenerRolPermisos,
  crearRolPermiso,
  actualizarRolPermiso,
  eliminarRolPermiso
} from '../services/rolPermisos.service';

const initialForm: RolPermisoForm = {
  per_id: '',
  rol_id: ''
};

function RolPermisosView() {
  const [datos, setDatos] = useState<RolPermiso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [rpeId, setRpeId] = useState<number | null>(null);
  const [form, setForm] = useState<RolPermisoForm>(initialForm);

  const cargarRolPermisos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerRolPermisos();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando rol-permisos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRolPermisos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setRpeId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!form.per_id.trim() || !form.rol_id.trim()) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const guardarRolPermiso = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && rpeId !== null) {
        await actualizarRolPermiso(rpeId, form);
        setMensaje('Rol-permiso actualizado correctamente');
      } else {
        await crearRolPermiso(form);
        setMensaje('Rol-permiso creado correctamente');
      }

      limpiarFormulario();
      await cargarRolPermisos();
    } catch (err: any) {
      setError('Error guardando rol-permiso: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (item: RolPermiso) => {
    setModoEdicion(true);
    setRpeId(item.RPE_ID);
    setForm({
      per_id: String(item.PER_ID || ''),
      rol_id: String(item.ROL_ID || '')
    });
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar esta relación rol-permiso?')) return;

    try {
      await eliminarRolPermiso(id);
      setMensaje('Rol-permiso eliminado correctamente');
      await cargarRolPermisos();
    } catch (err: any) {
      setError('Error eliminando rol-permiso: ' + (err.response?.data?.error || err.message));
    }
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>CRUD de Rol-Permisos</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}

      <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', marginBottom: '24px', maxWidth: '700px' }}>
        <h3>{modoEdicion ? 'Editar relación' : 'Nueva relación'}</h3>

        <div style={{ display: 'grid', gap: '10px' }}>
          <input
            type="number"
            name="per_id"
            placeholder="ID permiso"
            value={form.per_id}
            onChange={handleChange}
          />
          <input
            type="number"
            name="rol_id"
            placeholder="ID rol"
            value={form.rol_id}
            onChange={handleChange}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={guardarRolPermiso}>
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
            <th>Permiso ID</th>
            <th>Rol ID</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datos.length > 0 ? (
            datos.map((item) => (
              <tr key={item.RPE_ID}>
                <td>{item.RPE_ID}</td>
                <td>{item.PER_ID}</td>
                <td>{item.ROL_ID}</td>
                <td>
                  <button onClick={() => handleEditar(item)}>Editar</button>
                  <button onClick={() => handleEliminar(item.RPE_ID)}>Eliminar</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4}>No hay relaciones registradas</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default RolPermisosView;