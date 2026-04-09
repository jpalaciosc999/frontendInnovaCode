import { useEffect, useState } from 'react';
import type { Bitacora, BitacoraForm } from '../interfaces/bitacora';
import {
    obtenerBitacoras,
    crearBitacora,
    actualizarBitacora,
    eliminarBitacora
} from '../services/bitacora.service';

const initialForm: BitacoraForm = {
    bit_accion: '',
    bit_tabla_afectada: '',
    bit_id_registro: '',
    bit_descripcion: '',
    bit_valor_anterior: '',
    bit_valor_nuevo: '',
    bit_ip_usuario: '',
    bit_fecha: ''
};

function BitacoraCRUD() {
    const [datos, setDatos] = useState<Bitacora[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [bitId, setBitId] = useState<number | null>(null);
    const [form, setForm] = useState<BitacoraForm>(initialForm);

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
            const data = await obtenerBitacoras();
            setDatos(data);
        } catch (err: any) {
            setError('Error cargando bitácora: ' + err.message);
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
        setBitId(null);
        setError('');
    };

    const guardar = async () => {
        try {
            setError('');
            setMensaje('');

            if (modoEdicion && bitId !== null) {
                await actualizarBitacora(bitId, form);
                setMensaje('Registro actualizado');
            } else {
                await crearBitacora(form);
                setMensaje('Registro creado');
            }

            limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            setError('Error guardando: ' + err.message);
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Eliminar registro?')) return;
        await eliminarBitacora(id);
        await cargarDatos();
    };

    const handleEditar = (b: Bitacora) => {
        setModoEdicion(true);
        setBitId(b.BIT_ID);

        setForm({
            bit_accion: b.BIT_ACCION,
            bit_tabla_afectada: b.BIT_TABLA_AFECTADA,
            bit_id_registro: b.BIT_ID_REGISTRO,
            bit_descripcion: b.BIT_DESCRIPCION,
            bit_valor_anterior: b.BIT_VALOR_ANTERIOR,
            bit_valor_nuevo: b.BIT_VALOR_NUEVO,
            bit_ip_usuario: b.BIT_IP_USUARIO,
            bit_fecha: b.BIT_FECHA
        });
    };

    if (cargando) return <p>Cargando bitácora...</p>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', color: 'white' }}>
            <h2>Bitácora del Sistema</h2>

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
                <h3>{modoEdicion ? 'Editar' : 'Nuevo'} Registro</h3>

                <div style={{
                    display: 'grid',
                    gap: '12px',
                    gridTemplateColumns: '1fr 1fr',
                    justifyItems: 'start'
                }}>

                    {[
                        { label: 'Acción', name: 'bit_accion', type: 'text' },
                        { label: 'Tabla afectada', name: 'bit_tabla_afectada', type: 'text' },
                        { label: 'ID Registro', name: 'bit_id_registro', type: 'number' },
                        { label: 'IP Usuario', name: 'bit_ip_usuario', type: 'text' },
                        { label: 'Fecha', name: 'bit_fecha', type: 'date' }
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

                    {/* CAMPOS GRANDES */}
                    <div style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                        <label>Descripción:</label>
                        <textarea name="bit_descripcion" value={form.bit_descripcion} onChange={handleChange} style={{ ...inputStyle, width: '100%' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                        <label>Valor anterior:</label>
                        <textarea name="bit_valor_anterior" value={form.bit_valor_anterior} onChange={handleChange} style={{ ...inputStyle, width: '100%' }} />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gridColumn: 'span 2' }}>
                        <label>Valor nuevo:</label>
                        <textarea name="bit_valor_nuevo" value={form.bit_valor_nuevo} onChange={handleChange} style={{ ...inputStyle, width: '100%' }} />
                    </div>

                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button onClick={guardar}>Guardar</button>
                    <button onClick={limpiarFormulario}>Cancelar</button>
                </div>
            </div>

            <table border={1} style={{ width: '100%', color: 'white' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Acción</th>
                        <th>Tabla</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {datos.map((b) => (
                        <tr key={b.BIT_ID}>
                            <td>{b.BIT_ID}</td>
                            <td>{b.BIT_ACCION}</td>
                            <td>{b.BIT_TABLA_AFECTADA}</td>
                            <td>{b.BIT_FECHA}</td>
                            <td>
                                <button onClick={() => handleEditar(b)}>Editar</button>
                                <button onClick={() => handleEliminar(b.BIT_ID)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default BitacoraCRUD;