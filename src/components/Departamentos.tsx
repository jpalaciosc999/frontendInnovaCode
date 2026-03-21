import { useEffect, useState } from 'react';
import type { Departamento, DepartamentoForm } from '../interfaces/departamentos';
import {
  obtenerDepartamentos,
  crearDepartamento,
  actualizarDepartamento,
  eliminarDepartamento
} from '../services/departamentos.service';

const initialForm: DepartamentoForm = {
  nombre: '',
  descripcion: '',
  estado: ''
};

function Departamentos() {
  const [datos, setDatos]             = useState<Departamento[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState('');
  const [mensaje, setMensaje]         = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [depId, setDepId]             = useState<number | null>(null);
  const [form, setForm]               = useState<DepartamentoForm>(initialForm);

  const cargarDepartamentos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerDepartamentos();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando departamentos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarDepartamentos(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setDepId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!form.nombre.trim() || !form.descripcion.trim() || !form.estado.trim()) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    return true;
  };

  const guardarDepartamento = async () => {
    try {
      setError(''); setMensaje('');
      if (!validarFormulario()) return;
      if (modoEdicion && depId !== null) {
        await actualizarDepartamento(depId, form);
        setMensaje('Departamento actualizado correctamente');
      } else {
        await crearDepartamento(form);
        setMensaje('Departamento creado correctamente');
      }
      limpiarFormulario();
      await cargarDepartamentos();
    } catch (err: any) {
      setError('Error guardando departamento: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este departamento?')) return;
    try {
      setError(''); setMensaje('');
      await eliminarDepartamento(id);
      setMensaje('Departamento eliminado correctamente');
      if (depId === id) limpiarFormulario();
      await cargarDepartamentos();
    } catch (err: any) {
      setError('Error eliminando departamento: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (dep: Departamento) => {
    setModoEdicion(true);
    setDepId(dep.DEP_ID);
    setMensaje(''); setError('');
    setForm({
      nombre: dep.DEP_NOMBRE || '',
      descripcion: dep.DEP_DESCRIPCION || '',
      estado: dep.DEP_ESTADO || ''
    });
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>CRUD de Departamentos</h2>

      {error   && <p style={{ color: 'red',   fontWeight: 'bold' }}>{error}</p>}
      {mensaje && <p style={{ color: 'green', fontWeight: 'bold' }}>{mensaje}</p>}

      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', marginBottom: '24px', maxWidth: '700px' }}>
        <h3>{modoEdicion ? 'Editar departamento' : 'Nuevo departamento'}</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          <input type="text" name="nombre"      placeholder="Nombre"      value={form.nombre}      onChange={handleChange} />
          <input type="text" name="descripcion" placeholder="Descripción" value={form.descripcion} onChange={handleChange} />
          <select name="estado" value={form.estado} onChange={handleChange}>
            <option value="">Seleccione estado</option>
            <option value="A">Activo</option>
            <option value="I">Inactivo</option>
          </select>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={guardarDepartamento}>{modoEdicion ? 'Actualizar' : 'Guardar'}</button>
            <button onClick={limpiarFormulario}>Limpiar</button>
          </div>
        </div>
      </div>

      <h3>Listado de departamentos: {datos.length}</h3>
      <div style={{ overflowX: 'auto' }}>
        <table border={1} cellPadding={8} cellSpacing={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>Descripción</th><th>Estado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? datos.map(dep => (
              <tr key={dep.DEP_ID}>
                <td>{dep.DEP_ID}</td>
                <td>{dep.DEP_NOMBRE}</td>
                <td>{dep.DEP_DESCRIPCION}</td>
                <td>{dep.DEP_ESTADO}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditar(dep)}>Editar</button>
                    <button onClick={() => handleEliminar(dep.DEP_ID)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={5} style={{ textAlign: 'center' }}>No hay departamentos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Departamentos;