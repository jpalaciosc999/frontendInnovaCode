import { useEffect, useState } from 'react';
import type { EmpleadoContrato, EmpleadoContratoForm } from '../interfaces/empleado_contrato';
import {
    obtenerContratos,
    crearContrato,
    actualizarContrato,
    eliminarContrato
} from '../services/empleado_contrato.service';

import {
    Alert,
    Box,
    Button,
    Chip,
    Grid,
    Paper,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    MenuItem
} from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArticleIcon from '@mui/icons-material/Article';

const initialForm: EmpleadoContratoForm = {
    tco_fecha_inicio: '',
    tco_fecha_fin: '',
    tco_estado: '',
    tic_fecha_modificacion: '',
    tic_id: ''
};

function EmpleadoContratoCRUD() {
    const [datos, setDatos] = useState<EmpleadoContrato[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [id, setId] = useState<number | null>(null);
    const [form, setForm] = useState<EmpleadoContratoForm>(initialForm);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError('');
            const data = await obtenerContratos();
            setDatos(data);
        } catch (err: any) {
            setError('Error cargando contratos: ' + err.message);
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
        setId(null);
        setError('');
    };

    const validar = () => {
        if (!form.tco_fecha_inicio || !form.tco_estado || !form.tic_id) {
            setError('Campos obligatorios faltantes: Fecha de inicio, Estado e ID de Empleado son requeridos');
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
                await actualizarContrato(id, form);
                setMensaje('Contrato actualizado correctamente');
            } else {
                await crearContrato(form);
                setMensaje('Contrato creado correctamente');
            }

            limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            setError('Error al guardar: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEliminar = async (contratoId: number) => {
        if (!window.confirm('¿Deseas eliminar este contrato?')) return;
        try {
            setError('');
            setMensaje('');
            await eliminarContrato(contratoId);
            setMensaje('Contrato eliminado correctamente');
            if (id === contratoId) limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            setError('Error al eliminar: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEditar = (c: EmpleadoContrato) => {
        setModoEdicion(true);
        setId(c.TCO_ID);
        setMensaje('');
        setError('');
        setForm({
            tco_fecha_inicio: c.TCO_FECHA_INICIO ? String(c.TCO_FECHA_INICIO).split('T')[0] : '',
            tco_fecha_fin: c.TCO_FECHA_FIN ? String(c.TCO_FECHA_FIN).split('T')[0] : '',
            tco_estado: c.TCO_ESTADO,
            tic_fecha_modificacion: c.TIC_FECHA_MODIFICACION ? String(c.TIC_FECHA_MODIFICACION).split('T')[0] : '',
            tic_id: c.TIC_ID
        });
    };

    const obtenerChipEstado = (estado: string) => {
        if (estado === 'A') return <Chip label="Activo" color="success" size="small" />;
        if (estado === 'I') return <Chip label="Inactivo" color="error" size="small" />;
        return <Chip label={estado} color="default" size="small" />;
    };

    const formatearFecha = (fecha: string) => {
        if (!fecha) return '—';
        return new Date(fecha).toLocaleDateString('es-GT');
    };

    if (cargando) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6">Cargando contratos...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 2 }}>
            {/* Formulario */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <ArticleIcon color="primary" />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        Contratos de Empleado
                    </Typography>
                </Box>

                <Typography variant="h6" sx={{ mb: 2 }}>
                    {modoEdicion ? 'Editar contrato' : 'Nuevo contrato'}
                </Typography>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Fecha de inicio"
                            name="tco_fecha_inicio"
                            type="date"
                            value={form.tco_fecha_inicio}
                            onChange={handleChange}
                            slotProps={{ inputLabel: { shrink: true } }}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Fecha de fin"
                            name="tco_fecha_fin"
                            type="date"
                            value={form.tco_fecha_fin}
                            onChange={handleChange}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            select
                            fullWidth
                            label="Estado"
                            name="tco_estado"
                            value={form.tco_estado}
                            onChange={handleChange}
                            required
                        >
                            <MenuItem value="A">Activo</MenuItem>
                            <MenuItem value="I">Inactivo</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Fecha de modificación"
                            name="tic_fecha_modificacion"
                            type="date"
                            value={form.tic_fecha_modificacion}
                            onChange={handleChange}
                            slotProps={{ inputLabel: { shrink: true } }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="ID de Empleado"
                            name="tic_id"
                            type="number"
                            value={form.tic_id}
                            onChange={handleChange}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={guardar}
                            >
                                {modoEdicion ? 'Actualizar' : 'Guardar'}
                            </Button>

                            <Button
                                variant="outlined"
                                color="secondary"
                                startIcon={<CleaningServicesIcon />}
                                onClick={limpiarFormulario}
                            >
                                Limpiar / Cancelar
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Tabla */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Listado de contratos: {datos.length}
                </Typography>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>ID</strong></TableCell>
                                <TableCell><strong>Inicio</strong></TableCell>
                                <TableCell><strong>Fin</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell><strong>Empleado ID</strong></TableCell>
                                <TableCell><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {datos.length > 0 ? (
                                datos.map((c) => (
                                    <TableRow key={c.TCO_ID} hover>
                                        <TableCell>{c.TCO_ID}</TableCell>
                                        <TableCell>{formatearFecha(c.TCO_FECHA_INICIO)}</TableCell>
                                        <TableCell>{formatearFecha(c.TCO_FECHA_FIN)}</TableCell>
                                        <TableCell>{obtenerChipEstado(c.TCO_ESTADO)}</TableCell>
                                        <TableCell>{c.TIC_ID}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleEditar(c)}
                                                >
                                                    Editar
                                                </Button>

                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="error"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handleEliminar(c.TCO_ID)}
                                                >
                                                    Eliminar
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No hay contratos registrados
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

export default EmpleadoContratoCRUD;