import { useEffect, useState } from 'react';
import type { TipoContrato, TipoContratoForm } from '../interfaces/tipoContrato';
import {
    obtenerTiposContrato,
    crearTipoContrato,
    actualizarTipoContrato,
    eliminarTipoContrato
} from '../services/tipoContrato.service';

const initialForm: TipoContratoForm = {
    tic_nombre: '',
    tic_numero: '',
    tic_descripcion: '',
    tic_tipo_jornada: '',
    tic_fecha_modificacion: '',
    emp_id: ''
};

function TipoContratoCRUD() {
    const [datos, setDatos] = useState<TipoContrato[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [id, setId] = useState<number | null>(null);
    const [form, setForm] = useState<TipoContratoForm>(initialForm);

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
            const data = await obtenerTiposContrato();
            setDatos(data);
        } catch (err: any) {
            setError('Error cargando tipos de contrato: ' + err.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        if (!form.tic_nombre || !form.tic_numero || !form.tic_tipo_jornada || !form.emp_id) {
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
                await actualizarTipoContrato(id, form);
                setMensaje('Tipo de contrato actualizado');
            } else {
                await crearTipoContrato(form);
                setMensaje('Tipo de contrato creado');
            }

            limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            setError('Error guardando: ' + err.message);
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Eliminar tipo de contrato?')) return;

        try {
            await eliminarTipoContrato(id);
            setMensaje('Tipo de contrato eliminado');
            await cargarDatos();
        } catch (err: any) {
            setError('Error eliminando: ' + err.message);
        }
    };

    const handleEditar = (t: TipoContrato) => {
        setModoEdicion(true);
        setId(t.TIC_ID);

        setForm({
            tic_nombre: t.TIC_NOMBRE,
            tic_numero: t.TIC_NUMERO,
            tic_descripcion: t.TIC_DESCRIPCION,
            tic_tipo_jornada: t.TIC_TIPO_JORNADA,
            tic_fecha_modificacion: t.TIC_FECHA_MODIFICACION
                ? t.TIC_FECHA_MODIFICACION.split('T')[0]
                : '',
            emp_id: t.EMP_ID
        });
    };

    if (cargando) return <p style={{ color: 'white' }}>Cargando tipos de contrato...</p>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', color: 'white' }}>
            <h2>Tipo de Contrato</h2>

            {error && <p style={{ color: 'red' }}>{error}</p>}
            {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}

            <div
                style={{
                    border: '1px solid #ccc',
                    padding: '16px',
                    borderRadius: '8px',
                    maxWidth: '900px',
                    marginBottom: '20px',
                    backgroundColor: '#222'
                }}
            >
                <h3>{modoEdicion ? 'Editar' : 'Nuevo'} Tipo de Contrato</h3>

                <div
                    style={{
                        display: 'grid',
                        gap: '12px',
                        gridTemplateColumns: '1fr 1fr',
                        justifyItems: 'start'
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label>Nombre:</label>
                        <input
                            type="text"
                            name="tic_nombre"
                            value={form.tic_nombre}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label>Número:</label>
                        <input
                            type="text"
                            name="tic_numero"
                            value={form.tic_numero}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label>Descripción:</label>
                        <input
                            type="text"
                            name="tic_descripcion"
                            value={form.tic_descripcion}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label>Tipo jornada:</label>
                        <input
                            type="text"
                            name="tic_tipo_jornada"
                            value={form.tic_tipo_jornada}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label>Fecha modificación:</label>
                        <input
                            type="date"
                            name="tic_fecha_modificacion"
                            value={form.tic_fecha_modificacion}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label>Empleado ID:</label>
                        <input
                            type="number"
                            name="emp_id"
                            value={form.emp_id}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>
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

            <table border={1} style={{ width: '100%', color: 'white', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Número</th>
                        <th>Tipo Jornada</th>
                        <th>Empleado ID</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {datos.map((t) => (
                        <tr key={t.TIC_ID}>
                            <td>{t.TIC_ID}</td>
                            <td>{t.TIC_NOMBRE}</td>
                            <td>{t.TIC_NUMERO}</td>
                            <td>{t.TIC_TIPO_JORNADA}</td>
                            <td>{t.EMP_ID}</td>
                            <td>
                                <button onClick={() => handleEditar(t)} style={{ marginRight: '8px' }}>
                                    Editar
                                </button>
                                <button onClick={() => handleEliminar(t.TIC_ID)}>
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

export default TipoContratoCRUD;