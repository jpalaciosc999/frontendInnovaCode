import { useEffect, useState } from 'react';
import type { Liquidacion, LiquidacionForm } from '../interfaces/liquidacion';
import {
    obtenerLiquidaciones,
    crearLiquidacion,
    actualizarLiquidacion,
    eliminarLiquidacion
} from '../services/liquidacion.service';

const initialForm: LiquidacionForm = {
    liq_fecha_salida: '',
    liq_tipo_retiro: '',
    liq_dias_trabajado: '',
    liq_indemnizacion: '',
    liq_vacaciones_pagadas: '',
    liq_aguinaldo_proporcional: '',
    liq_bono14_proporcional: '',
    liq_liquidacion: '',
    liq_fecha_registro: '',
    emp_id: ''
};

function LiquidacionCRUD() {
    const [datos, setDatos] = useState<Liquidacion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [liqId, setLiqId] = useState<number | null>(null);
    const [form, setForm] = useState<LiquidacionForm>(initialForm);

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
            const data = await obtenerLiquidaciones();
            setDatos(data);
        } catch (err: any) {
            setError('Error cargando liquidaciones: ' + err.message);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    // CÁLCULO AUTOMÁTICO
    useEffect(() => {
        const total =
            Number(form.liq_indemnizacion || 0) +
            Number(form.liq_vacaciones_pagadas || 0) +
            Number(form.liq_aguinaldo_proporcional || 0) +
            Number(form.liq_bono14_proporcional || 0);

        setForm((prev) => ({
            ...prev,
            liq_liquidacion: total.toString()
        }));
    }, [
        form.liq_indemnizacion,
        form.liq_vacaciones_pagadas,
        form.liq_aguinaldo_proporcional,
        form.liq_bono14_proporcional
    ]);

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
        setLiqId(null);
        setError('');
    };

    const validarFormulario = () => {
        if (!form.liq_fecha_salida || !form.liq_tipo_retiro || !form.emp_id) {
            setError('Campos obligatorios faltantes');
            return false;
        }
        return true;
    };

    const guardar = async () => {
        try {
            setError('');
            setMensaje('');

            if (!validarFormulario()) return;

            if (modoEdicion && liqId !== null) {
                await actualizarLiquidacion(liqId, form);
                setMensaje('Liquidación actualizada correctamente');
            } else {
                await crearLiquidacion(form);
                setMensaje('Liquidación creada correctamente');
            }

            limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            setError('Error guardando: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Deseas eliminar esta liquidación?')) return;
        try {
            setError('');
            setMensaje('');
            await eliminarLiquidacion(id);
            setMensaje('Liquidación eliminada correctamente');
            await cargarDatos();
        } catch (err: any) {
            setError('Error eliminando: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEditar = (l: Liquidacion) => {
        setModoEdicion(true);
        setLiqId(l.LIQ_ID);
        setForm({
            liq_fecha_salida: l.LIQ_FECHA_SALIDA,
            liq_tipo_retiro: l.LIQ_TIPO_RETIRO,
            liq_dias_trabajado: l.LIQ_DIAS_TRABAJADO?.toString() || '',
            liq_indemnizacion: l.LIQ_INDEMNIZACION?.toString() || '',
            liq_vacaciones_pagadas: l.LIQ_VACACIONES_PAGADAS?.toString() || '',
            liq_aguinaldo_proporcional: l.LIQ_AGUINALDO_PROPORCIONAL?.toString() || '',
            liq_bono14_proporcional: l.LIQ_BONO14_PROPORCIONAL?.toString() || '',
            liq_liquidacion: l.LIQ_LIQUIDACION?.toString() || '',
            liq_fecha_registro: l.LIQ_FECHA_REGISTRO,
            emp_id: l.EMP_ID?.toString() || ''
        });
    };

    if (cargando) return <p>Cargando liquidaciones...</p>;

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial', color: 'white' }}>
            <h2>Gestión de Liquidaciones</h2>

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
                <h3>{modoEdicion ? 'Editar Liquidación' : 'Nueva Liquidación'}</h3>

                <div style={{
                    display: 'grid',
                    gap: '12px',
                    gridTemplateColumns: '1fr 1fr',
                    justifyItems: 'start'
                }}>

                    {[
                        { label: 'Fecha salida', name: 'liq_fecha_salida', type: 'date' },
                        { label: 'Tipo retiro', name: 'liq_tipo_retiro', type: 'text' },
                        { label: 'Días trabajados', name: 'liq_dias_trabajado', type: 'number' },
                        { label: 'Indemnización', name: 'liq_indemnizacion', type: 'number' },
                        { label: 'Vacaciones pagadas', name: 'liq_vacaciones_pagadas', type: 'number' },
                        { label: 'Aguinaldo proporcional', name: 'liq_aguinaldo_proporcional', type: 'number' },
                        { label: 'Bono 14 proporcional', name: 'liq_bono14_proporcional', type: 'number' },
                        { label: 'Fecha registro', name: 'liq_fecha_registro', type: 'date' },
                        { label: 'Empleado ID', name: 'emp_id', type: 'number' }
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

                    {/* TOTAL AUTOMÁTICO */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <label>Total liquidación:</label>
                        <input
                            type="number"
                            value={form.liq_liquidacion}
                            readOnly
                            style={inputStyle}
                        />
                    </div>

                </div>

                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                    <button onClick={guardar} style={{ padding: '8px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}>
                        {modoEdicion ? 'Actualizar' : 'Guardar'}
                    </button>

                    <button onClick={limpiarFormulario} style={{ padding: '8px 16px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px' }}>
                        Limpiar / Cancelar
                    </button>
                </div>
            </div>

            <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse', color: 'white', borderColor: '#444' }}>
                <thead style={{ backgroundColor: '#333' }}>
                    <tr>
                        <th>ID</th>
                        <th>Empleado</th>
                        <th>Tipo</th>
                        <th>Total</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {datos.length > 0 ? datos.map((l) => (
                        <tr key={l.LIQ_ID}>
                            <td>{l.LIQ_ID}</td>
                            <td>{l.EMP_ID}</td>
                            <td>{l.LIQ_TIPO_RETIRO}</td>
                            <td>{l.LIQ_LIQUIDACION}</td>
                            <td>
                                <button onClick={() => handleEditar(l)}>Editar</button>
                                <button onClick={() => handleEliminar(l.LIQ_ID)} style={{ backgroundColor: '#ff5555', color: 'white' }}>
                                    Eliminar
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} style={{ textAlign: 'center' }}>
                                No hay liquidaciones
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default LiquidacionCRUD;