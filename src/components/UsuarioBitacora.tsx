import { useEffect, useState } from 'react';
import type { UsuarioBitacora, UsuarioBitacoraForm } from '../interfaces/usuarioBitacora';
import {
    obtenerUsuariosBitacora,
    crearUsuarioBitacora,
    actualizarUsuarioBitacora,
    eliminarUsuarioBitacora
} from '../services/usuarioBitacora.service';

const initialForm: UsuarioBitacoraForm = {
    usu_id: '',
    bit_id: ''
};

function UsuarioBitacoraCRUD() {
    const [datos, setDatos] = useState<UsuarioBitacora[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [id, setId] = useState<number | null>(null);
    const [form, setForm] = useState<UsuarioBitacoraForm>(initialForm);

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
            const data = await obtenerUsuariosBitacora();
            setDatos(data);
        } catch (err: any) {
            setError('Error cargando usuario bitácora: ' + err.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

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
        setError('');
    };

    const validar = () => {
        if (!form.usu_id || !form.bit_id) {
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
                await actualizarUsuarioBitacora(id, form);
                setMensaje('Usuario bitácora actualizado');
            } else {
                await crearUsuarioBitacora(form);
                setMensaje('Usuario bitácora creado');
            }

            limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            setError('Error guardando: ' + err.message);
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Eliminar usuario bitácora?')) return;

        try {
            await eliminarUsuarioBitacora(id);
            setMensaje('Usuario bitácora eliminado');
            await cargarDatos();
        } catch (err: any) {
            setError('Error eliminando: ' + err.message);
        }
    };

    const handleEditar = (u: UsuarioBitacora) => {
        setModoEdicion(true);
        setId(u.USB_ID);

        setForm({
            usu_id: u.USU_ID,
            bit_id: u.BIT_ID
        });
    };

    if (cargando) {
        return <p style={{ color: 'white' }}>Cargando usuario bitácora...</p>;
    }

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', color: 'white' }}>
            <h2>Usuario Bitácora</h2>

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
                <h3>{modoEdicion ? 'Editar' : 'Nuevo'} Usuario Bitácora</h3>

                <div
                    style={{
                        display: 'grid',
                        gap: '12px',
                        gridTemplateColumns: '1fr 1fr',
                        justifyItems: 'start'
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label>Usuario ID:</label>
                        <input
                            type="number"
                            name="usu_id"
                            value={form.usu_id}
                            onChange={handleChange}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label>Bitácora ID:</label>
                        <input
                            type="number"
                            name="bit_id"
                            value={form.bit_id}
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
                        <th>USB_ID</th>
                        <th>USU_ID</th>
                        <th>BIT_ID</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {datos.map((u) => (
                        <tr key={u.USB_ID}>
                            <td>{u.USB_ID}</td>
                            <td>{u.USU_ID}</td>
                            <td>{u.BIT_ID}</td>
                            <td>
                                <button onClick={() => handleEditar(u)} style={{ marginRight: '8px' }}>
                                    Editar
                                </button>
                                <button onClick={() => handleEliminar(u.USB_ID)}>
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

export default UsuarioBitacoraCRUD;