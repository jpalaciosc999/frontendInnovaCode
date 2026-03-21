
import { useEffect, useState } from 'react';
import type { Descuento, DescuentoForm } from '../interfaces/descuentos';
import {
    obtenerDescuentos,
    crearDescuento,
    actualizarDescuento,
    eliminarDescuento
} from '../services/descuentos.service.ts';
const initialForm: DescuentoForm = {
    tds_codigo: '',
    tds_nombre: '',
    tds_descripcion: '',
    tds_tipo_calculo: '',
    tds_valor_base: 0,
    tds_porcentaje: 0,
    tds_es_obligatorio: '',
    tds_estado: '',
    tds_fecha_creacion: '',
    tds_modificacion: ''
};
function DescuentosCRUD() {
    const [datos, setDatos] = useState<Descuento[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [descuentoId, setDescuentoId] = useState<number | null>(null);
    const [form, setForm] = useState<DescuentoForm>(initialForm);
    const cargarDescuentos = async () => {
        try {
            setCargando(true);
            setError('');
            const data = await obtenerDescuentos();
            setDatos(data);
        } catch (err: any) {
            setError('Error cargando descuentos: ' + err.message);
        } finally {
            setCargando(false);
        }
    };
    useEffect(() => {
        cargarDescuentos();
    }, []);
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: (name === 'tds_valor_base' || name === 'tds_porcentaje') ? Number(value) : value
        }));
    };
    const limpiarFormulario = () => {
        setForm(initialForm);
        setModoEdicion(false);
        setDescuentoId(null);
        setError('');
    };
    const validarFormulario = () => {
        if (!form.tds_codigo.trim() || !form.tds_nombre.trim() || !form.tds_tipo_calculo.trim()) {
            setError('Código, Nombre y Tipo de Cálculo son obligatorios');
            return false;
        }
        return true;
    };
    const guardarDescuento = async () => {
        try {
            setError('');
            setMensaje('');
            if (!validarFormulario()) return;
            if (modoEdicion && descuentoId !== null) {
                await actualizarDescuento(descuentoId, form);
                setMensaje('Descuento actualizado correctamente');
            } else {
                await crearDescuento(form);
                setMensaje('Descuento creado correctamente');
            }
            limpiarFormulario();
            await cargarDescuentos();
        } catch (err: any) {
            setError('Error guardando descuento: ' + (err.response?.data?.error || err.message));
        }
    };
    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Deseas eliminar este descuento?')) return;
        try {
            setError('');
            setMensaje('');
            await eliminarDescuento(id);
            setMensaje('Descuento eliminado correctamente');
            await cargarDescuentos();
        } catch (err: any) {
            setError('Error eliminando descuento: ' + (err.response?.data?.error || err.message));
        }
    };
    const handleEditar = (d: Descuento) => {
        setModoEdicion(true);
        setDescuentoId(d.TDS_ID);
        setForm({
            tds_codigo: d.TDS_CODIGO || '',
            tds_nombre: d.TDS_NOMBRE || '',
            tds_descripcion: d.TDS_DESCRIPCION || '',
            tds_tipo_calculo: d.TDS_TIPO_CALCULO || '',
            tds_valor_base: d.TDS_VALOR_BASE || 0,
            tds_porcentaje: d.TDS_PORCENTAJE || 0,
            tds_es_obligatorio: d.TDS_ES_OBLIGATORIO || '',
            tds_estado: d.TDS_ESTADO || '',
            tds_fecha_creacion: d.TDS_FECHA_CREACION ? String(d.TDS_FECHA_CREACION).slice(0, 10) : '',
            tds_modificacion: d.TDS_MODIFICACION ? String(d.TDS_MODIFICACION).slice(0, 10) : ''
        });
    };
    if (cargando) return <p>Cargando descuentos...</p>;
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h2>CRUD de Descuentos</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {mensaje && <p style={{ color: 'green' }}>{mensaje}</p>}
            <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', maxWidth: '700px', marginBottom: '20px' }}>
                <h3>{modoEdicion ? 'Editar Descuento' : 'Nuevo Descuento'}</h3>
                <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
                    <input type="text" name="tds_codigo" placeholder="Código" value={form.tds_codigo} onChange={handleChange} />
                    <input type="text" name="tds_nombre" placeholder="Nombre" value={form.tds_nombre} onChange={handleChange} />
                    <input type="text" name="tds_tipo_calculo" placeholder="Tipo Cálculo" value={form.tds_tipo_calculo} onChange={handleChange} />
                    <input type="number" name="tds_valor_base" placeholder="Valor Base" value={form.tds_valor_base} onChange={handleChange} />
                    <input type="number" name="tds_porcentaje" placeholder="Porcentaje" value={form.tds_porcentaje} onChange={handleChange} />
                    <select name="tds_es_obligatorio" value={form.tds_es_obligatorio} onChange={handleChange}>
                        <option value="">¿Es Obligatorio?</option>
                        <option value="S">Sí</option>
                        <option value="N">No</option>
                    </select>
                    <select name="tds_estado" value={form.tds_estado} onChange={handleChange}>
                        <option value="">Estado</option>
                        <option value="A">Activo</option>
                        <option value="I">Inactivo</option>
                    </select>
                    <input type="date" name="tds_fecha_creacion" value={form.tds_fecha_creacion} onChange={handleChange} />
                </div>
                <textarea name="tds_descripcion" placeholder="Descripción" value={form.tds_descripcion} onChange={handleChange} style={{ width: '100%', marginTop: '10px' }} />
                <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <button onClick={guardarDescuento}>{modoEdicion ? 'Actualizar' : 'Guardar'}</button>
                    <button onClick={limpiarFormulario}>Limpiar</button>
                </div>
            </div>
            <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Tipo</th>
                        <th>% / Valor</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {datos.map((d) => (
                        <tr key={d.TDS_ID}>
                            <td>{d.TDS_ID}</td>
                            <td>{d.TDS_CODIGO}</td>
                            <td>{d.TDS_NOMBRE}</td>
                            <td>{d.TDS_TIPO_CALCULO}</td>
                            <td>{d.TDS_PORCENTAJE}% / Q{d.TDS_VALOR_BASE}</td>
                            <td>{d.TDS_ESTADO === 'A' ? 'Activo' : 'Inactivo'}</td>
                            <td>
                                <button onClick={() => handleEditar(d)}>Editar</button>
                                <button onClick={() => handleEliminar(d.TDS_ID)}>Eliminar</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
export default DescuentosCRUD;
