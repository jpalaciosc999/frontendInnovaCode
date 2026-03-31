import { useEffect, useState } from 'react';
import type { Ingreso, IngresoForm } from '../interfaces/tipoIngresos.ts';
import {
    obtenerIngresos,
    crearIngreso,
    actualizarIngreso,
    eliminarIngreso
} from '../services/tipoIngresos.service.ts';

const initialForm: IngresoForm = {
    tis_codigo: '',
    tis_nombre: '',
    tis_descripcion: '',
    tis_valor_base: 0,
    tis_es_recurrente: '',
    fecha_modificacion: ''
};

function TipoIngresos() {
    const [datos, setDatos] = useState<Ingreso[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [ingresoId, setIngresoId] = useState<number | null>(null);
    const [form, setForm] = useState<IngresoForm>(initialForm);

    const cargarIngresos = async () => {
        try {
            setCargando(true);
            setError('');
            const data = await obtenerIngresos();
            setDatos(data);
        } catch (err: any) {
            setError('Error cargando ingresos: ' + err.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarIngresos();
    }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: name === 'tis_valor_base' ? Number(value) : value
        }));
    };

    const limpiarFormulario = () => {
        setForm(initialForm);
        setModoEdicion(false);
        setIngresoId(null);
        setError('');
    };

    const validarFormulario = () => {
        if (
            !form.tis_codigo.trim() ||
            !form.tis_nombre.trim() ||
            form.tis_valor_base <= 0 ||
            !form.tis_es_recurrente.trim()
        ) {
            setError('Código, Nombre, Valor y Recurrencia son obligatorios');
            return false;
        }
        return true;
    };

    const guardarIngreso = async () => {
        try {
            setError('');
            setMensaje('');

            if (!validarFormulario()) return;

            if (modoEdicion && ingresoId !== null) {
                await actualizarIngreso(ingresoId, form);
                setMensaje('Ingreso actualizado correctamente');
            } else {
                await crearIngreso(form);
                setMensaje('Ingreso creado correctamente');
            }

            limpiarFormulario();
            await cargarIngresos();
        } catch (err: any) {
            setError(
                'Error guardando ingreso: ' +
                (err.response?.data?.error || err.message)
            );
        }
    };

    const handleEliminar = async (id: number) => {
        const confirmar = window.confirm('¿Deseas eliminar este concepto de ingreso?');
        if (!confirmar) return;

        try {
            setError('');
            setMensaje('');

            await eliminarIngreso(id);
            setMensaje('Ingreso eliminado correctamente');

            if (ingresoId === id) {
                limpiarFormulario();
            }

            await cargarIngresos();
        } catch (err: any) {
            setError(
                'Error eliminando ingreso: ' +
                (err.response?.data?.error || err.message)
            );
        }
    };

    const handleEditar = (ingreso: Ingreso) => {
        setModoEdicion(true);
        setIngresoId(ingreso.TIS_ID);
        setMensaje('');
        setError('');

        setForm({
            tis_codigo: ingreso.TIS_CODIGO || '',
            tis_nombre: ingreso.TIS_NOMBRE || '',
            tis_descripcion: ingreso.TIS_DESCRIPCION || '',
            tis_valor_base: ingreso.TIS_VALOR_BASE || 0,
            tis_es_recurrente: ingreso.TIS_ES_RECURRENTE || '',
            fecha_modificacion: ingreso.FECHA_MODIFICACION
                ? String(ingreso.FECHA_MODIFICACION).slice(0, 10)
                : ''
        });
    };

    if (cargando) return <p>Cargando ingresos...</p>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>CRUD de Conceptos de Ingreso</h2>

            {error && <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>}
            {mensaje && <p style={{ color: 'green', fontWeight: 'bold' }}>{mensaje}</p>}

            <div
                style={{
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px',
                    maxWidth: '700px'
                }}
            >
                <h3>{modoEdicion ? 'Editar Ingreso' : 'Nuevo Ingreso'}</h3>

                <div style={{ display: 'grid', gap: '10px' }}>
                    <input
                        type="text"
                        name="tis_codigo"
                        placeholder="Código (Ej: BONO01)"
                        value={form.tis_codigo}
                        onChange={handleChange}
                    />

                    <input
                        type="text"
                        name="tis_nombre"
                        placeholder="Nombre del Ingreso"
                        value={form.tis_nombre}
                        onChange={handleChange}
                    />

                    <textarea
                        name="tis_descripcion"
                        placeholder="Descripción"
                        value={form.tis_descripcion}
                        onChange={handleChange}
                        style={{ fontFamily: 'Arial', padding: '5px' }}
                    />

                    <input
                        type="number"
                        name="tis_valor_base"
                        placeholder="Valor Base"
                        value={form.tis_valor_base}
                        onChange={handleChange}
                    />

                    <select
                        name="tis_es_recurrente"
                        value={form.tis_es_recurrente}
                        onChange={handleChange}
                    >
                        <option value="">¿Es recurrente?</option>
                        <option value="S">Sí</option>
                        <option value="N">No</option>
                    </select>

                    <input
                        type="date"
                        name="fecha_modificacion"
                        value={form.fecha_modificacion}
                        onChange={handleChange}
                    />

                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button onClick={guardarIngreso}>
                            {modoEdicion ? 'Actualizar' : 'Guardar'}
                        </button>
                        <button onClick={limpiarFormulario}>Limpiar</button>
                    </div>
                </div>
            </div>

            <h3>Listado de Ingresos: {datos.length}</h3>

            <div style={{ overflowX: 'auto' }}>
                <table
                    border={1}
                    cellPadding={8}
                    cellSpacing={0}
                    style={{ width: '100%', borderCollapse: 'collapse' }}
                >
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Código</th>
                            <th>Nombre</th>
                            <th>Valor Base</th>
                            <th>Recurrente</th>
                            <th>Modificado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {datos.length > 0 ? (
                            datos.map((ingreso) => (
                                <tr key={ingreso.TIS_ID}>
                                    <td>{ingreso.TIS_ID}</td>
                                    <td>{ingreso.TIS_CODIGO}</td>
                                    <td>{ingreso.TIS_NOMBRE}</td>
                                    <td>Q. {ingreso.TIS_VALOR_BASE.toFixed(2)}</td>
                                    <td>{ingreso.TIS_ES_RECURRENTE === 'S' ? 'Sí' : 'No'}</td>
                                    <td>
                                        {ingreso.FECHA_MODIFICACION
                                            ? String(ingreso.FECHA_MODIFICACION).slice(0, 10)
                                            : '-'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button onClick={() => handleEditar(ingreso)}>Editar</button>
                                            <button onClick={() => handleEliminar(ingreso.TIS_ID)}>Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center' }}>
                                    No hay ingresos registrados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default TipoIngresos;
