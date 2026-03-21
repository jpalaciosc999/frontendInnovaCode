import { useEffect, useState } from 'react';
import type { Prestamo, PrestamoForm } from '../interfaces/prestamos';
import {
  obtenerPrestamos,
  crearPrestamo,
  actualizarPrestamo,
  eliminarPrestamo
} from '../services/prestamos.service';

const initialForm: PrestamoForm = {
  pre_monto_total: '',
  pre_interes: '',
  pre_plazo: '',
  pre_cuota_mensual: '',
  pre_saldo_pendiente: '',
  pre_fecha_inicio: '',
  pre_estado: ''
};

function Prestamos() {
  const [datos, setDatos] = useState<Prestamo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [prestamoId, setPrestamoId] = useState<number | null>(null);
  const [form, setForm] = useState<PrestamoForm>(initialForm);

  const cargarPrestamos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerPrestamos();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando préstamos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPrestamos();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setPrestamoId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (
      !form.pre_monto_total.trim() ||
      !form.pre_interes.trim() ||
      !form.pre_plazo.trim() ||
      !form.pre_cuota_mensual.trim() ||
      !form.pre_saldo_pendiente.trim() ||
      !form.pre_fecha_inicio.trim() ||
      !form.pre_estado.trim()
    ) {
      setError('Todos los campos son obligatorios');
      return false;
    }

    return true;
  };

  const guardarPrestamo = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && prestamoId !== null) {
        await actualizarPrestamo(prestamoId, form);
        setMensaje('Préstamo actualizado correctamente');
      } else {
        await crearPrestamo(form);
        setMensaje('Préstamo creado correctamente');
      }

      limpiarFormulario();
      await cargarPrestamos();
    } catch (err: any) {
      setError(
        'Error guardando préstamo: ' + (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEliminar = async (id: number) => {
    const confirmar = window.confirm('¿Deseas eliminar este préstamo?');
    if (!confirmar) return;

    try {
      setError('');
      setMensaje('');

      await eliminarPrestamo(id);
      setMensaje('Préstamo eliminado correctamente');

      if (prestamoId === id) {
        limpiarFormulario();
      }

      await cargarPrestamos();
    } catch (err: any) {
      setError(
        'Error eliminando préstamo: ' +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEditar = (prestamo: Prestamo) => {
    setModoEdicion(true);
    setPrestamoId(prestamo.PRE_ID);
    setMensaje('');
    setError('');

    setForm({
      pre_monto_total: String(prestamo.PRE_MONTO_TOTAL || ''),
      pre_interes: String(prestamo.PRE_INTERES || ''),
      pre_plazo: prestamo.PRE_PLAZO || '',
      pre_cuota_mensual: String(prestamo.PRE_CUOTA_MENSUAL || ''),
      pre_saldo_pendiente: String(prestamo.PRE_SALDO_PENDIENTE || ''),
      pre_fecha_inicio: prestamo.PRE_FECHA_INICIO
        ? String(prestamo.PRE_FECHA_INICIO).slice(0, 10)
        : '',
      pre_estado: prestamo.PRE_ESTADO || ''
    });
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>CRUD de Préstamos</h2>

      {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
      {mensaje && <p style={{ color: 'green', fontWeight: 'bold' }}>{mensaje}</p>}

      <div
        style={{
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          maxWidth: '700px'
        }}
      >
        <h3>{modoEdicion ? 'Editar préstamo' : 'Nuevo préstamo'}</h3>

        <div style={{ display: 'grid', gap: '10px' }}>
          <input
            type="number"
            name="pre_monto_total"
            placeholder="Monto total"
            value={form.pre_monto_total}
            onChange={handleChange}
          />

          <input
            type="number"
            name="pre_interes"
            placeholder="Interés"
            value={form.pre_interes}
            onChange={handleChange}
          />

          <input
            type="text"
            name="pre_plazo"
            placeholder="Plazo"
            value={form.pre_plazo}
            onChange={handleChange}
          />

          <input
            type="number"
            name="pre_cuota_mensual"
            placeholder="Cuota mensual"
            value={form.pre_cuota_mensual}
            onChange={handleChange}
          />

          <input
            type="number"
            name="pre_saldo_pendiente"
            placeholder="Saldo pendiente"
            value={form.pre_saldo_pendiente}
            onChange={handleChange}
          />

          <input
            type="date"
            name="pre_fecha_inicio"
            value={form.pre_fecha_inicio}
            onChange={handleChange}
          />

          <select
            name="pre_estado"
            value={form.pre_estado}
            onChange={handleChange}
          >
            <option value="">Seleccione estado</option>
            <option value="A">Activo</option>
            <option value="I">Inactivo</option>
          </select>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={guardarPrestamo}>
              {modoEdicion ? 'Actualizar' : 'Guardar'}
            </button>
            <button onClick={limpiarFormulario}>Limpiar</button>
          </div>
        </div>
      </div>

      <h3>Listado de préstamos: {datos.length}</h3>

      <div style={{ overflowX: 'auto' }}>
        <table
          border={1}
          cellPadding={8}
          cellSpacing={0}
          style={{ width: '100%', borderCollapse: 'collapse' }}
        >
          <thead>
            <tr>
              <th>ID</th>
              <th>Monto total</th>
              <th>Interés</th>
              <th>Plazo</th>
              <th>Cuota mensual</th>
              <th>Saldo pendiente</th>
              <th>Fecha inicio</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? (
              datos.map((prestamo) => (
                <tr key={prestamo.PRE_ID}>
                  <td>{prestamo.PRE_ID}</td>
                  <td>{prestamo.PRE_MONTO_TOTAL}</td>
                  <td>{prestamo.PRE_INTERES}</td>
                  <td>{prestamo.PRE_PLAZO}</td>
                  <td>{prestamo.PRE_CUOTA_MENSUAL}</td>
                  <td>{prestamo.PRE_SALDO_PENDIENTE}</td>
                  <td>
                    {prestamo.PRE_FECHA_INICIO
                      ? String(prestamo.PRE_FECHA_INICIO).slice(0, 10)
                      : ''}
                  </td>
                  <td>{prestamo.PRE_ESTADO}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEditar(prestamo)}>
                        Editar
                      </button>
                      <button onClick={() => handleEliminar(prestamo.PRE_ID)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center' }}>
                  No hay préstamos registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Prestamos;