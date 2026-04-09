import { useEffect, useState } from 'react';
import type { Sede, SedeForm } from '../interfaces/sede';
import {
    obtenerSedes,
    crearSede,
    actualizarSede,
    eliminarSede
} from '../services/sede.service';

const initialForm: SedeForm = {
    sed_nombre: '',
    sed_telefono: '',
    sed_departamento: '',
    sed_municipio: '',
    sed_zona: ''
};

function SedeCRUD() {
    const [datos, setDatos] = useState<Sede[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [id, setId] = useState<number | null>(null);
    const [form, setForm] = useState<SedeForm>(initialForm);

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
            const data = await obtenerSedes();
            setDatos(data);
        } catch (err: any) {
            setError('Error cargando sedes: ' + err.message);
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
        if (!form.sed_nombre || !form.sed_departamento) {
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
                await actualizarSede(id, form);
                setMensaje('Sede actualizada');
            } else {
                await crearSede(form);
                setMensaje('Sede creada');
            }

            limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            setError('Error guardando: ' + err.message);
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Eliminar sede?')) return;
        await eliminarSede(id);
        await cargarDatos();
    };

    const handleEditar = (s: Sede) => {
        setModoEdicion(true);
        setId(s.SED_ID);

        setForm({
            sed_nombre: s.SED_NOMBRE,
            sed_telefono: s.SED_TELEFONO,
            sed_departamento: s.SED_DEPARTAMENTO,
            sed_municipio: s.SED_MUNICIPIO,
            sed_zona: s.SED_ZONA
        });
    };

    if (cargando) return <p>Cargando sedes...</p>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', color: 'white' }}>
            <h2>Sedes</h2>

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
                <h3>{modoEdicion ? 'Editar' : 'Nueva'} Sede</h3>

                <div style={{
                    display: 'grid',
                    gap: '12px',
                    gridTemplateColumns: '1fr 1fr',
                    justifyItems: 'start' // 👈 IGUAL que el otro
                }}>

                    {[
                        { label: 'Nombre', name: 'sed_nombre', type: 'text' },
                        { label: 'Teléfono', name: 'sed_telefono', type: 'number' },
                        { label: 'Departamento', name: 'sed_departamento', type: 'text' },
                        { label: 'Municipio', name: 'sed_municipio', type: 'text' },
                        { label: 'Zona', name: 'sed_zona', type: 'text' }
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

                {/* 👇 BOTONES EXACTAMENTE IGUAL */}
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
                        <th>Nombre</th>
                        <th>Teléfono</th>
                        <th>Departamento</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {datos.map((s) => (
                        <tr key={s.SED_ID}>
                            <td>{s.SED_ID}</td>
                            <td>{s.SED_NOMBRE}</td>
                            <td>{s.SED_TELEFONO}</td>
                            <td>{s.SED_DEPARTAMENTO}</td>
                            <td>
                                <button onClick={() => handleEditar(s)}>Editar</button>
                                <button onClick={() => handleEliminar(s.SED_ID)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default SedeCRUD;