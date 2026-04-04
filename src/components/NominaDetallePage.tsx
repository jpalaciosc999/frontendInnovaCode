import { useEffect, useState } from 'react';
import type { NominaDetalle, NominaDetalleForm } from '../interfaces/nomina-detalle';
import {
    obtenerDetallesNomina,
    crearDetalleNomina,
    actualizarDetalleNomina,
    eliminarDetalleNomina
} from '../services/nomina-detalle.service.ts';

const initialForm: NominaDetalleForm = {
    det_referencia: '',
    det_monto: '',
    nom_id: '',
    tis_id: '',
    tds_id: '',
    kre_id: ''
};

function NominaDetalleCRUD() {
    const [datos, setDatos] = useState<NominaDetalle[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [detalleId, setDetalleId] = useState<number | null>(null);
    const [form, setForm] = useState<NominaDetalleForm>(initialForm);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError('');
            const data = await obtenerDetallesNomina();
            setDatos(data);
        } catch (err: any) {
            setError('Error cargando detalles de nómina: ' + err.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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
        if (!form.det_referencia || !form.det_monto || !form.nom_id) {
            setError('Referencia, Monto y Nom_ID son obligatorios');
            return false;
        }
        return true;
    };

    const guardarDetalle = async () => {
        try {
            setError('');
            setMensaje('');
            if (!validarFormulario()) return;

            if (modoEdicion && detalleId !== null) {
                await actualizarDetalleNomina(detalleId, form);
                setMensaje('Registro actualizado correctamente');
            } else {
                await crearDetalleNomina(form);
                setMensaje('Registro creado correctamente');
            }
            limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            setError('Error guardando registro: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Deseas eliminar este registro de nómina?')) return;
        try {
            setError('');
            setMensaje('');
            await eliminarDetalleNomina(id);
            setMensaje('Registro eliminado correctamente');
            await cargarDatos();
        } catch (err: any) {
            setError('Error eliminando registro: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEditar = (d: NominaDetalle) => {
        setModoEdicion(true);
        setDetalleId(d.DET_ID);
        setForm({
            det_referencia: d.DET_REFERENCIA?.toString() || '',
            det_monto: d.DET_MONTO?.toString() || '',
            nom_id: d.NOM_ID?.toString() || '',
            tis_id: d.TIS_ID?.toString() || '',
            tds_id: d.TDS_ID?.toString() || '',
            kre_id: d.KRE_ID?.toString() || ''
        });
    };

    if (cargando) return <p>Cargando detalles de nómina...</p>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', color: 'white' }}>
            <h2>CRUD Detalle de Nómina</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}

            <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', maxWidth: '700px', marginBottom: '20px', backgroundColor: '#222' }}>
                <h3>{modoEdicion ? 'Editar Detalle' : 'Nuevo Detalle'}</h3>
                <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>Referencia:</label>
                        <input type="text" name="det_referencia" placeholder="Ej: 101" value={form.det_referencia} onChange={handleChange} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>Monto:</label>
                        <input type="number" name="det_monto" placeholder="0.00" value={form.det_monto} onChange={handleChange} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>Nómina ID:</label>
                        <input type="number" name="nom_id" placeholder="ID Nómina" value={form.nom_id} onChange={handleChange} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>TIS ID (Ingreso):</label>
                        <input type="number" name="tis_id" placeholder="ID Tipo Ingreso" value={form.tis_id} onChange={handleChange} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>TDS ID (Descuento):</label>
                        <input type="number" name="tds_id" placeholder="ID Tipo Descuento" value={form.tds_id} onChange={handleChange} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>KRE ID (KPI):</label>
                        <input type="number" name="kre_id" placeholder="ID KPI Resultado" value={form.kre_id} onChange={handleChange} />
                    </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button onClick={guardarDetalle} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}>
                        {modoEdicion ? 'Actualizar' : 'Guardar'}
                    </button>
                    <button onClick={limpiarFormulario} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}>
                        Limpiar / Cancelar
                    </button>
                </div>
            </div>

            <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', color: 'white', borderColor: '#444' }}>
                <thead style={{ backgroundColor: '#333' }}>
                    <tr>
                        <th>ID</th>
                        <th>Referencia</th>
                        <th>Monto</th>
                        <th>Nomina ID</th>
                        <th>Ingreso</th>
                        <th>Descuento</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {datos.length > 0 ? datos.map((d) => (
                        <tr key={d.DET_ID}>
                            <td style={{ textAlign: 'center' }}>{d.DET_ID}</td>
                            <td>{d.DET_REFERENCIA}</td>
                            <td style={{ textAlign: 'right' }}>Q{d.DET_MONTO}</td>
                            <td style={{ textAlign: 'center' }}>{d.NOM_ID}</td>
                            <td style={{ textAlign: 'center' }}>{d.TIS_ID || '-'}</td>
                            <td style={{ textAlign: 'center' }}>{d.TDS_ID || '-'}</td>
                            <td style={{ textAlign: 'center' }}>
                                <button onClick={() => handleEditar(d)} style={{ marginRight: '5px' }}>Editar</button>
                                <button onClick={() => handleEliminar(d.DET_ID)} style={{ backgroundColor: '#ff5555', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Eliminar</button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'center' }}>No hay registros disponibles</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default NominaDetalleCRUD;