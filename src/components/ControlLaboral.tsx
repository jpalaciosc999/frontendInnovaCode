import { useEffect, useState } from 'react';
import type { ControlLaboral, ControlLaboralForm } from '../interfaces/controlLaboral';
import {
  obtenerControles,
  crearControl,
  actualizarControl,
  eliminarControl
} from '../services/controlLaboral.service';

const initialForm: ControlLaboralForm = {
  ctl_fecha_inicio:   '',
  ctl_fecha_regreso:  '',
  ctl_motivo:         '',
  ctl_horas:          '',
  ctl_descripcion:    '',
  ctl_estado:         '',
  ctl_fecha_registro: '',
  emp_id:             ''
};

function ControlLaboralPage() {
  const [datos, setDatos]             = useState<ControlLaboral[]>([]);
  const [cargando, setCargando]       = useState(true);
  const [error, setError]             = useState('');
  const [mensaje, setMensaje]         = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [ctlId, setCtlId]             = useState<number | null>(null);
  const [form, setForm]               = useState<ControlLaboralForm>(initialForm);

  const cargarControles = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerControles();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando controles: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarControles(); }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setCtlId(null);
    setError('');
  };

  const validarFormulario = () => {
    const { ctl_fecha_inicio, ctl_fecha_regreso, ctl_motivo, ctl_horas, ctl_descripcion, ctl_estado, ctl_fecha_registro, emp_id } = form;
    if (!ctl_fecha_inicio || !ctl_fecha_regreso || !ctl_motivo || !ctl_horas ||
        !ctl_descripcion.trim() || !ctl_estado || !ctl_fecha_registro || !emp_id) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    if (ctl_fecha_regreso < ctl_fecha_inicio) {
      setError('La fecha de regreso no puede ser menor a la fecha de inicio');
      return false;
    }
    if (Number(ctl_horas) <= 0) {
      setError('Las horas deben ser un valor positivo');
      return false;
    }
    return true;
  };

  const guardarControl = async () => {
    try {
      setError(''); setMensaje('');
      if (!validarFormulario()) return;
      if (modoEdicion && ctlId !== null) {
        await actualizarControl(ctlId, form);
        setMensaje('Control actualizado correctamente');
      } else {
        await crearControl(form);
        setMensaje('Control creado correctamente');
      }
      limpiarFormulario();
      await cargarControles();
    } catch (err: any) {
      setError('Error guardando control: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este control laboral?')) return;
    try {
      setError(''); setMensaje('');
      await eliminarControl(id);
      setMensaje('Control eliminado correctamente');
      if (ctlId === id) limpiarFormulario();
      await cargarControles();
    } catch (err: any) {
      setError('Error eliminando control: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (ctl: ControlLaboral) => {
    setModoEdicion(true);
    setCtlId(ctl.CTL_ID);
    setMensaje(''); setError('');
    setForm({
      ctl_fecha_inicio:   ctl.CTL_FECHA_INICIO?.slice(0, 10)   || '',
      ctl_fecha_regreso:  ctl.CTL_FECHA_REGRESO?.slice(0, 10)  || '',
      ctl_motivo:         ctl.CTL_MOTIVO         || '',
      ctl_horas:          String(ctl.CTL_HORAS)  || '',
      ctl_descripcion:    ctl.CTL_DESCRIPCION    || '',
      ctl_estado:         ctl.CTL_ESTADO         || '',
      ctl_fecha_registro: ctl.CTL_FECHA_REGISTRO?.slice(0, 10) || '',
      emp_id:             String(ctl.EMP_ID)     || ''
    });
  };

  if (cargando) return <p>Cargando...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h2>CRUD de Control Laboral</h2>

      {error   && <p style={{ color: 'red',   fontWeight: 'bold' }}>{error}</p>}
      {mensaje && <p style={{ color: 'green', fontWeight: 'bold' }}>{mensaje}</p>}

      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '16px', marginBottom: '24px', maxWidth: '700px' }}>
        <h3>{modoEdicion ? 'Editar control laboral' : 'Nuevo control laboral'}</h3>
        <div style={{ display: 'grid', gap: '10px' }}>

          <label>
            ID Empleado
            <input type="number" name="emp_id" value={form.emp_id} onChange={handleChange}
              placeholder="ID del empleado" style={{ display: 'block', width: '100%' }} />
          </label>

          <label>
            Fecha Inicio
            <input type="date" name="ctl_fecha_inicio" value={form.ctl_fecha_inicio} onChange={handleChange}
              style={{ display: 'block', width: '100%' }} />
          </label>

          <label>
            Fecha Regreso
            <input type="date" name="ctl_fecha_regreso" value={form.ctl_fecha_regreso} onChange={handleChange}
              style={{ display: 'block', width: '100%' }} />
          </label>

          <label>
            Fecha Registro
            <input type="date" name="ctl_fecha_registro" value={form.ctl_fecha_registro} onChange={handleChange}
              style={{ display: 'block', width: '100%' }} />
          </label>

          <label>
            Motivo
            <select name="ctl_motivo" value={form.ctl_motivo} onChange={handleChange} style={{ display: 'block', width: '100%' }}>
              <option value="">Seleccione motivo</option>
              <option value="VAC">Vacaciones</option>
              <option value="PER">Permiso</option>
              <option value="ENF">Enfermedad</option>
              <option value="SUS">Suspensión</option>
              <option value="OTR">Otro</option>
            </select>
          </label>

          <label>
            Horas
            <input type="number" name="ctl_horas" value={form.ctl_horas} onChange={handleChange}
              placeholder="0.0000" step="0.0001" min="0" style={{ display: 'block', width: '100%' }} />
          </label>

          <label>
            Descripción
            <textarea name="ctl_descripcion" value={form.ctl_descripcion} onChange={handleChange}
              placeholder="Descripción del control" rows={3}
              style={{ display: 'block', width: '100%', resize: 'vertical' }} />
          </label>

          <label>
            Estado
            <select name="ctl_estado" value={form.ctl_estado} onChange={handleChange} style={{ display: 'block', width: '100%' }}>
              <option value="">Seleccione estado</option>
              <option value="P">Pendiente</option>
              <option value="A">Aprobado</option>
              <option value="R">Rechazado</option>
            </select>
          </label>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={guardarControl}>{modoEdicion ? 'Actualizar' : 'Guardar'}</button>
            <button onClick={limpiarFormulario}>Limpiar</button>
          </div>
        </div>
      </div>

      <h3>Listado de controles: {datos.length}</h3>
      <div style={{ overflowX: 'auto' }}>
        <table border={1} cellPadding={8} cellSpacing={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Emp. ID</th>
              <th>F. Inicio</th>
              <th>F. Regreso</th>
              <th>Motivo</th>
              <th>Horas</th>
              <th>Descripción</th>
              <th>Estado</th>
              <th>F. Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {datos.length > 0 ? datos.map(ctl => (
              <tr key={ctl.CTL_ID}>
                <td>{ctl.CTL_ID}</td>
                <td>{ctl.EMP_ID}</td>
                <td>{ctl.CTL_FECHA_INICIO?.slice(0, 10)}</td>
                <td>{ctl.CTL_FECHA_REGRESO?.slice(0, 10)}</td>
                <td>{ctl.CTL_MOTIVO}</td>
                <td>{ctl.CTL_HORAS}</td>
                <td>{ctl.CTL_DESCRIPCION}</td>
                <td>{ctl.CTL_ESTADO}</td>
                <td>{ctl.CTL_FECHA_REGISTRO?.slice(0, 10)}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEditar(ctl)}>Editar</button>
                    <button onClick={() => handleEliminar(ctl.CTL_ID)}>Eliminar</button>
                  </div>
                </td>
              </tr>
            )) : (
              <tr><td colSpan={10} style={{ textAlign: 'center' }}>No hay controles registrados</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ControlLaboralPage;