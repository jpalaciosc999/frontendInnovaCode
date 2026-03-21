import { useEffect, useState } from 'react';
import type { Permiso, PermisoForm } from '../interfaces/permisos';
import {
  obtenerPermisos,
  crearPermiso,
  actualizarPermiso,
  eliminarPermiso
} from '../services/permisos.service';

const initialForm: PermisoForm = {
  per_nombre_permiso: '',
  per_modulo: '',
  per_descripcion: ''
};

function Permisos() {
  const [datos, setDatos] = useState<Permiso[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [permisoId, setPermisoId] = useState<number | null>(null);
  const [form, setForm] = useState<PermisoForm>(initialForm);

  const cargarPermisos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerPermisos();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando permisos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPermisos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setPermisoId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (
      !form.per_nombre_permiso.trim() ||
      !form.per_modulo.trim() ||
      !form.per_descripcion.trim()
    ) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const guardarPermiso = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && permisoId !== null) {
        await actualizarPermiso(permisoId, form);
        setMensaje('Permiso actualizado correctamente');
      } else {
        await crearPermiso(form);
        setMensaje('Permiso creado correctamente');
      }

      limpiarFormulario();
      await cargarPermisos();
    } catch (err: any) {
      setError('Error guardando permiso: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (permiso: Permiso) => {
    setModoEdicion(true);
    setPermisoId(permiso.PERMISOS_ID);
    setForm({
      per_nombre_permiso: permiso.PER_NOMBRE_PERMISO || '',
      per_modulo: permiso.PER_MODULO || '',
      per_descripcion: permiso.PER_DESCRIPCION || ''
    });
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este permiso?')) return;

    try {
      await eliminarPermiso(id);
      setMensaje('Permiso eliminado correctamente');
      await cargarPermisos();
    } catch (err: any) {
      setError('Error eliminando permiso: ' + (err.response?.data?.error || err.message));
    }
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>CRUD de Permisos</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}

      <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', marginBottom: '24px', maxWidth: '700px' }}>
        <h3>{modoEdicion ? 'Editar permiso' : 'Nuevo permiso'}</h3>

        <div style={{ display: 'grid', gap: '10px' }}>
          <input
            type="text"
            name="per_nombre_permiso"
            placeholder="Nombre permiso"
            value={form.per_nombre_permiso}
            onChange={handleChange}
          />
          <input
            type="text"
            name="per_modulo"
            placeholder="Módulo"
            value={form.per_modulo}
            onChange={handleChange}
          />
          <input
            type="text"
            name="per_descripcion"
            placeholder="Descripción"
            value={form.per_descripcion}
            onChange={handleChange}
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={guardarPermiso}>
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
            <th>Nombre permiso</th>
            <th>Módulo</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datos.length > 0 ? (
            datos.map((permiso) => (
              <tr key={permiso.PERMISOS_ID}>
                <td>{permiso.PERMISOS_ID}</td>
                <td>{permiso.PER_NOMBRE_PERMISO}</td>
                <td>{permiso.PER_MODULO}</td>
                <td>{permiso.PER_DESCRIPCION}</td>
                <td>
                  <button onClick={() => handleEditar(permiso)}>Editar</button>
                  <button onClick={() => handleEliminar(permiso.PERMISOS_ID)}>Eliminar</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5}>No hay permisos registrados</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Permisos;