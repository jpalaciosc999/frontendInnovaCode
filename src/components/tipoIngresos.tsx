import { useEffect, useState } from 'react';
import type { Ingreso, IngresoForm } from '../interfaces/tipoIngresos';
import {
    obtenerIngresos,
    crearIngreso,
    actualizarIngreso,
    eliminarIngreso
} from '../services/tipoIngresos.service';
import { getApiErrorMessage } from '../api/errors';

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
import { useUnsavedFormGuard } from '../hooks/useUnsavedFormGuard';

const initialForm: IngresoForm = {
    tis_codigo: '',
    tis_nombre: '',
    tis_descripcion: '',
    tis_valor_base: 0,
    tis_es_recurrente: '',
    fecha_modificacion: ''
};

const conceptosEstandar: Array<{
    label: string;
    helper: string;
    data: IngresoForm;
}> = [
    {
        label: 'Salario base',
        helper: 'Ingreso principal recurrente del empleado',
        data: {
            ...initialForm,
            tis_codigo: 'SALARIO',
            tis_nombre: 'Salario base',
            tis_descripcion: 'Sueldo ordinario mensual del empleado. El monto real puede venir del contrato o empleado.',
            tis_valor_base: 0,
            tis_es_recurrente: 'S'
        }
    },
    {
        label: 'Bonificacion incentivo',
        helper: 'Bonificacion mensual vigente en Guatemala',
        data: {
            ...initialForm,
            tis_codigo: 'BONIF-INC',
            tis_nombre: 'Bonificacion incentivo',
            tis_descripcion: 'Bonificacion incentivo mensual. Ajusta el valor si la politica interna lo requiere.',
            tis_valor_base: 250,
            tis_es_recurrente: 'S'
        }
    },
    {
        label: 'Horas extra',
        helper: 'Pago variable por tiempo extraordinario',
        data: {
            ...initialForm,
            tis_codigo: 'HORA-EXTRA',
            tis_nombre: 'Horas extra',
            tis_descripcion: 'Pago variable por horas extraordinarias registradas en el periodo.',
            tis_valor_base: 0,
            tis_es_recurrente: 'N'
        }
    },
    {
        label: 'Comisiones',
        helper: 'Ingreso variable por ventas u objetivos',
        data: {
            ...initialForm,
            tis_codigo: 'COMISION',
            tis_nombre: 'Comisiones',
            tis_descripcion: 'Ingreso variable por comisiones de ventas, metas u objetivos.',
            tis_valor_base: 0,
            tis_es_recurrente: 'N'
        }
    },
    {
        label: 'Bono KPI',
        helper: 'Bono de productividad conectado a resultados KPI',
        data: {
            ...initialForm,
            tis_codigo: 'BONO-KPI',
            tis_nombre: 'Bono de productividad KPI',
            tis_descripcion: 'Bono variable calculado desde resultados KPI del empleado.',
            tis_valor_base: 0,
            tis_es_recurrente: 'N'
        }
    },
    {
        label: 'Bono meta',
        helper: 'Bono variable por cumplimiento',
        data: {
            ...initialForm,
            tis_codigo: 'BONO-META',
            tis_nombre: 'Bono por cumplimiento de meta',
            tis_descripcion: 'Bono variable por cumplimiento de metas operativas o comerciales.',
            tis_valor_base: 0,
            tis_es_recurrente: 'N'
        }
    },
    {
        label: 'Aguinaldo',
        helper: 'Prestacion anual proporcional o completa',
        data: {
            ...initialForm,
            tis_codigo: 'AGUINALDO',
            tis_nombre: 'Aguinaldo',
            tis_descripcion: 'Prestacion laboral de aguinaldo, completa o proporcional.',
            tis_valor_base: 0,
            tis_es_recurrente: 'N'
        }
    },
    {
        label: 'Bono 14',
        helper: 'Prestacion anual proporcional o completa',
        data: {
            ...initialForm,
            tis_codigo: 'BONO14',
            tis_nombre: 'Bono 14',
            tis_descripcion: 'Prestacion laboral Bono 14, completa o proporcional.',
            tis_valor_base: 0,
            tis_es_recurrente: 'N'
        }
    },
    {
        label: 'Vacaciones pagadas',
        helper: 'Pago por vacaciones liquidadas',
        data: {
            ...initialForm,
            tis_codigo: 'VAC-PAG',
            tis_nombre: 'Vacaciones pagadas',
            tis_descripcion: 'Pago de vacaciones gozadas o compensadas segun liquidacion.',
            tis_valor_base: 0,
            tis_es_recurrente: 'N'
        }
    },
    {
        label: 'Reintegro',
        helper: 'Devolucion o ajuste a favor del empleado',
        data: {
            ...initialForm,
            tis_codigo: 'REINTEGRO',
            tis_nombre: 'Reintegro',
            tis_descripcion: 'Reintegro o ajuste positivo a favor del empleado.',
            tis_valor_base: 0,
            tis_es_recurrente: 'N'
        }
    },
    {
        label: 'Viaticos',
        helper: 'Pago de viaticos o gastos autorizados',
        data: {
            ...initialForm,
            tis_codigo: 'VIATICOS',
            tis_nombre: 'Viaticos',
            tis_descripcion: 'Pago de viaticos o gastos autorizados segun politica interna.',
            tis_valor_base: 0,
            tis_es_recurrente: 'N'
        }
    },
    {
        label: 'Indemnizacion',
        helper: 'Pago por terminacion laboral',
        data: {
            ...initialForm,
            tis_codigo: 'INDEMNIZ',
            tis_nombre: 'Indemnizacion',
            tis_descripcion: 'Pago de indemnizacion por terminacion de relacion laboral.',
            tis_valor_base: 0,
            tis_es_recurrente: 'N'
        }
    }
];

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
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Error cargando ingresos'));
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

    const aplicarConceptoEstandar = (data: IngresoForm) => {
        setForm({
            ...data,
            fecha_modificacion: new Date().toISOString().slice(0, 10)
        });
        setModoEdicion(false);
        setIngresoId(null);
        setError('');
        setMensaje('');
    };

    const validarFormulario = () => {
        if (
            !form.tis_codigo.trim() ||
            !form.tis_nombre.trim() ||
            form.tis_valor_base < 0 ||
            !form.tis_es_recurrente.trim()
        ) {
            setError('Codigo, nombre, valor no negativo y recurrencia son obligatorios');
            return false;
        }
        return true;
    };

    const guardarIngreso = async () => {
        try {
            setError('');
            setMensaje('');

            if (!validarFormulario()) return false;

            if (modoEdicion && ingresoId !== null) {
                await actualizarIngreso(ingresoId, form);
                setMensaje('Ingreso actualizado correctamente');
            } else {
                await crearIngreso(form);
                setMensaje('Ingreso creado correctamente');
            }

            limpiarFormulario();
            await cargarIngresos();
            return true;
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Error al guardar ingreso'));
            return false;
        }
    };

    useUnsavedFormGuard(form, initialForm, guardarIngreso);

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Deseas eliminar este concepto de ingreso?')) return;
        try {
            setError(''); setMensaje('');
            await eliminarIngreso(id);
            setMensaje('Ingreso eliminado correctamente');
            await cargarIngresos();
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Error al eliminar ingreso'));
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

                    <Alert severity="info" sx={{ mb: 2 }}>
                        Salario, bonificaciones, horas extra, comisiones y prestaciones se administran aqui como conceptos. Luego se aplican a una nomina desde Detalle de Nomina.
                    </Alert>

                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
                        {conceptosEstandar.map((concepto) => (
                            <Button
                                key={concepto.data.tis_codigo}
                                size="small"
                                variant="outlined"
                                title={concepto.helper}
                                onClick={() => aplicarConceptoEstandar(concepto.data)}
                            >
                                {concepto.label}
                            </Button>
                        ))}
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
