import { useEffect, useState } from 'react';
import type { KPI, KPIForm } from '../interfaces/kpi';
import {
    obtenerKPIs,
    crearKPI,
    actualizarKPI,
    eliminarKPI
} from '../services/kpi.service';

const initialForm: KPIForm = {
    kpi_nombre: '',
    kpi_tipo: '',
    kpi_valor: ''
};

function KPICRUD() {
    const [datos, setDatos] = useState<KPI[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [kpiId, setKpiId] = useState<number | null>(null);
    const [form, setForm] = useState<KPIForm>(initialForm);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError('');
            const data = await obtenerKPIs();
            setDatos(data);
        } catch (err: any) {
            setError('Error cargando KPIs: ' + err.message);
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
        setKpiId(null);
        setError('');
    };

    const validarFormulario = () => {
        if (!form.kpi_nombre || !form.kpi_tipo || !form.kpi_valor) {
            setError('Todos los campos son obligatorios');
            return false;
        }
        return true;
    };

    const guardarKPI = async () => {
        try {
            setError('');
            setMensaje('');
            if (!validarFormulario()) return;

            if (modoEdicion && kpiId !== null) {
                await actualizarKPI(kpiId, form);
                setMensaje('KPI actualizado correctamente');
            } else {
                await crearKPI(form);
                setMensaje('KPI creado correctamente');
            }
            limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            setError('Error guardando KPI: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Deseas eliminar este KPI?')) return;
        try {
            setError('');
            setMensaje('');
            await eliminarKPI(id);
            setMensaje('KPI eliminado correctamente');
            await cargarDatos();
        } catch (err: any) {
            setError('Error eliminando KPI: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEditar = (k: KPI) => {
        setModoEdicion(true);
        setKpiId(k.KPI_ID);
        setForm({
            kpi_nombre: k.KPI_NOMBRE,
            kpi_tipo: k.KPI_TIPO,
            kpi_valor: k.KPI_VALOR?.toString() || ''
        });
    };

    if (cargando) return <p>Cargando maestro de KPIs...</p>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', color: 'white' }}>
            <h2>Maestro de KPIs (Indicadores)</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}

            <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', maxWidth: '700px', marginBottom: '20px', backgroundColor: '#222' }}>
                <h3>{modoEdicion ? 'Editar KPI' : 'Nuevo KPI'}</h3>
                <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>Nombre del KPI:</label>
                        <input type="text" name="kpi_nombre" placeholder="Ej: Puntualidad" value={form.kpi_nombre} onChange={handleChange} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>Tipo:</label>
                        <input type="text" name="kpi_tipo" placeholder="Ej: Bono / Descuento" value={form.kpi_tipo} onChange={handleChange} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <label>Valor Base:</label>
                        <input type="number" name="kpi_valor" placeholder="0" value={form.kpi_valor} onChange={handleChange} />
                    </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button onClick={guardarKPI} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}>
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
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>Valor Base</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {datos.length > 0 ? datos.map((k) => (
                        <tr key={k.KPI_ID}>
                            <td style={{ textAlign: 'center' }}>{k.KPI_ID}</td>
                            <td>{k.KPI_NOMBRE}</td>
                            <td>{k.KPI_TIPO}</td>
                            <td style={{ textAlign: 'right' }}>{k.KPI_VALOR}</td>
                            <td style={{ textAlign: 'center' }}>
                                <button onClick={() => handleEditar(k)} style={{ marginRight: '5px' }}>Editar</button>
                                <button onClick={() => handleEliminar(k.KPI_ID)} style={{ backgroundColor: '#ff5555', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Eliminar</button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center' }}>No hay KPIs registrados</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default KPICRUD;