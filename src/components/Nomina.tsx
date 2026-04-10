import { useEffect, useState } from 'react';
import type { Nomina, NominaForm } from '../interfaces/nomina';
import {
  obtenerNominas,
  crearNomina,
  actualizarNomina,
  eliminarNomina
} from '../services/nomina.service';

const initialForm: NominaForm = {
  nom_total_ingresos: '',
  nom_total_descuento: '',
  nom_salario_liquido: '',
  nom_fecha_generacion: '',
  per_id: '',
  empleado_id: '',
  liq_id: '',
  nom_estado: ''
};

function NominaCRUD() {
  const [datos, setDatos] = useState<Nomina[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<NominaForm>(initialForm);

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
      const data = await obtenerNominas();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando nóminas: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    const total =
      Number(form.nom_total_ingresos || 0) -
      Number(form.nom_total_descuento || 0);

    setForm((prev) => ({
      ...prev,
      nom_salario_liquido: total.toString()
    }));
  }, [form.nom_total_ingresos, form.nom_total_descuento]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setId(null);
    setMensaje('');
    setError('');
  };

  const guardar = async () => {
    try {
      setError('');
      setMensaje('');

      if (modoEdicion && id !== null) {
        await actualizarNomina(id, form);
        setMensaje('Nómina actualizada');
      } else {
        await crearNomina(form);
        setMensaje('Nómina creada');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error: ' + err.message);
    }
  };

  const handleEditar = (n: Nomina) => {
    setModoEdicion(true);
    setId(n.NOM_ID);
    setForm({
      nom_total_ingresos: n.NOM_TOTAL_INGRESOS,
      nom_total_descuento: n.NOM_TOTAL_DESCUENTO,
      nom_salario_liquido: n.NOM_SALARIO_LIQUIDO,
      nom_fecha_generacion: n.NOM_FECHA_GENERACION,
      per_id: n.PER_ID,
      empleado_id: n.EMP_ID,
      liq_id: n.LIQ_ID,
      nom_estado: n.NOM_ESTADO
    });
  };

  const handleEliminar = async (id: number) => {
    const confirmado = window.confirm('¿Eliminar?');
    if (!confirmado) return;

    try {
      setError('');
      setMensaje('');
      await eliminarNomina(id);
      setMensaje('Nómina eliminada');
      await cargarDatos();
    } catch (err: any) {
      setError('Error eliminando nómina: ' + err.message);
    }
  };

  if (cargando) {
    return <div style={{ color: 'white', padding: '20px' }}>Cargando...</div>;
  }

  return (
    <div style={{ padding: '20px', color: 'white' }}>
      <h2>Gestión de Nómina</h2>

      {error && <p style={{ color: '#ff6b6b' }}>{error}</p>}
      {mensaje && <p style={{ color: '#7CFC00' }}>{mensaje}</p>}

      <div
        style={{
          border: '1px solid #ccc',
          padding: '16px',
          borderRadius: '8px',
          backgroundColor: '#222',
          maxWidth: '900px'
        }}
      >
        <h3>{modoEdicion ? 'Editar' : 'Nueva'} Nómina</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px'
          }}
        >
          {[
            { label: 'Ingresos', name: 'nom_total_ingresos' },
            { label: 'Descuentos', name: 'nom_total_descuento' },
            { label: 'Fecha', name: 'nom_fecha_generacion', type: 'date' },
            { label: 'Periodo ID', name: 'per_id' },
            { label: 'Empleado ID', name: 'empleado_id' },
            { label: 'Liquidación ID', name: 'liq_id' },
            { label: 'Estado', name: 'nom_estado' }
          ].map((f) => (
            <div
              key={f.name}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
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

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>Salario líquido</label>
            <input
              value={form.nom_salario_liquido}
              readOnly
              style={inputStyle}
            />
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button
            onClick={guardar}
            style={{
              padding: '8px 12px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Guardar
          </button>

          <button
            onClick={limpiarFormulario}
            style={{
              padding: '8px 12px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>
        </div>
      </div>

      <table
        style={{
          width: '100%',
          marginTop: '20px',
          borderCollapse: 'collapse',
          color: 'white'
        }}
        border={1}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Empleado</th>
            <th>Salario</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((n) => (
            <tr key={n.NOM_ID}>
              <td>{n.NOM_ID}</td>
              <td>{n.EMP_ID}</td>
              <td>{n.NOM_SALARIO_LIQUIDO}</td>
              <td>{n.NOM_ESTADO}</td>
              <td>
                <button
                  onClick={() => handleEditar(n)}
                  style={{
                    marginRight: '8px',
                    padding: '6px 10px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Editar
                </button>

                <button
                  onClick={() => handleEliminar(n.NOM_ID)}
                  style={{
                    padding: '6px 10px',
                    backgroundColor: '#e53935',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
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

export default NominaCRUD;