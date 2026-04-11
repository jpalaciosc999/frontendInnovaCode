import { useEffect, useState } from 'react';
import type { Marcaje, MarcajeForm } from '../interfaces/marcaje';
import {
    obtenerMarcajes,
    crearMarcaje,
    actualizarMarcaje,
    eliminarMarcaje
} from '../services/marcaje.service.ts';

import {
    Alert,
    Box,
    Button,
    Chip,
    Grid,
    MenuItem,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const initialForm: MarcajeForm = {
    fecha: '',
    entrada: '',
    salida: '',
    horas_extra: '',
    estado: 'Normal',
    emp_id: ''
};

const ESTADOS = ['Normal', 'Retraso', 'Falta Justificada', 'Permiso'];

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const limpiarFormulario = () => {
        setForm(initialForm);
        setModoEdicion(false);
        setMarcajeId(null);
        setError('');
    };

    const validarFormulario = () => {
        if (!form.fecha || !form.entrada || !form.emp_id) {
            setError('Fecha, Hora de Entrada e ID de Empleado son obligatorios');
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
            if (marcajeId === id) limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            setError('Error eliminando registro: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEditar = (m: Marcaje) => {
        setModoEdicion(true);
        setMarcajeId(m.MAR_ID);
        setMensaje('');
        setError('');
        setForm({
            fecha: m.MAR_FECHA ? m.MAR_FECHA.substring(0, 10) : '',
            entrada: m.MAR_ENTRADA ? m.MAR_ENTRADA.substring(0, 16) : '',
            salida: m.MAR_SALIDA ? m.MAR_SALIDA.substring(0, 16) : '',
            horas_extra: m.MAR_HORAS_EXTRA?.toString() || '',
            estado: m.MAR_ESTADO || 'Normal',
            emp_id: m.EMP_ID?.toString() || ''
        });
    };

    const obtenerChipEstado = (estado: string) => {
        const colores: Record<string, 'success' | 'warning' | 'error' | 'info'> = {
            Normal: 'success',
            Retraso: 'warning',
            'Falta Justificada': 'error',
            Permiso: 'info'
        };
        return (
            <Chip
                label={estado}
                color={colores[estado] ?? 'default'}
                size="small"
            />
        );
    };

    const formatearFecha = (valor?: string) =>
        valor ? new Date(valor).toLocaleDateString('es-GT') : '—';

    const formatearHora = (valor?: string) =>
        valor ? new Date(valor).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : '—';

    if (cargando) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6">Cargando marcajes...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 2 }}>
            {/* Formulario */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <AccessTimeIcon color="primary" />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        Control de Asistencia (Marcajes)
                    </Typography>
                </Box>

                <Typography variant="h6" sx={{ mb: 2 }}>
                    {modoEdicion ? 'Editar marcaje' : 'Nuevo marcaje'}
                </Typography>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="ID de Empleado"
                            name="emp_id"
                            type="number"
                            value={form.emp_id}
                            onChange={handleChange}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Fecha Jornada"
                            name="fecha"
                            type="date"
                            value={form.fecha}
                            onChange={handleChange}
                            slotProps={{ inputLabel: { shrink: true } }}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Hora de Entrada"
                            name="entrada"
                            type="datetime-local"
                            value={form.entrada}
                            onChange={handleChange}
                            slotProps={{ inputLabel: { shrink: true } }}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Hora de Salida"
                            name="salida"
                            type="datetime-local"
                            value={form.salida}
                            onChange={handleChange}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Horas Extra"
                            name="horas_extra"
                            type="number"
                            value={form.horas_extra}
                            onChange={handleChange}
                            slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
                            placeholder="0.00"
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            select
                            fullWidth
                            label="Estado"
                            name="estado"
                            value={form.estado}
                            onChange={handleChange}
                        >
                            {ESTADOS.map((e) => (
                                <MenuItem key={e} value={e}>{e}</MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={guardarMarcaje}
                            >
                                {modoEdicion ? 'Actualizar' : 'Guardar Marcaje'}
                            </Button>

                            <Button
                                variant="outlined"
                                color="secondary"
                                startIcon={<CleaningServicesIcon />}
                                onClick={limpiarFormulario}
                            >
                                Cancelar
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Tabla */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Listado de marcajes: {datos.length}
                </Typography>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>ID</strong></TableCell>
                                <TableCell><strong>Emp ID</strong></TableCell>
                                <TableCell><strong>Fecha</strong></TableCell>
                                <TableCell><strong>Entrada</strong></TableCell>
                                <TableCell><strong>Salida</strong></TableCell>
                                <TableCell><strong>Extras</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {datos.length > 0 ? (
                                datos.map((m) => (
                                    <TableRow key={m.MAR_ID} hover>
                                        <TableCell>{m.MAR_ID}</TableCell>
                                        <TableCell>{m.EMP_ID}</TableCell>
                                        <TableCell>{formatearFecha(m.MAR_FECHA)}</TableCell>
                                        <TableCell>{formatearHora(m.MAR_ENTRADA)}</TableCell>
                                        <TableCell>{formatearHora(m.MAR_SALIDA)}</TableCell>
                                        <TableCell>{m.MAR_HORAS_EXTRA ?? '—'}</TableCell>
                                        <TableCell>{obtenerChipEstado(m.MAR_ESTADO)}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleEditar(m)}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="error"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handleEliminar(m.MAR_ID)}
                                                >
                                                    Eliminar
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        No hay marcajes registrados
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Snackbars */}
            <Snackbar
                open={!!mensaje}
                autoHideDuration={3000}
                onClose={() => setMensaje('')}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setMensaje('')} sx={{ width: '100%' }}>
                    {mensaje}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!error}
                autoHideDuration={4000}
                onClose={() => setError('')}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
                    {error}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default MarcajeCRUD;