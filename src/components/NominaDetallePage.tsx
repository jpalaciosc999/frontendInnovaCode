import { useEffect, useState } from 'react';
import type { NominaDetalle, NominaDetalleForm } from '../interfaces/nomina-detalle';
import {
    obtenerDetallesNomina,
    crearDetalleNomina,
    actualizarDetalleNomina,
    eliminarDetalleNomina
} from '../services/nomina-detalle.service.ts';

const initialForm: NominaDetalleForm = {
    det_referencia: 0,
    det_monto: 0,
    nom_id: 0,
    tis_id: 0,
    tds_id: 0,
    kre_id: 0
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
        if (
            form.det_referencia === 0 ||
            form.det_monto === 0 ||
            form.nom_id === 0
        ) {
            setError('Referencia, Monto y Nom_ID son obligatorios');
            return false;
        }
        return true;
    };


    const limpiarDatos = (form: NominaDetalleForm) => {
        return {
            det_referencia: form.det_referencia ? Number(form.det_referencia) : null,
            det_monto: form.det_monto ? Number(form.det_monto) : null,
            nom_id: form.nom_id ? Number(form.nom_id) : null,
            tis_id: form.tis_id ? Number(form.tis_id) : null,
            tds_id: form.tds_id ? Number(form.tds_id) : null,
            kre_id: form.kre_id ? Number(form.kre_id) : null
        };
    };

    const guardarDetalle = async () => {
        try {
            setError('');
            setMensaje('');

            if (!validarFormulario()) return;

            const dataLimpia = limpiarDatos(form);

            if (modoEdicion && detalleId !== null) {
                await actualizarDetalleNomina(detalleId, dataLimpia);
                setMensaje('Registro actualizado correctamente');
            } else {
                await crearDetalleNomina(dataLimpia);
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
            det_referencia: d.DET_REFERENCIA ?? 0,
            det_monto: d.DET_MONTO ?? 0,
            nom_id: d.NOM_ID ?? 0,
            tis_id: d.TIS_ID ?? 0,
            tds_id: d.TDS_ID ?? 0,
            kre_id: d.KRE_ID ?? 0
        });
    };

    if (cargando) return <p>Cargando detalles de nómina...</p>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', color: 'white' }}>
            <h2>CRUD Detalle de Nómina</h2>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}

            {/* FORMULARIO (TU DISEÑO SE MANTIENE) */}
            <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', maxWidth: '700px', marginBottom: '20px', backgroundColor: '#222' }}>
                <h3>{modoEdicion ? 'Editar Detalle' : 'Nuevo Detalle'}</h3>

                <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>Referencia:</label>
                        <input type="text" name="det_referencia" value={form.det_referencia ?? 0 } onChange={handleChange} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>Monto:</label>
                        <input type="number" name="det_monto" value={form.det_monto ?? 0 } onChange={handleChange} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>Nómina ID:</label>
                        <input type="number" name="nom_id" value={form.nom_id ?? 0 } onChange={handleChange} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>TIS ID:</label>
                        <input type="number" name="tis_id" value={form.tis_id ?? 0 } onChange={handleChange} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>TDS ID:</label>
                        <input type="number" name="tds_id" value={form.tds_id ?? 0 } onChange={handleChange} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>KRE ID:</label>
                        <input type="number" name="kre_id" value={form.kre_id ?? 0 } onChange={handleChange} />
                    </div>

                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button onClick={guardarDetalle} style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none' }}>
                        {modoEdicion ? 'Actualizar' : 'Guardar'}
                    </button>
                    <button onClick={limpiarFormulario} style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none' }}>
                        Limpiar
                    </button>
                </div>
            </div>

            {/* TABLA (DISEÑO IGUAL) */}
            <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', color: 'white', borderColor: '#444' }}>
                <thead style={{ backgroundColor: '#333' }}>
                    <tr>
                        <th>ID</th>
                        <th>Referencia</th>
                        <th>Monto</th>
                        <th>Nomina</th>
                        <th>Ingreso</th>
                        <th>Descuento</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody>
                    {datos.length > 0 ? datos.map((d) => (
                        <tr key={d.DET_ID}>
                            <td>{d.DET_ID}</td>
                            <td>{d.DET_REFERENCIA}</td>
                            <td>Q{d.DET_MONTO}</td>
                            <td>{d.NOM_ID}</td>
                            <td>{d.TIS_ID || '-'}</td>
                            <td>{d.TDS_ID || '-'}</td>
                            <td>
                                <button onClick={() => handleEditar(d)}>Editar</button>
                                <button onClick={() => handleEliminar(d.DET_ID)}>Eliminar</button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={7} style={{ textAlign: 'center' }}>No hay registros</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default NominaDetalleCRUD;