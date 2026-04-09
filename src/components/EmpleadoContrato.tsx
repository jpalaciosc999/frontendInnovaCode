import { useEffect, useState } from 'react';
import type { EmpleadoContrato, EmpleadoContratoForm } from '../interfaces/empleado_contrato';
import {
    obtenerContratos,
    crearContrato,
    actualizarContrato,
    eliminarContrato
} from '../services/empleado_contrato.service';

const initialForm: EmpleadoContratoForm = {
    tco_fecha_inicio: '',
    tco_fecha_fin: '',
    tco_estado: '',
    tic_fecha_modificacion: '',
    tic_id: ''
};

function EmpleadoContratoCRUD() {
    const [datos, setDatos] = useState<EmpleadoContrato[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [id, setId] = useState<number | null>(null);
    const [form, setForm] = useState<EmpleadoContratoForm>(initialForm);

    const inputStyle = {
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
            const data = await obtenerContratos();
            setDatos(data);
        } catch (err: any) {
            setError('Error cargando contratos: ' + err.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const handleChange = (e: any) => {
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
        setError('');
    };

    const validar = () => {
        if (!form.tco_fecha_inicio || !form.tco_estado || !form.tic_id) {
            setError('Campos obligatorios faltantes');
            return false;
        }
        return true;
    };

    const guardar = async () => {
        try {
            setError('');
            setMensaje('');

            if (!validar()) return;

            if (modoEdicion && id !== null) {
                await actualizarContrato(id, form);
                setMensaje('Contrato actualizado');
            } else {
                await crearContrato(form);
                setMensaje('Contrato creado');
            }

            limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            setError('Error guardando: ' + err.message);
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Eliminar contrato?')) return;
        await eliminarContrato(id);
        await cargarDatos();
    };

    const handleEditar = (c: EmpleadoContrato) => {
        setModoEdicion(true);
        setId(c.TCO_ID);

        setForm({
            tco_fecha_inicio: c.TCO_FECHA_INICIO,
            tco_fecha_fin: c.TCO_FECHA_FIN,
            tco_estado: c.TCO_ESTADO,
            tic_fecha_modificacion: c.TIC_FECHA_MODIFICACION,
            tic_id: c.TIC_ID
        });
    };

    if (cargando) return <p>Cargando contratos...</p>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', color: 'white' }}>
            <h2>Contratos de Empleado</h2>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}

            <div style={{
                border: '1px solid #ccc',
                padding: '16px',
                borderRadius: '8px',
                maxWidth: '900px',
                marginBottom: '20px',
                backgroundColor: '#222'
            }}>
                <h3>{modoEdicion ? 'Editar' : 'Nuevo'} Contrato</h3>

                <div style={{
                    display: 'grid',
                    gap: '12px',
                    gridTemplateColumns: '1fr 1fr',
                    justifyItems: 'start'
                }}>

                    {[
                        { label: 'Fecha inicio', name: 'tco_fecha_inicio', type: 'date' },
                        { label: 'Fecha fin', name: 'tco_fecha_fin', type: 'date' },
                        { label: 'Estado (A/I)', name: 'tco_estado', type: 'text' },
                        { label: 'Fecha modificación', name: 'tic_fecha_modificacion', type: 'date' },
                        { label: 'Empleado ID', name: 'tic_id', type: 'number' }
                    ].map((field) => (
                        <div key={field.name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                            <label>{field.label}:</label>
                            <input
                                type={field.type}
                                name={field.name}
                                value={(form as any)[field.name]}
                                onChange={handleChange}
                                style={inputStyle}
                            />
                        </div>
                    ))}

                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button
                        onClick={guardar}
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px'
                        }}
                    >
                        {modoEdicion ? 'Actualizar' : 'Guardar'}
                    </button>

                    <button
                        onClick={limpiarFormulario}
                        style={{
                            padding: '8px 16px',
                            cursor: 'pointer',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px'
                        }}
                    >
                        Limpiar / Cancelar
                    </button>
                </div>
            </div>

            <table border={1} style={{ width: '100%', color: 'white' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Inicio</th>
                        <th>Fin</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {datos.map((c) => (
                        <tr key={c.TCO_ID}>
                            <td>{c.TCO_ID}</td>
                            <td>{c.TCO_FECHA_INICIO}</td>
                            <td>{c.TCO_FECHA_FIN}</td>
                            <td>{c.TCO_ESTADO}</td>
                            <td>
                                <button onClick={() => handleEditar(c)}>Editar</button>
                                <button onClick={() => handleEliminar(c.TCO_ID)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default EmpleadoContratoCRUD;