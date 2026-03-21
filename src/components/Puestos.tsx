import { useEffect, useState } from 'react';
import type { Puesto, PuestoForm } from '../interfaces/puestos';
import {
  obtenerPuestos,
  crearPuesto,
  actualizarPuesto,
  eliminarPuesto
} from '../services/puestos.service';

const initialForm: PuestoForm = {
  codigo: '',
  nombre: '',
  salario_base: '',
  descripcion: '',
  estado: '',
  dep_id: ''
};

function Puestos() {
  const [datos, setDatos]             = useState<Puesto[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState('');
  const [mensaje, setMensaje]         = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [puestoId, setPuestoId]       = useState<number | null>(null);
  const [form, setForm]               = useState<PuestoForm>(initialForm);

  const cargarPuestos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerPuestos();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando puestos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarPuestos(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setPuestoId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!form.nombre.trim() || !form.salario_base.trim() || !form.estado.trim() || !form.dep_id.trim()) {
      setError('Nombre, salario, estado y departamento son obligatorios');
      return false;
    }
    return true;
  };

  const guardarPuesto = async () => {
    try {
      setError(''); setMensaje('');
      if (!validarFormulario()) return;
      if (modoEdicion && puestoId !== null) {
        await actualizarPuesto(puestoId, form);
        setMensaje('Puesto actualizado correctamente');
      } else {
        await crearPuesto(form);
        setMensaje('Puesto creado correctamente');
      }
      limpiarFormulario();
      await cargarPuestos();
    } catch (err: any) {
      setError('Error guardando puesto: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este puesto?')) return;
    try {
      setError(''); setMensaje('');
      await eliminarPuesto(id);
      setMensaje('Puesto eliminado correctamente');
      if (puestoId === id) limpiarFormulario();
      await cargarPuestos();
    } catch (err: any) {
      setError('Error eliminando puesto: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (p: Puesto) => {
    setModoEdicion(true);
    setPuestoId(p.PUE_ID);
    setMensaje(''); setError('');
    setForm({
      codigo:       (p as any).PUE_CODIGO      || '',
      nombre:       p.PUE_NOMBRE               || '',
      salario_base: String(p.PUE_SALARIO_BASE  || ''),
      descripcion:  p.PUE_DESCRIPCION          || '',
      estado:       p.PUE_ESTADO               || '',
      dep_id:       String((p as any).DEP_ID   || '')
    });
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>CRUD de Puestos</h2>

      {error   && <p style={{ color: 'red',   fontWeight: 'bold' }}>{error}</p>}
      {mensaje && <p style={{ color: 'green', fontWeight: 'bold' }}>{mensaje}</p>}

      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', marginBottom: '24px', maxWidth: '700px' }}>
        <h3>{modoEdicion ? 'Editar puesto' : 'Nuevo puesto'}</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          <input type="text"   name="codigo"       placeholder="Código"       value={form.codigo}       onChange={handleChange} />
          <input type="text"   name="nombre"       placeholder="Nombre"       value={form.nombre}       onChange={handleChange} />
          <input type="number" name="salario_base" placeholder="Salario base" value={form.salario_base} onChange={handleChange} />
          <input type="text"   name="descripcion"  placeholder="Descripción"  value={form.descripcion}  onChange={handleChange} />
          <input type="text"   name="dep_id"       placeholder="ID Departamento" value={form.dep_id}    onChange={handleChange} />
          <select name="estado" value={form.estado} onChange={handleChange}>
            <option value="">Seleccione estado</option>
            <option value="A">Activo</option>
            <option value="I">Inactivo</option>
          </select>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={guardarPuesto}>{modoEdicion ? 'Actualizar' : 'Guardar'}</button>
            <button onClick={limpiarFormulario}>Limpiar</button>
          </div>
        </div>
      </div>

      <h3>Listado de puestos: {datos.length}</h3>
      <div style={{ overflowX: 'auto' }}>
        <table border={1} cellPadding={8} cellSpacing={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Código</th>
              <th>Nombre</th>
              <th>Salario base</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? datos.map(p => (
              <tr key={p.PUE_ID}>
                <td>{p.PUE_ID}</td>
                <td>{(p as any).PUE_CODIGO}</td>
                <td>{p.PUE_NOMBRE}</td>
                <td>{p.PUE_SALARIO_BASE}</td>
                <td>{p.PUE_DESCRIPCION}</td>
                <td>{p.PUE_ESTADO}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditar(p)}>Editar</button>
                    <button onClick={() => handleEliminar(p.PUE_ID)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={7} style={{ textAlign: 'center' }}>No hay puestos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Puestos;