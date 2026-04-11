import { useEffect, useState } from 'react';
import type { Ingreso, IngresoForm } from '../interfaces/tipoIngresos';
import {
    obtenerIngresos,
    crearIngreso,
    actualizarIngreso,
    eliminarIngreso
} from '../services/tipoIngresos.service';

import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    FormControl,
    Grid,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Snackbar,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    InputAdornment
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';

// Iconos
import PaidIcon from '@mui/icons-material/Paid';
import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';

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
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name as string]: name === 'tis_valor_base' ? Number(value) : value
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
            setError('Error al guardar: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Deseas eliminar este concepto de ingreso?')) return;
        try {
            setError(''); setMensaje('');
            await eliminarIngreso(id);
            setMensaje('Ingreso eliminado correctamente');
            await cargarIngresos();
        } catch (err: any) {
            setError('Error al eliminar: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEditar = (ingreso: Ingreso) => {
        setModoEdicion(true);
        setIngresoId(ingreso.TIS_ID);
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

    if (cargando) return <Box sx={{ p: 5, textAlign: 'center' }}><Typography>Cargando conceptos...</Typography></Box>;

    return (
        <Box sx={{ py: 3 }}>
            <Card sx={{ mb: 4, borderRadius: 2 }} elevation={3}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <PaidIcon color="primary" fontSize="large" />
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Conceptos de Ingreso</Typography>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 3 }}>
                            <TextField
                                fullWidth
                                label="Código"
                                name="tis_codigo"
                                value={form.tis_codigo}
                                onChange={handleChange}
                                placeholder="Ej: BONO01"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 5 }}>
                            <TextField
                                fullWidth
                                label="Nombre del Ingreso"
                                name="tis_nombre"
                                value={form.tis_nombre}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                label="Valor Base"
                                name="tis_valor_base"
                                type="number"
                                value={form.tis_valor_base}
                                onChange={handleChange}
                                slotProps={{
                                    input: {
                                        startAdornment: <InputAdornment position="start">Q</InputAdornment>,
                                    }
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 8 }}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Descripción"
                                name="tis_descripcion"
                                value={form.tis_descripcion}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                            <FormControl fullWidth>
                                <InputLabel>¿Recurrente?</InputLabel>
                                <Select
                                    name="tis_es_recurrente"
                                    value={form.tis_es_recurrente}
                                    label="¿Recurrente?"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="S">Sí</MenuItem>
                                    <MenuItem value="N">No</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 2 }}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Fecha Modificación"
                                name="fecha_modificacion"
                                value={form.fecha_modificacion}
                                onChange={handleChange}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarIngreso}>
                                    {modoEdicion ? 'Actualizar' : 'Guardar'}
                                </Button>
                                <Button variant="outlined" color="inherit" startIcon={<CleaningServicesIcon />} onClick={limpiarFormulario}>
                                    Limpiar
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableCell><strong>ID</strong></TableCell>
                                <TableCell><strong>Código</strong></TableCell>
                                <TableCell><strong>Nombre</strong></TableCell>
                                <TableCell align="right"><strong>Valor Base</strong></TableCell>
                                <TableCell align="center"><strong>Recurrente</strong></TableCell>
                                <TableCell><strong>Modificado</strong></TableCell>
                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {datos.length > 0 ? (
                                datos.map((ing) => (
                                    <TableRow key={ing.TIS_ID} hover>
                                        <TableCell>{ing.TIS_ID}</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>{ing.TIS_CODIGO}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{ing.TIS_NOMBRE}</Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                                {ing.TIS_DESCRIPCION}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">Q {Number(ing.TIS_VALOR_BASE).toFixed(2)}</TableCell>
                                        <TableCell align="center">
                                            {ing.TIS_ES_RECURRENTE === 'S' ?
                                                <EventRepeatIcon color="success" fontSize="small" /> :
                                                <Typography variant="caption">Único</Typography>
                                            }
                                        </TableCell>
                                        <TableCell>{ing.FECHA_MODIFICACION ? String(ing.FECHA_MODIFICACION).slice(0, 10) : '-'}</TableCell>
                                        <TableCell align="center">
                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                <Button size="small" onClick={() => handleEditar(ing)}><EditIcon fontSize="small" /></Button>
                                                <Button size="small" color="error" onClick={() => handleEliminar(ing.TIS_ID)}><DeleteIcon fontSize="small" /></Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>No hay registros</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')}>
                <Alert severity="success" variant="filled">{mensaje}</Alert>
            </Snackbar>
            <Snackbar open={!!error} autoHideDuration={5000} onClose={() => setError('')}>
                <Alert severity="error" variant="filled">{error}</Alert>
            </Snackbar>
        </Box>
    );
}

export default TipoIngresos;