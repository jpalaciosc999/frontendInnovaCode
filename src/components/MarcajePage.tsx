import React, { useEffect, useState } from 'react';
import {
    Clock, Save, AlertCircle, CheckCircle, Trash2,
    Calendar, Edit3, XCircle
} from 'lucide-react';

/**
 * Módulo de Gestión de Marcajes (CRUD)
 * Basado en la estructura solicitada por el usuario.
 * Se eliminó el import 'User' no utilizado para limpiar advertencias de linting.
 */

interface Marcaje {
    MAR_ID?: number;
    MAR_FECHA: string;
    MAR_ENTRADA: string;
    MAR_SALIDA: string;
    MAR_HORAS_EXTRA: string | number;
    MAR_ESTADO: string;
    EMP_ID: string | number;
}

interface MarcajeForm {
    fecha: string;
    entrada: string;
    salida: string;
    horas_extra: string;
    estado: string;
    emp_id: string;
}

const initialForm: MarcajeForm = {
    fecha: '',
    entrada: '',
    salida: '',
    horas_extra: '',
    estado: 'Normal',
    emp_id: ''
};

const MarcajeCRUD: React.FC = () => {
    // --- ESTADOS ---
    const [datos, setDatos] = useState<Marcaje[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [marcajeId, setMarcajeId] = useState<number | null>(null);
    const [form, setForm] = useState<MarcajeForm>(initialForm);

    // --- CARGA DE DATOS ---
    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError('');
            // Intentar conectar con el backend local (Ruta basada en image_608a7d.png)
            const response = await fetch('http://localhost:4000/marcaje');
            if (!response.ok) throw new Error('Error al conectar con el servidor');
            const data = await response.json();
            setDatos(data);
        } catch (err: any) {
            // Datos de demostración por si el servidor no está activo
            console.warn("Usando datos de demostración local");
            setDatos([
                { MAR_ID: 1, EMP_ID: 101, MAR_FECHA: '2023-10-25', MAR_ENTRADA: '2023-10-25T08:00', MAR_SALIDA: '2023-10-25T17:00', MAR_HORAS_EXTRA: 1, MAR_ESTADO: 'Normal' }
            ]);
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    // --- MANEJADORES DE EVENTOS ---
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
        setMensaje('');
    };

    const validarFormulario = () => {
        if (!form.fecha || !form.entrada || !form.emp_id) {
            setError('Campos obligatorios: Fecha, Entrada e ID Empleado');
            return false;
        }
        return true;
    };

    const guardarMarcaje = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError('');
            setMensaje('');
            if (!validarFormulario()) return;

            const url = modoEdicion ? `http://localhost:4000/marcaje/${marcajeId}` : 'http://localhost:4000/marcaje';
            const method = modoEdicion ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (response.ok) {
                setMensaje(modoEdicion ? 'Registro actualizado' : 'Registro creado');
                limpiarFormulario();
                await cargarDatos();
            } else {
                throw new Error('Error en el servidor al guardar');
            }
        } catch (err: any) {
            setError('Error: ' + err.message);
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Eliminar este marcaje?')) return;
        try {
            setError('');
            const response = await fetch(`http://localhost:4000/marcaje/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setMensaje('Eliminado correctamente');
                await cargarDatos();
            }
        } catch (err: any) {
            setError('Error al eliminar');
        }
    };

    const handleEditar = (m: Marcaje) => {
        setModoEdicion(true);
        setMarcajeId(m.MAR_ID ?? null);
        setForm({
            fecha: m.MAR_FECHA ? m.MAR_FECHA.substring(0, 10) : '',
            entrada: m.MAR_ENTRADA ? m.MAR_ENTRADA.substring(0, 16) : '',
            salida: m.MAR_SALIDA ? m.MAR_SALIDA.substring(0, 16) : '',
            horas_extra: m.MAR_HORAS_EXTRA?.toString() || '',
            estado: m.MAR_ESTADO || 'Normal',
            emp_id: m.EMP_ID?.toString() || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (cargando) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="text-indigo-600 font-bold animate-pulse">Cargando Módulo...</div>
            </div>
        );
    }

    return (
        <div className="p-6 bg-slate-50 min-h-screen font-sans">
            <div className="max-w-6xl mx-auto">
                {/* CABECERA */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Clock className="text-indigo-600" /> MarcajeCRUD
                        </h1>
                        <p className="text-slate-500 text-sm">Control de tiempos y asistencia de empleados</p>
                    </div>
                    <div className="flex flex-col gap-2">
                        {error && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-100 animate-bounce">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                        {mensaje && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <CheckCircle size={14} /> {mensaje}
                            </div>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* PANEL IZQUIERDO: FORMULARIO */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-fit sticky top-6">
                        <h2 className="text-lg font-semibold text-slate-700 mb-6 flex items-center gap-2">
                            {modoEdicion ? <Edit3 size={18} className="text-amber-500" /> : <Calendar size={18} className="text-indigo-500" />}
                            {modoEdicion ? 'Editar Registro' : 'Nuevo Marcaje'}
                        </h2>
                        <form onSubmit={guardarMarcaje} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">ID Empleado</label>
                                <input
                                    type="number" name="emp_id" required
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-500"
                                    value={form.emp_id}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400 uppercase">Fecha Jornada</label>
                                <input
                                    type="date" name="fecha" required
                                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                    value={form.fecha}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Hora Entrada</label>
                                    <input
                                        type="datetime-local" name="entrada" required
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        value={form.entrada}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Hora Salida</label>
                                    <input
                                        type="datetime-local" name="salida"
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        value={form.salida}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Horas Extra</label>
                                    <input
                                        type="number" step="0.1" name="horas_extra"
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        value={form.horas_extra}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-400 uppercase">Estado</label>
                                    <select
                                        name="estado"
                                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                                        value={form.estado}
                                        onChange={handleChange}
                                    >
                                        <option value="Normal">Normal</option>
                                        <option value="Retraso">Retraso</option>
                                        <option value="Falta">Falta</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col gap-2">
                                <button
                                    type="submit"
                                    className={`w-full font-bold py-3.5 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${modoEdicion ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                        }`}
                                >
                                    <Save size={18} /> {modoEdicion ? 'Actualizar' : 'Registrar'}
                                </button>
                                {modoEdicion && (
                                    <button
                                        type="button"
                                        onClick={limpiarFormulario}
                                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all"
                                    >
                                        <XCircle size={18} className="inline mr-2" /> Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* PANEL DERECHO: TABLA */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-fit">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
                            <h2 className="text-lg font-semibold text-slate-700">Historial Reciente</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">ID Empleado</th>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4 text-center">Horas Extra</th>
                                        <th className="px-6 py-4 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {datos.length > 0 ? datos.map((m) => (
                                        <tr key={m.MAR_ID} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700">EMP-{m.EMP_ID}</div>
                                                <div className={`text-[10px] font-bold ${m.MAR_ESTADO === 'Normal' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {m.MAR_ESTADO}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-slate-600 font-medium">
                                                    {m.MAR_FECHA ? new Date(m.MAR_FECHA).toLocaleDateString() : '-'}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {m.MAR_ENTRADA ? new Date(m.MAR_ENTRADA).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'} -
                                                    {m.MAR_SALIDA ? new Date(m.MAR_SALIDA).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${Number(m.MAR_HORAS_EXTRA) > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                                    {m.MAR_HORAS_EXTRA} h
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => handleEditar(m)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"><Edit3 size={16} /></button>
                                                    <button onClick={() => m.MAR_ID && handleEliminar(m.MAR_ID)} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No hay registros para mostrar.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MarcajeCRUD;