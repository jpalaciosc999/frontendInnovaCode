import { useEffect, useState } from 'react';
import type { Empleado, EmpleadoForm } from '../interfaces/empleados';
import {
  obtenerEmpleados,
  crearEmpleado,
  actualizarEmpleado,
  eliminarEmpleado
} from '../services/empleados.service';

const initialForm: EmpleadoForm = {
  emp_nombre: '',
  emp_apellido: '',
  emp_dpi: '',
  emp_nit: '',
  emp_telefono: '',
  emp_fecha_contratacion: '',
  emp_estado: ''
};

function PruebaAxios() {
  const [datos, setDatos] = useState<Empleado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [empleadoId, setEmpleadoId] = useState<number | null>(null);
  const [form, setForm] = useState<EmpleadoForm>(initialForm);

  const cargarEmpleados = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerEmpleados();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando empleados: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEmpleados();
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
    setEmpleadoId(null);
    setError('');
  };

  const validarFormulario = () => {
    if (
      !form.emp_nombre.trim() ||
      !form.emp_apellido.trim() ||
      !form.emp_dpi.trim() ||
      !form.emp_nit.trim() ||
      !form.emp_telefono.trim() ||
      !form.emp_fecha_contratacion.trim() ||
      !form.emp_estado.trim()
    ) {
      setError('Todos los campos son obligatorios');
      return false;
    }

    return true;
  };

  const guardarEmpleado = async () => {
    try {
      setError('');
      setMensaje('');

      if (!validarFormulario()) return;

      if (modoEdicion && empleadoId !== null) {
        await actualizarEmpleado(empleadoId, form);
        setMensaje('Empleado actualizado correctamente');
      } else {
        await crearEmpleado(form);
        setMensaje('Empleado creado correctamente');
      }

      limpiarFormulario();
      await cargarEmpleados();
    } catch (err: any) {
      setError(
        'Error guardando empleado: ' +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEliminar = async (id: number) => {
    const confirmar = window.confirm('¿Deseas eliminar este empleado?');
    if (!confirmar) return;

    try {
      setError('');
      setMensaje('');

      await eliminarEmpleado(id);
      setMensaje('Empleado eliminado correctamente');

      if (empleadoId === id) {
        limpiarFormulario();
      }

      await cargarEmpleados();
    } catch (err: any) {
      setError(
        'Error eliminando empleado: ' +
          (err.response?.data?.error || err.message)
      );
    }
  };

  const handleEditar = (empleado: Empleado) => {
    setModoEdicion(true);
    setEmpleadoId(empleado.EMP_ID);
    setMensaje('');
    setError('');

    setForm({
      emp_nombre: empleado.EMP_NOMBRE || '',
      emp_apellido: empleado.EMP_APELLIDO || '',
      emp_dpi: String(empleado.EMP_DPI || ''),
      emp_nit: String(empleado.EMP_NIT || ''),
      emp_telefono: String(empleado.EMP_TELEFONO || ''),
      emp_fecha_contratacion: empleado.EMP_FECHA_CONTRATACION
        ? String(empleado.EMP_FECHA_CONTRATACION).slice(0, 10)
        : '',
      emp_estado: empleado.EMP_ESTADO || ''
    });
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>CRUD de Empleados</h2>

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
        <h3>{modoEdicion ? 'Editar empleado' : 'Nuevo empleado'}</h3>

        <div style={{ display: 'grid', gap: '10px' }}>
          <input
            type="text"
            name="emp_nombre"
            placeholder="Nombre"
            value={form.emp_nombre}
            onChange={handleChange}
          />

          <input
            type="text"
            name="emp_apellido"
            placeholder="Apellido"
            value={form.emp_apellido}
            onChange={handleChange}
          />

          <input
            type="text"
            name="emp_dpi"
            placeholder="DPI"
            value={form.emp_dpi}
            onChange={handleChange}
          />

          <input
            type="text"
            name="emp_nit"
            placeholder="NIT"
            value={form.emp_nit}
            onChange={handleChange}
          />

          <input
            type="text"
            name="emp_telefono"
            placeholder="Teléfono"
            value={form.emp_telefono}
            onChange={handleChange}
          />

          <input
            type="date"
            name="emp_fecha_contratacion"
            value={form.emp_fecha_contratacion}
            onChange={handleChange}
          />

          <select
            name="emp_estado"
            value={form.emp_estado}
            onChange={handleChange}
          >
            <option value="">Seleccione estado</option>
            <option value="A">Activo</option>
            <option value="I">Inactivo</option>
          </select>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={guardarEmpleado}>
              {modoEdicion ? 'Actualizar' : 'Guardar'}
            </button>

            <button onClick={limpiarFormulario}>Limpiar</button>
          </div>
        </div>
      </div>

      <h3>Listado de empleados: {datos.length}</h3>

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
              <th>Nombre</th>
              <th>Apellido</th>
              <th>DPI</th>
              <th>NIT</th>
              <th>Teléfono</th>
              <th>Fecha contratación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? (
              datos.map((empleado) => (
                <tr key={empleado.EMP_ID}>
                  <td>{empleado.EMP_ID}</td>
                  <td>{empleado.EMP_NOMBRE}</td>
                  <td>{empleado.EMP_APELLIDO}</td>
                  <td>{empleado.EMP_DPI}</td>
                  <td>{empleado.EMP_NIT}</td>
                  <td>{empleado.EMP_TELEFONO}</td>
                  <td>
                    {empleado.EMP_FECHA_CONTRATACION
                      ? String(empleado.EMP_FECHA_CONTRATACION).slice(0, 10)
                      : ''}
                  </td>
                  <td>{empleado.EMP_ESTADO}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEditar(empleado)}>
                        Editar
                      </button>
                      <button onClick={() => handleEliminar(empleado.EMP_ID)}>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center' }}>
                  No hay empleados registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PruebaAxios;