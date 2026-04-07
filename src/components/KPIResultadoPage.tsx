import { useEffect, useState } from 'react';
import type { KPIResultado, KPIResultadoForm } from '../interfaces/kpi-resultado';
import { obtenerResultados, crearResultado, actualizarResultado, eliminarResultado } from '../services/kpi-resultado.service';

const initialForm: KPIResultadoForm = {
    kre_monto_total: '',
    kre_calculo: '',
    kre_fecha: '',
    kpi_id: ''
};

function KPIResultadoCRUD() {
    const [datos, setDatos] = useState<KPIResultado[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [idActual, setIdActual] = useState<number | null>(null);
    const [form, setForm] = useState<KPIResultadoForm>(initialForm);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const data = await obtenerResultados();
            setDatos(data);
        } catch (err: any) {
            setError('Error al cargar resultados: ' + err.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => { cargarDatos(); }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const guardar = async () => {
        try {
            if (modoEdicion && idActual) {
                await actualizarResultado(idActual, form);
                setMensaje('Actualizado con éxito');
            } else {
                await crearResultado(form);
                setMensaje('Creado con éxito');
            }
            setForm(initialForm);
            setModoEdicion(false);
            cargarDatos();
        } catch (err: any) {
            setError('Error al guardar: ' + err.message);
        }
    };

    const handleEditar = (r: KPIResultado) => {
        setModoEdicion(true);
        setIdActual(r.KRE_ID);
        setForm({
            kre_monto_total: r.KRE_MONTO_TOTAL.toString(),
            kre_calculo: r.KRE_CALCULO.toString(),
            kre_fecha: r.KRE_FECHA.split('T')[0], // Ajuste para input date
            kpi_id: r.KPI_ID.toString()
        });
    };

    if (cargando) return <p>Cargando resultados...</p>;

    return (
        <div style={{ padding: '20px', color: 'white' }}>
            <h2>Registro de Resultados KPI</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}

            <div style={{ background: '#222', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <input type="number" name="kpi_id" placeholder="ID del KPI" value={form.kpi_id} onChange={handleChange} />
                    <input type="number" name="kre_monto_total" placeholder="Monto Total" value={form.kre_monto_total} onChange={handleChange} />
                    <input type="number" name="kre_calculo" placeholder="Cálculo (0-10)" value={form.kre_calculo} onChange={handleChange} />
                    <input type="date" name="kre_fecha" value={form.kre_fecha} onChange={handleChange} />
                </div>
                <button onClick={guardar} style={{ marginTop: '10px', backgroundColor: '#4CAF50', color: 'white', padding: '10px' }}>
                    {modoEdicion ? 'Actualizar' : 'Registrar Resultado'}
                </button>
            </div>

            <table border={1} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>KPI ID</th>
                        <th>Monto</th>
                        <th>Cálculo</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {datos.map(r => (
                        <tr key={r.KRE_ID}>
                            <td>{r.KRE_ID}</td>
                            <td>{r.KPI_ID}</td>
                            <td>Q{r.KRE_MONTO_TOTAL}</td>
                            <td>{r.KRE_CALCULO}</td>
                            <td>{new Date(r.KRE_FECHA).toLocaleDateString()}</td>
                            <td>
                                <button onClick={() => handleEditar(r)}>Editar</button>
                                <button onClick={() => eliminarResultado(r.KRE_ID).then(cargarDatos)} style={{ backgroundColor: 'red' }}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default KPIResultadoCRUD;