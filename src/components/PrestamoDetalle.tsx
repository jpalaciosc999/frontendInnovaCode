import { useEffect, useState } from 'react';
import type {
  PrestamoDetalle,
  PrestamoDetalleForm
} from '../interfaces/prestamoDetalle';
import {
  obtenerPrestamoDetalles,
  crearPrestamoDetalle,
  actualizarPrestamoDetalle,
  eliminarPrestamoDetalle
} from '../services/prestamoDetalle.service';

const initialForm: PrestamoDetalleForm = {
  pde_numero_cuota: '',
  pde_fecha_pago: '',
  pde_monto: '',
  pde_saldo_restante: '',
  pde_estado: '',
  pre_id: ''
};

function PrestamoDetalleView() {
  const [datos, setDatos] = useState<PrestamoDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [form, setForm] = useState<PrestamoDetalleForm>(initialForm);

  const cargarPrestamoDetalles = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerPrestamoDetalles();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando detalle de préstamos: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPrestamoDetalles();
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
    setDetalleId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (
      !form.pde_numero_cuota.trim() ||
      !form.pde_fecha_pago.trim() ||
      !form.pde_monto.trim() ||
      !form.pde_saldo_restante.trim() ||
      !form.pde_estado.trim() ||
      !form.pre_id.trim()
    ) {
      setError('Todos los campos son obligatorios');
      return false;
    }

    return true;
  };

  const guardarPrestamoDetalle = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && detalleId !== null) {
        await actualizarPrestamoDetalle(detalleId, form);
        setMensaje('Detalle de préstamo actualizado correctamente');
      } else {
        await crearPrestamoDetalle(form);
        setMensaje('Detalle de préstamo creado correctamente');
      }

      limpiarFormulario();
      await cargarPrestamoDetalles();
    } catch (err: any) {
      setError(
        'Error guardando detalle de préstamo: ' +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEliminar = async (id: number) => {
    const confirmar = window.confirm('¿Deseas eliminar este detalle de préstamo?');
    if (!confirmar) return;

    try {
      setError('');
      setMensaje('');

      await eliminarPrestamoDetalle(id);
      setMensaje('Detalle de préstamo eliminado correctamente');

      if (detalleId === id) {
        limpiarFormulario();
      }

      await cargarPrestamoDetalles();
    } catch (err: any) {
      setError(
        'Error eliminando detalle de préstamo: ' +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEditar = (detalle: PrestamoDetalle) => {
    setModoEdicion(true);
    setDetalleId(detalle.PDE_ID);
    setMensaje('');
    setError('');

    setForm({
      pde_numero_cuota: String(detalle.PDE_NUMERO_CUOTA || ''),
      pde_fecha_pago: detalle.PDE_FECHA_PAGO
        ? String(detalle.PDE_FECHA_PAGO).slice(0, 10)
        : '',
      pde_monto: String(detalle.PDE_MONTO || ''),
      pde_saldo_restante: String(detalle.PDE_SALDO_RESTANTE || ''),
      pde_estado: detalle.PDE_ESTADO || '',
      pre_id: String(detalle.PRE_ID || '')
    });
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>CRUD de Detalle de Préstamo</h2>

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
        <h3>{modoEdicion ? 'Editar detalle' : 'Nuevo detalle'}</h3>

        <div style={{ display: 'grid', gap: '10px' }}>
          <input
            type="number"
            name="pde_numero_cuota"
            placeholder="Número de cuota"
            value={form.pde_numero_cuota}
            onChange={handleChange}
          />

          <input
            type="date"
            name="pde_fecha_pago"
            value={form.pde_fecha_pago}
            onChange={handleChange}
          />

          <input
            type="number"
            name="pde_monto"
            placeholder="Monto"
            value={form.pde_monto}
            onChange={handleChange}
          />

          <input
            type="number"
            name="pde_saldo_restante"
            placeholder="Saldo restante"
            value={form.pde_saldo_restante}
            onChange={handleChange}
          />

          <select
            name="pde_estado"
            value={form.pde_estado}
            onChange={handleChange}
          >
            <option value="">Seleccione estado</option>
            <option value="P">Pendiente</option>
            <option value="C">Cancelado</option>
          </select>

          <input
            type="number"
            name="pre_id"
            placeholder="ID préstamo"
            value={form.pre_id}
            onChange={handleChange}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={guardarPrestamoDetalle}>
              {modoEdicion ? 'Actualizar' : 'Guardar'}
            </button>
            <button onClick={limpiarFormulario}>Limpiar</button>
          </div>
        </div>
      </div>

      <h3>Listado de detalle de préstamos: {datos.length}</h3>

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
              <th>No. cuota</th>
              <th>Fecha pago</th>
              <th>Monto</th>
              <th>Saldo restante</th>
              <th>Estado</th>
              <th>Préstamo ID</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? (
              datos.map((detalle) => (
                <tr key={detalle.PDE_ID}>
                  <td>{detalle.PDE_ID}</td>
                  <td>{detalle.PDE_NUMERO_CUOTA}</td>
                  <td>{detalle.PDE_FECHA_PAGO ? String(detalle.PDE_FECHA_PAGO).slice(0, 10) : ''}</td>
                  <td>{detalle.PDE_MONTO}</td>
                  <td>{detalle.PDE_SALDO_RESTANTE}</td>
                  <td>{detalle.PDE_ESTADO}</td>
                  <td>{detalle.PRE_ID}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEditar(detalle)}>Editar</button>
                      <button onClick={() => handleEliminar(detalle.PDE_ID)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center' }}>
                  No hay detalles de préstamo registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PrestamoDetalleView;