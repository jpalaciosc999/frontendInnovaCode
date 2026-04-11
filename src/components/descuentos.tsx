import { useEffect, useState } from 'react';
import type { Descuento, DescuentoForm } from '../interfaces/descuentos';
import {
    obtenerDescuentos,
    crearDescuento,
    actualizarDescuento,
    eliminarDescuento
} from '../services/descuentos.service.ts';

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
    InputAdornment,
    Chip
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';

// Iconos
import PriceCheckIcon from '@mui/icons-material/PriceCheck';
import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

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

    useEffect(() => { cargarDescuentos(); }, []);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({
            ...prev,
            [name as string]: (name === 'tds_valor_base' || name === 'tds_porcentaje') ? Number(value) : value
        }));
    };

    const limpiarFormulario = () => {
        setForm(initialForm);
        setModoEdicion(false);
        setDescuentoId(null);
        setError('');
    };

    const guardarDescuento = async () => {
        try {
            setError(''); setMensaje('');
            if (!form.tds_codigo.trim() || !form.tds_nombre.trim()) {
                setError('Código y Nombre son obligatorios');
                return;
            }

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
            setError('Error: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Deseas eliminar este descuento?')) return;
        try {
            await eliminarDescuento(id);
            setMensaje('Eliminado correctamente');
            await cargarDescuentos();
        } catch (err: any) {
            setError('Error al eliminar');
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

    if (cargando) return <Box sx={{ p: 5, textAlign: 'center' }}><Typography>Cargando...</Typography></Box>;

    return (
        <Box sx={{ py: 3 }}>
            <Card sx={{ mb: 4, borderRadius: 2 }} elevation={3}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                        <PriceCheckIcon color="primary" fontSize="large" />
                        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Configuración de Descuentos</Typography>
                    </Box>

                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Código"
                                name="tds_codigo"
                                value={form.tds_codigo}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                fullWidth
                                label="Nombre"
                                name="tds_nombre"
                                value={form.tds_nombre}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth>
                                <InputLabel>Tipo Cálculo</InputLabel>
                                <Select
                                    name="tds_tipo_calculo"
                                    value={form.tds_tipo_calculo}
                                    label="Tipo Cálculo"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="POR">Porcentaje</MenuItem>
                                    <MenuItem value="VAL">Valor Fijo</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Valor Base"
                                name="tds_valor_base"
                                value={form.tds_valor_base}
                                onChange={handleChange}
                                slotProps={{
                                    input: { startAdornment: <InputAdornment position="start">Q</InputAdornment> }
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Porcentaje"
                                name="tds_porcentaje"
                                value={form.tds_porcentaje}
                                onChange={handleChange}
                                slotProps={{
                                    input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }
                                }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth>
                                <InputLabel>Estado</InputLabel>
                                <Select
                                    name="tds_estado"
                                    value={form.tds_estado}
                                    label="Estado"
                                    onChange={handleChange}
                                >
                                    <MenuItem value="A">Activo</MenuItem>
                                    <MenuItem value="I">Inactivo</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Fecha Creación"
                                name="tds_fecha_creacion"
                                value={form.tds_fecha_creacion}
                                onChange={handleChange}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarDescuento}>
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
                                <TableCell><strong>Código</strong></TableCell>
                                <TableCell><strong>Nombre</strong></TableCell>
                                <TableCell align="right"><strong>Valor/Porcentaje</strong></TableCell>
                                <TableCell align="center"><strong>Estado</strong></TableCell>
                                <TableCell align="center"><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {datos.map((d) => (
                                <TableRow key={d.TDS_ID} hover>
                                    <TableCell sx={{ fontWeight: 'bold' }}>{d.TDS_CODIGO}</TableCell>
                                    <TableCell>
                                        <Typography variant="body2">{d.TDS_NOMBRE}</Typography>
                                        <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                                            {d.TDS_DESCRIPCION}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        {d.TDS_PORCENTAJE > 0 ? `${d.TDS_PORCENTAJE}%` : `Q ${d.TDS_VALOR_BASE}`}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={d.TDS_ESTADO === 'A' ? 'Activo' : 'Inactivo'}
                                            color={d.TDS_ESTADO === 'A' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                            <Button size="small" onClick={() => handleEditar(d)}><EditIcon fontSize="small" /></Button>
                                            <Button size="small" color="error" onClick={() => handleEliminar(d.TDS_ID)}><DeleteIcon fontSize="small" /></Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
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

export default DescuentosCRUD;
