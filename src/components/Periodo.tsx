// pages/Periodos.tsx
import { useEffect, useState } from 'react';
import type { Periodo, PeriodoForm } from '../interfaces/periodo';
import {
  obtenerPeriodos,
  crearPeriodo,
  actualizarPeriodo,
  eliminarPeriodo
} from '../services/periodo.service';

const initialForm: PeriodoForm = {
  fecha_inicio: '',
  fecha_fin: '',
  fecha_pago: '',
  estado: ''
};

function Periodos() {
  const [datos, setDatos]             = useState<Periodo[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState('');
  const [mensaje, setMensaje]         = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [perId, setPerId]             = useState<number | null>(null);
  const [form, setForm]               = useState<PeriodoForm>(initialForm);

  const cargarPeriodos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerPeriodos();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando periodos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarPeriodos(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setPerId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!form.fecha_inicio || !form.fecha_fin || !form.fecha_pago || !form.estado.trim()) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    if (form.fecha_fin < form.fecha_inicio) {
      setError('La fecha fin no puede ser menor a la fecha inicio');
      return false;
    }
    return true;
  };

  const guardarPeriodo = async () => {
    try {
      setError(''); setMensaje('');
      if (!validarFormulario()) return;
      if (modoEdicion && perId !== null) {
        await actualizarPeriodo(perId, form);
        setMensaje('Periodo actualizado correctamente');
      } else {
        await crearPeriodo(form);
        setMensaje('Periodo creado correctamente');
      }
      limpiarFormulario();
      await cargarPeriodos();
    } catch (err: any) {
      setError('Error guardando periodo: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este periodo?')) return;
    try {
      setError(''); setMensaje('');
      await eliminarPeriodo(id);
      setMensaje('Periodo eliminado correctamente');
      if (perId === id) limpiarFormulario();
      await cargarPeriodos();
    } catch (err: any) {
      setError('Error eliminando periodo: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (per: Periodo) => {
    setModoEdicion(true);
    setPerId(per.PER_ID);
    setMensaje(''); setError('');
    setForm({
      fecha_inicio: per.PER_FECHA_INICIO?.slice(0, 10) || '',
      fecha_fin:    per.PER_FECHA_FIN?.slice(0, 10)    || '',
      fecha_pago:   per.PER_FECHA_PAGO?.slice(0, 10)   || '',
      estado:       per.PER_ESTADO || ''
    });
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>CRUD de Periodos</h2>

      {error   && <p style={{ color: 'red',   fontWeight: 'bold' }}>{error}</p>}
      {mensaje && <p style={{ color: 'green', fontWeight: 'bold' }}>{mensaje}</p>}

      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', marginBottom: '24px', maxWidth: '700px' }}>
        <h3>{modoEdicion ? 'Editar periodo' : 'Nuevo periodo'}</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          <label>
            Fecha Inicio
            <input type="date" name="fecha_inicio" value={form.fecha_inicio} onChange={handleChange} style={{ display: 'block', width: '100%' }} />
          </label>
          <label>
            Fecha Fin
            <input type="date" name="fecha_fin" value={form.fecha_fin} onChange={handleChange} style={{ display: 'block', width: '100%' }} />
          </label>
          <label>
            Fecha Pago
            <input type="date" name="fecha_pago" value={form.fecha_pago} onChange={handleChange} style={{ display: 'block', width: '100%' }} />
          </label>
          <select name="estado" value={form.estado} onChange={handleChange}>
            <option value="">Seleccione estado</option>
            <option value="A">Activo</option>
            <option value="I">Inactivo</option>
          </select>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={guardarPeriodo}>{modoEdicion ? 'Actualizar' : 'Guardar'}</button>
            <button onClick={limpiarFormulario}>Limpiar</button>
          </div>
        </div>
      </div>

      <h3>Listado de periodos: {datos.length}</h3>
      <div style={{ overflowX: 'auto' }}>
        <table border={1} cellPadding={8} cellSpacing={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Fecha Inicio</th>
              <th>Fecha Fin</th>
              <th>Fecha Pago</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? datos.map(per => (
              <tr key={per.PER_ID}>
                <td>{per.PER_ID}</td>
                <td>{per.PER_FECHA_INICIO?.slice(0, 10)}</td>
                <td>{per.PER_FECHA_FIN?.slice(0, 10)}</td>
                <td>{per.PER_FECHA_PAGO?.slice(0, 10)}</td>
                <td>{per.PER_ESTADO}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditar(per)}>Editar</button>
                    <button onClick={() => handleEliminar(per.PER_ID)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>No hay periodos registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Periodos;