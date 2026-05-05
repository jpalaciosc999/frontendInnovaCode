import { useEffect, useState } from 'react';
import type { EmpleadoContrato, EmpleadoContratoForm } from '../interfaces/empleado_contrato';
import type { TipoContrato } from '../interfaces/tipoContrato';
import type { Empleado } from '../interfaces/empleados';
import {
    obtenerContratos,
    crearContrato,
    actualizarContrato,
    eliminarContrato
} from '../services/empleado_contrato.service';
import { obtenerTiposContrato } from '../services/tipoContrato.service';
import { obtenerEmpleados } from '../services/empleados.service';

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
    tic_id: '',
    emp_id: ''
};

function EmpleadoContratoCRUD() {
    const [datos, setDatos] = useState<EmpleadoContrato[]>([]);
    const [tiposContrato, setTiposContrato] = useState<TipoContrato[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoRelaciones, setCargandoRelaciones] = useState(false);
    const [error, setError] = useState('');
    const [relacionesError, setRelacionesError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [id, setId] = useState<number | null>(null);
    const [form, setForm] = useState<EmpleadoContratoForm>(initialForm);

    const obtenerNombreEmpleado = (empleado: Empleado) =>
        `${empleado.EMP_NOMBRE ?? ''} ${empleado.EMP_APELLIDO ?? ''}`.trim();

    const obtenerEmpleadoPorId = (empId: number | string | undefined) =>
        empleados.find((empleado) => String(empleado.EMP_ID) === String(empId));

    const obtenerNombreTipoContrato = (ticId: number | string) => {
        const tipo = tiposContrato.find((item) => String(item.TIC_ID) === String(ticId));
        if (!tipo) return `Tipo de contrato #${ticId}`;

        return `${tipo.TIC_NOMBRE} - ${tipo.TIC_TIPO_JORNADA}`;
    };

    const obtenerTipoContrato = (ticId: number | string) =>
        tiposContrato.find((item) => String(item.TIC_ID) === String(ticId));

    const esContratoIndefinido = (ticId: number | string) => {
        const tipo = obtenerTipoContrato(ticId);
        return tipo?.TIC_NOMBRE.toLowerCase().includes('indefinido') ?? false;
    };

    const obtenerDetalleEmpleado = (empId: number | string | undefined) => {
        const empleado = obtenerEmpleadoPorId(empId);
        if (!empleado) return 'Empleado pendiente de identificar';

        return obtenerNombreEmpleado(empleado) || `Empleado #${empleado.EMP_ID}`;
    };

    const obtenerFechaActual = () => new Date().toISOString().split('T')[0];

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

    const cargarRelaciones = async () => {
        try {
            setCargandoRelaciones(true);
            setRelacionesError('');
            const [tiposData, empleadosData] = await Promise.all([
                obtenerTiposContrato(),
                obtenerEmpleados()
            ]);
            setTiposContrato(tiposData);
            setEmpleados(empleadosData);
        } catch (err: any) {
            setTiposContrato([]);
            setEmpleados([]);
            setRelacionesError(
                'No se pudieron cargar empleados o tipos de contrato. Puedes ingresar el ID manualmente. ' +
                (err.response?.data?.error || err.message)
            );
        } finally {
            setCargandoRelaciones(false);
        }
    };

    useEffect(() => {
        cargarDatos();
        cargarRelaciones();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setForm((prev) => {
            if (name === 'tic_id' && esContratoIndefinido(value)) {
                return { ...prev, [name]: value, tco_fecha_fin: '' };
            }

            return { ...prev, [name]: value };
        });
    };

    const limpiarFormulario = () => {
        setForm(initialForm);
        setModoEdicion(false);
        setId(null);
        setError('');
    };

    const validar = () => {
        if (!form.tco_fecha_inicio || !form.tco_estado || !form.tic_id || !form.emp_id) {
            setError('Campos obligatorios faltantes: Empleado, Tipo de contrato, Fecha de inicio y Estado son requeridos');
            return false;
        }

        const contratoIndefinido = esContratoIndefinido(form.tic_id);

        if (!contratoIndefinido && !form.tco_fecha_fin) {
            setError('La fecha de fin es obligatoria para contratos con plazo definido');
            return false;
        }

        if (!contratoIndefinido && form.tco_fecha_fin < form.tco_fecha_inicio) {
            setError('La fecha de fin no puede ser anterior a la fecha de inicio');
            return false;
        }

        return true;
    };

    const guardar = async () => {
        try {
            setError('');
            setMensaje('');
            if (!validar()) return;

            const contratoIndefinido = esContratoIndefinido(form.tic_id);
            const payload: EmpleadoContratoForm = {
                ...form,
                tco_fecha_fin: contratoIndefinido ? '' : form.tco_fecha_fin,
                tic_fecha_modificacion: obtenerFechaActual()
            };

            if (modoEdicion && id !== null) {
                await actualizarContrato(id, payload);
                setMensaje('Contrato actualizado correctamente');
            } else {
                await crearContrato(payload);
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
            tic_id: c.TIC_ID,
            emp_id: c.EMP_ID ? String(c.EMP_ID) : ''
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

    const formatearFechaFin = (contrato: EmpleadoContrato) => {
        if (esContratoIndefinido(contrato.TIC_ID)) return 'Indefinido';
        return formatearFecha(contrato.TCO_FECHA_FIN);
    };

    const contratoActualIndefinido = esContratoIndefinido(form.tic_id);

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
                            value={contratoActualIndefinido ? '' : form.tco_fecha_fin}
                            onChange={handleChange}
                            disabled={contratoActualIndefinido}
                            helperText={
                                contratoActualIndefinido
                                    ? 'No aplica para contratos indefinidos'
                                    : 'Requerida para contratos con plazo definido'
                            }
                            slotProps={{ inputLabel: { shrink: true } }}
                            required={!contratoActualIndefinido}
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

                    <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'none' }}>
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
                        {empleados.length > 0 ? (
                            <TextField
                                select
                                fullWidth
                                label="Empleado"
                                name="emp_id"
                                value={form.emp_id}
                                onChange={handleChange}
                                disabled={cargandoRelaciones}
                                helperText="Selecciona el empleado al que se asigna el contrato"
                                required
                            >
                                {empleados.map((empleado) => (
                                    <MenuItem key={empleado.EMP_ID} value={String(empleado.EMP_ID)}>
                                        {obtenerNombreEmpleado(empleado) || `Empleado #${empleado.EMP_ID}`} - ID {empleado.EMP_ID}
                                    </MenuItem>
                                ))}
                            </TextField>
                        ) : (
                            <TextField
                                fullWidth
                                label="Empleado ID"
                                name="emp_id"
                                type="number"
                                value={form.emp_id}
                                onChange={handleChange}
                                helperText={cargandoRelaciones ? 'Cargando empleados...' : 'Ingresa el ID del empleado'}
                                required
                            />
                        )}
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        {tiposContrato.length > 0 ? (
                            <TextField
                                select
                                fullWidth
                                label="Tipo de contrato"
                                name="tic_id"
                                value={form.tic_id}
                                onChange={handleChange}
                                disabled={cargandoRelaciones}
                                helperText="Selecciona la modalidad de contrato"
                                required
                            >
                                {form.tic_id &&
                                    !tiposContrato.some((tipo) => String(tipo.TIC_ID) === String(form.tic_id)) && (
                                        <MenuItem value={String(form.tic_id)}>
                                            Tipo de contrato #{form.tic_id}
                                        </MenuItem>
                                    )}
                                {tiposContrato.map((tipo) => (
                                    <MenuItem key={tipo.TIC_ID} value={String(tipo.TIC_ID)}>
                                        {tipo.TIC_NOMBRE} - {tipo.TIC_TIPO_JORNADA}
                                    </MenuItem>
                                ))}
                            </TextField>
                        ) : (
                            <TextField
                                fullWidth
                                label="Tipo de contrato ID"
                                name="tic_id"
                                type="number"
                                value={form.tic_id}
                                onChange={handleChange}
                                helperText={cargandoRelaciones ? 'Cargando tipos de contrato...' : 'Ingresa el ID del tipo de contrato'}
                                required
                            />
                        )}
                    </Grid>

                    {relacionesError && (
                        <Grid size={{ xs: 12 }}>
                            <Alert severity="warning">{relacionesError}</Alert>
                        </Grid>
                    )}

                    {form.tic_id && (
                        <Grid size={{ xs: 12 }}>
                            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                    Asignación seleccionada
                                </Typography>
                                <Typography variant="body2">
                                    {obtenerNombreTipoContrato(form.tic_id)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {obtenerDetalleEmpleado(form.emp_id)}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}
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
                                <TableCell><strong>Tipo de contrato</strong></TableCell>
                                <TableCell><strong>Empleado</strong></TableCell>
                                <TableCell><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {datos.length > 0 ? (
                                datos.map((c) => (
                                    <TableRow key={c.TCO_ID} hover>
                                        <TableCell>{c.TCO_ID}</TableCell>
                                        <TableCell>{formatearFecha(c.TCO_FECHA_INICIO)}</TableCell>
                                        <TableCell>{formatearFechaFin(c)}</TableCell>
                                        <TableCell>{obtenerChipEstado(c.TCO_ESTADO)}</TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{obtenerNombreTipoContrato(c.TIC_ID)}</Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                ID {c.TIC_ID}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{obtenerDetalleEmpleado(c.EMP_ID)}</Typography>
                                            {c.EMP_ID && (
                                                <Typography variant="caption" color="text.secondary">
                                                    ID {c.EMP_ID}
                                                </Typography>
                                            )}
                                        </TableCell>
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
                                    <TableCell colSpan={7} align="center">
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
