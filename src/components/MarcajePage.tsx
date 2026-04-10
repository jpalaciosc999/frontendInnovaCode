import { useEffect, useState } from 'react';

import type { Marcaje, MarcajeForm } from '../interfaces/marcaje';

import {

    obtenerMarcajes,

    crearMarcaje,

    actualizarMarcaje,

    eliminarMarcaje

} from '../services/marcaje.service.ts';



const initialForm: MarcajeForm = {

    fecha: '',

    entrada: '',

    salida: '',

    horas_extra: '',

    estado: 'Normal',

    emp_id: ''

};



function MarcajeCRUD() {

    const [datos, setDatos] = useState<Marcaje[]>([]);

    const [cargando, setCargando] = useState(true);

    const [error, setError] = useState('');

    const [mensaje, setMensaje] = useState('');

    const [modoEdicion, setModoEdicion] = useState(false);

    const [marcajeId, setMarcajeId] = useState<number | null>(null);

    const [form, setForm] = useState<MarcajeForm>(initialForm);



    const cargarDatos = async () => {

        try {

            setCargando(true);

            setError('');

            const data = await obtenerMarcajes();

            setDatos(data);

        } catch (err: any) {

            setError('Error cargando marcajes: ' + err.message);

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

        setMarcajeId(null);

        setError('');

    };



    const validarFormulario = () => {

        if (!form.fecha || !form.entrada || !form.emp_id) {

            setError('Fecha, Entrada y ID de Empleado son obligatorios');

            return false;

        }

        return true;

    };



    const guardarMarcaje = async () => {

        try {

            setError('');

            setMensaje('');

            if (!validarFormulario()) return;



            if (modoEdicion && marcajeId !== null) {

                await actualizarMarcaje(marcajeId, form);

                setMensaje('Marcaje actualizado correctamente');

            } else {

                await crearMarcaje(form);

                setMensaje('Marcaje creado correctamente');

            }

            limpiarFormulario();

            await cargarDatos();

        } catch (err: any) {

            setError('Error guardando registro: ' + (err.response?.data?.error || err.message));

        }

    };



    const handleEliminar = async (id: number) => {

        if (!window.confirm('¿Deseas eliminar este registro de marcaje?')) return;

        try {

            setError('');

            setMensaje('');

            await eliminarMarcaje(id);

            setMensaje('Registro eliminado correctamente');

            await cargarDatos();

        } catch (err: any) {

            setError('Error eliminando registro: ' + (err.response?.data?.error || err.message));

        }

    };



    const handleEditar = (m: Marcaje) => {

        setModoEdicion(true);

        setMarcajeId(m.MAR_ID);

        // Formateamos las fechas para los inputs datetime-local y date

        setForm({

            fecha: m.MAR_FECHA ? m.MAR_FECHA.substring(0, 10) : '',

            entrada: m.MAR_ENTRADA ? m.MAR_ENTRADA.substring(0, 16) : '',

            salida: m.MAR_SALIDA ? m.MAR_SALIDA.substring(0, 16) : '',

            horas_extra: m.MAR_HORAS_EXTRA?.toString() || '',

            estado: m.MAR_ESTADO || 'Normal',

            emp_id: m.EMP_ID?.toString() || ''

        });

    };



    if (cargando) return <p>Cargando marcajes...</p>;



    return (

        <div style={{ padding: '20px', fontFamily: 'Arial', color: 'white' }}>

            <h2>CRUD Control de Asistencia (Marcajes)</h2>

            {error && <p style={{ color: '#ff5555' }}>{error}</p>}

            {mensaje && <p style={{ color: '#4CAF50' }}>{mensaje}</p>}



            <div style={{ border: '1px solid #444', padding: '16px', borderRadius: '8px', maxWidth: '800px', marginBottom: '20px', backgroundColor: '#222' }}>

                <h3>{modoEdicion ? 'Editar Marcaje' : 'Nuevo Marcaje'}</h3>

                <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>

                        <label>Empleado ID:</label>

                        <input type="number" name="emp_id" value={form.emp_id} onChange={handleChange} placeholder="ID del empleado" />

                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>

                        <label>Fecha Jornada:</label>

                        <input type="date" name="fecha" value={form.fecha} onChange={handleChange} />

                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>

                        <label>Hora Entrada:</label>

                        <input type="datetime-local" name="entrada" value={form.entrada} onChange={handleChange} />

                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>

                        <label>Hora Salida:</label>

                        <input type="datetime-local" name="salida" value={form.salida} onChange={handleChange} />

                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>

                        <label>Horas Extra:</label>

                        <input type="number" step="0.01" name="horas_extra" value={form.horas_extra} onChange={handleChange} placeholder="0.00" />

                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>

                        <label>Estado:</label>

                        <select name="estado" value={form.estado} onChange={handleChange} style={{ padding: '4px' }}>

                            <option value="Normal">Normal</option>

                            <option value="Retraso">Retraso</option>

                            <option value="Falta Justificada">Falta Justificada</option>

                            <option value="Permiso">Permiso</option>

                        </select>

                    </div>

                </div>



                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>

                    <button onClick={guardarMarcaje} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}>

                        {modoEdicion ? 'Actualizar' : 'Guardar Marcaje'}

                    </button>

                    <button onClick={limpiarFormulario} style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}>

                        Cancelar

                    </button>

                </div>

            </div>



            <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', color: 'white', borderColor: '#444' }}>

                <thead style={{ backgroundColor: '#333' }}>

                    <tr>

                        <th>ID</th>

                        <th>Emp ID</th>

                        <th>Fecha</th>

                        <th>Entrada</th>

                        <th>Salida</th>

                        <th>Extras</th>

                        <th>Estado</th>

                        <th>Acciones</th>

                    </tr>

                </thead>

                <tbody>

                    {datos.length > 0 ? datos.map((m) => (

                        <tr key={m.MAR_ID}>

                            <td style={{ textAlign: 'center' }}>{m.MAR_ID}</td>

                            <td style={{ textAlign: 'center' }}>{m.EMP_ID}</td>

                            <td>{m.MAR_FECHA ? new Date(m.MAR_FECHA).toLocaleDateString() : '-'}</td>

                            <td>{m.MAR_ENTRADA ? new Date(m.MAR_ENTRADA).toLocaleTimeString() : '-'}</td>

                            <td>{m.MAR_SALIDA ? new Date(m.MAR_SALIDA).toLocaleTimeString() : '-'}</td>

                            <td style={{ textAlign: 'center' }}>{m.MAR_HORAS_EXTRA}</td>

                            <td style={{ textAlign: 'center' }}>{m.MAR_ESTADO}</td>

                            <td style={{ textAlign: 'center' }}>

                                <button onClick={() => handleEditar(m)} style={{ marginRight: '5px' }}>Editar</button>

                                <button onClick={() => handleEliminar(m.MAR_ID)} style={{ backgroundColor: '#ff5555', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Eliminar</button>

                            </td>

                        </tr>

                    )) : (

                        <tr>

                            <td colSpan={8} style={{ textAlign: 'center' }}>No hay marcajes registrados</td>

                        </tr>

                    )}

                </tbody>

            </table>

        </div>

    );

}



export default MarcajeCRUD;