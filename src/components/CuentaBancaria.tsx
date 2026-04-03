import { useEffect, useState } from 'react';
import type { CuentaBancaria, CuentaBancariaForm } from '../interfaces/cuentaBancaria';
import {
  obtenerCuentas,
  crearCuenta,
  actualizarCuenta,
  eliminarCuenta
} from '../services/cuentaBancaria.service';

const initialForm: CuentaBancariaForm = {
  ban_nombre: '',
  cue_numero: '',
  cue_tipo:   '',
  emp_id:     ''
};

function CuentaBancariaPage() {
  const [datos, setDatos]             = useState<CuentaBancaria[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState('');
  const [mensaje, setMensaje]         = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cueId, setCueId]             = useState<number | null>(null);
  const [form, setForm]               = useState<CuentaBancariaForm>(initialForm);

  const cargarCuentas = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerCuentas();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando cuentas: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarCuentas(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setCueId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (!form.ban_nombre.trim() || !form.cue_numero.trim() || !form.cue_tipo || !form.emp_id) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    if (form.cue_numero.length > 50) {
      setError('El número de cuenta no puede exceder 50 caracteres');
      return false;
    }
    return true;
  };

  const guardarCuenta = async () => {
    try {
      setError(''); setMensaje('');
      if (!validarFormulario()) return;
      if (modoEdicion && cueId !== null) {
        await actualizarCuenta(cueId, form);
        setMensaje('Cuenta actualizada correctamente');
      } else {
        await crearCuenta(form);
        setMensaje('Cuenta creada correctamente');
      }
      limpiarFormulario();
      await cargarCuentas();
    } catch (err: any) {
      setError('Error guardando cuenta: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar esta cuenta bancaria?')) return;
    try {
      setError(''); setMensaje('');
      await eliminarCuenta(id);
      setMensaje('Cuenta eliminada correctamente');
      if (cueId === id) limpiarFormulario();
      await cargarCuentas();
    } catch (err: any) {
      setError('Error eliminando cuenta: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (cue: CuentaBancaria) => {
    setModoEdicion(true);
    setCueId(cue.CUE_ID);
    setMensaje(''); setError('');
    setForm({
      ban_nombre: cue.CUE_NOMBRE || '',
      cue_numero: cue.CUE_NUMERO || '',
      cue_tipo:   cue.CUE_TIPO   || '',
      emp_id:     String(cue.EMP_ID) || ''
    });
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>CRUD de Cuentas Bancarias</h2>

      {error   && <p style={{ color: 'red',   fontWeight: 'bold' }}>{error}</p>}
      {mensaje && <p style={{ color: 'green', fontWeight: 'bold' }}>{mensaje}</p>}

      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', marginBottom: '24px', maxWidth: '700px' }}>
        <h3>{modoEdicion ? 'Editar cuenta bancaria' : 'Nueva cuenta bancaria'}</h3>
        <div style={{ display: 'grid', gap: '10px' }}>

          <label>
            ID Empleado
            <input type="number" name="emp_id" value={form.emp_id} onChange={handleChange}
              placeholder="ID del empleado" style={{ display: 'block', width: '100%' }} />
          </label>

          <label>
            Nombre del Banco
            <input type="text" name="ban_nombre" value={form.ban_nombre} onChange={handleChange}
              placeholder="Ej: Banco Industrial" maxLength={100}
              style={{ display: 'block', width: '100%' }} />
          </label>

          <label>
            Número de Cuenta
            <input type="text" name="cue_numero" value={form.cue_numero} onChange={handleChange}
              placeholder="Ej: 0123456789" maxLength={50}
              style={{ display: 'block', width: '100%' }} />
          </label>

          <label>
            Tipo de Cuenta
            <select name="cue_tipo" value={form.cue_tipo} onChange={handleChange}
              style={{ display: 'block', width: '100%' }}>
              <option value="">Seleccione tipo</option>
              <option value="MON">Monetaria</option>
              <option value="AHO">Ahorros</option>
              <option value="COR">Corriente</option>
            </select>
          </label>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={guardarCuenta}>{modoEdicion ? 'Actualizar' : 'Guardar'}</button>
            <button onClick={limpiarFormulario}>Limpiar</button>
          </div>
        </div>
      </div>

      <h3>Listado de cuentas: {datos.length}</h3>
      <div style={{ overflowX: 'auto' }}>
        <table border={1} cellPadding={8} cellSpacing={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Emp. ID</th>
              <th>Nombre Banco</th>
              <th>Número</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? datos.map(cue => (
              <tr key={cue.CUE_ID}>
                <td>{cue.CUE_ID}</td>
                <td>{cue.EMP_ID}</td>
                <td>{cue.CUE_NOMBRE}</td>
                <td>{cue.CUE_NUMERO}</td>
                <td>{cue.CUE_TIPO}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditar(cue)}>Editar</button>
                    <button onClick={() => handleEliminar(cue.CUE_ID)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={6} style={{ textAlign: 'center' }}>No hay cuentas registradas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CuentaBancariaPage;