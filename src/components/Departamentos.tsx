import { useEffect, useState } from 'react';
import api from '../api/axios';

interface Departamento {
  DEP_ID: number;
  DEP_NOMBRE: string;
  DEP_DESCRIPCION: string;
  DEP_ESTADO: string;
}

const vacio = { DEP_NOMBRE: '', DEP_DESCRIPCION: '', DEP_ESTADO: 'A' };

export default function Departamentos() {
  const [datos, setDatos]     = useState<Departamento[]>([]);
  const [form, setForm]       = useState(vacio);
  const [editId, setEditId]   = useState<number | null>(null);
  const [mensaje, setMensaje] = useState('');

  const cargar = async () => {
    const res = await api.get('/departamentos');
    setDatos(res.data);
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    const body = { nombre: form.DEP_NOMBRE, descripcion: form.DEP_DESCRIPCION, estado: form.DEP_ESTADO };
    if (editId) {
      await api.put(`/departamentos/${editId}`, body);
      setMensaje('Departamento actualizado correctamente');
    } else {
      await api.post('/departamentos', body);
      setMensaje('Departamento creado correctamente');
    }
    setForm(vacio);
    setEditId(null);
    cargar();
    setTimeout(() => setMensaje(''), 3000);
  };

  const editar = (dep: Departamento) => {
    setForm({ DEP_NOMBRE: dep.DEP_NOMBRE, DEP_DESCRIPCION: dep.DEP_DESCRIPCION, DEP_ESTADO: dep.DEP_ESTADO });
    setEditId(dep.DEP_ID);
  };

  const desactivar = async (id: number) => {
    if (!confirm('¿Desactivar este departamento?')) return;
    await api.put(`/departamentos/desactivar/${id}`);
    setMensaje('Departamento desactivado');
    cargar();
    setTimeout(() => setMensaje(''), 3000);
  };

  return (
    <div style={{ padding: '1rem 2rem', fontFamily: 'sans-serif' }}>
      <h2 style={{ textAlign: 'center' }}>CRUD de Departamentos</h2>

      {mensaje && <p style={{ color: 'green', textAlign: 'center' }}>{mensaje}</p>}

      <fieldset style={{ marginBottom: '1.5rem' }}>
        <legend>{editId ? 'Editar departamento' : 'Nuevo departamento'}</legend>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <div>
            <label>Nombre<br />
              <input value={form.DEP_NOMBRE} onChange={e => setForm({...form, DEP_NOMBRE: e.target.value})} />
            </label>
          </div>
          <div>
            <label>Descripción<br />
              <input value={form.DEP_DESCRIPCION} onChange={e => setForm({...form, DEP_DESCRIPCION: e.target.value})} />
            </label>
          </div>
          <div>
            <label>Estado<br />
              <select value={form.DEP_ESTADO} onChange={e => setForm({...form, DEP_ESTADO: e.target.value})}>
                <option value="A">Activo</option>
                <option value="I">Inactivo</option>
              </select>
            </label>
          </div>
        </div>
        <button onClick={guardar}>Guardar</button>
        &nbsp;
        <button onClick={() => { setForm(vacio); setEditId(null); }}>Limpiar</button>
      </fieldset>

      <p>Listado de departamentos: <strong>{datos.length}</strong></p>

      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f0f0f0' }}>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datos.map(dep => (
            <tr key={dep.DEP_ID}>
              <td>{dep.DEP_ID}</td>
              <td>{dep.DEP_NOMBRE}</td>
              <td>{dep.DEP_DESCRIPCION}</td>
              <td>{dep.DEP_ESTADO === 'A' ? 'Activo' : 'Inactivo'}</td>
              <td>
                <button onClick={() => editar(dep)}>Editar</button>
                &nbsp;
                <button onClick={() => desactivar(dep.DEP_ID)}>Desactivar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}