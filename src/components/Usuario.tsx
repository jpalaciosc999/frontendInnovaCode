import { useEffect, useState } from 'react';
import type { Usuario, UsuarioForm } from '../interfaces/usuario';
import {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
} from '../services/usuario.service';

const initialForm: UsuarioForm = {
  username: '',
  nombre_completo: '',
  correo: '',
  password: '',
  estado: 'A',
};

function UsuarioCRUD() {
  const [datos, setDatos] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<UsuarioForm>(initialForm);

  const inputStyle: React.CSSProperties = {
    padding: '5px 8px',
    fontSize: '12px',
    width: '150px',
    borderRadius: '6px',
    border: '1px solid #444',
    backgroundColor: '#111',
    color: 'white'
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerUsuarios();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando usuarios: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setId(null);
    setError('');
    setMensaje('');
  };

  const guardar = async () => {
    try {
      setError('');
      setMensaje('');
      if (modoEdicion && id !== null) {
        await actualizarUsuario(id, form);
        setMensaje('Usuario actualizado');
      } else {
        await crearUsuario(form);
        setMensaje('Usuario creado');
      }
      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  };

  const handleEditar = (u: Usuario) => {
    setModoEdicion(true);
    setId(u.id);
    setForm({
      username: u.username,
      nombre_completo: u.nombre_completo,
      correo: u.correo,
      password: u.password,
      estado: u.estado,
      rol_id: u.rol_id,
      emp_id: u.emp_id,
    });
  };

  const handleEliminar = async (id: number) => {
    const confirmado = window.confirm('¿Eliminar usuario?');
    if (!confirmado) return;
    try {
      setError('');
      setMensaje('');
      await eliminarUsuario(id);
      setMensaje('Usuario eliminado');
      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando usuario: ' + err.message);
    }
  };

  if (cargando) return <div style={{ padding: '20px', color: 'white' }}>Cargando...</div>;

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h2>Gestión de Usuarios</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}

      <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', backgroundColor: '#222', maxWidth: '900px', marginBottom: '20px' }}>
        <h3>{modoEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>

        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: '1fr 1fr' }}>
          {[
            { label: 'Username',       name: 'username' },
            { label: 'Nombre Completo',name: 'nombre_completo' },
            { label: 'Correo',         name: 'correo' },
            { label: 'Password',       name: 'password', type: 'password' },
            { label: 'Estado',         name: 'estado' },
          ].map((f) => (
            <div key={f.name} style={{ display: 'flex', flexDirection: 'column' }}>
              <label>{f.label}</label>
              <input
                type={f.type || 'text'}
                name={f.name}
                value={(form as any)[f.name]}
                onChange={handleChange}
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button onClick={guardar} style={{ padding: '8px 12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            {modoEdicion ? 'Actualizar' : 'Guardar'}
          </button>
          <button onClick={limpiarFormulario} style={{ padding: '8px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>

      {/* ✅ Tabla corregida con propiedades del backend */}
      <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
        <thead style={{ backgroundColor: '#333' }}>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Nombre Completo</th>
            <th>Correo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.nombre_completo}</td>
              <td>{u.correo}</td>
              <td>{u.estado}</td>
              <td>
                <button onClick={() => handleEditar(u)} style={{ marginRight: '8px', padding: '6px 10px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Editar
                </button>
                <button onClick={() => handleEliminar(u.id)} style={{ padding: '6px 10px', backgroundColor: '#e53935', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UsuarioCRUD;