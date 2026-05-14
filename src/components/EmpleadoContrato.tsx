import { useEffect, useMemo, useState } from 'react';
import type { EmpleadoContrato } from '../interfaces/empleado_contrato';
import type { TipoContrato } from '../interfaces/tipoContrato';
import type { Empleado } from '../interfaces/empleados';
import { eliminarContrato, obtenerContratos } from '../services/empleado_contrato.service';
import { obtenerTiposContrato } from '../services/tipoContrato.service';
import { obtenerEmpleados } from '../services/empleados.service';

import {
    Alert,
    Box,
    Button,
    Chip,
    Grid,
    MenuItem,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import DeleteIcon from '@mui/icons-material/Delete';

const initialFilters = {
    empleado: '',
    tipoContrato: '',
    estado: ''
};

type FilaHistorialContrato = {
    id: string;
    contratoId?: number;
    fechaInicio: string;
    fechaFin: string;
    estado: string;
    ticId?: number | string;
    empId?: number | string;
    motivoCambio?: string;
    origen: 'historico' | 'actual';
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
    const [filters, setFilters] = useState(initialFilters);

    const obtenerNombreEmpleado = (empleado: Empleado) =>
        `${empleado.EMP_NOMBRE ?? ''} ${empleado.EMP_APELLIDO ?? ''}`.trim();

    const obtenerEmpleadoPorId = (empId: number | string | undefined) =>
        empleados.find((empleado) => String(empleado.EMP_ID) === String(empId));

    const obtenerContratoEmpleadoId = (contrato: EmpleadoContrato) => {
        const contratoConVariantes = contrato as EmpleadoContrato & {
            emp_id?: number | string;
            EMPID?: number | string;
            EMPLEADO_ID?: number | string;
            empleado_id?: number | string;
        };

        return (
            contrato.EMP_ID ??
            contratoConVariantes.emp_id ??
            contratoConVariantes.EMPID ??
            contratoConVariantes.EMPLEADO_ID ??
            contratoConVariantes.empleado_id
        );
    };

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
        if (!empleado) return empId ? `Empleado #${empId}` : 'Empleado pendiente de identificar';

        return obtenerNombreEmpleado(empleado) || `Empleado #${empleado.EMP_ID}`;
    };

    const cargarDatos = async (controlarCarga = true) => {
        try {
            if (controlarCarga) setCargando(true);
            setError('');
            const data = await obtenerContratos();
            setDatos(data);
        } catch (err: any) {
            setError('Error cargando contratos: ' + (err.response?.data?.error || err.message));
        } finally {
            if (controlarCarga) setCargando(false);
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
                'No se pudieron cargar empleados o tipos de contrato. Se mostraran los IDs disponibles. ' +
                (err.response?.data?.error || err.message)
            );
        } finally {
            setCargandoRelaciones(false);
        }
    };

    useEffect(() => {
        const cargarVista = async () => {
            setCargando(true);
            await Promise.all([cargarDatos(false), cargarRelaciones()]);
            setCargando(false);
        };

        cargarVista();
    }, []);

    const obtenerChipEstado = (estado: string) => {
        if (estado === 'A') return <Chip label="Activo" color="success" size="small" />;
        if (estado === 'I') return <Chip label="Inactivo" color="error" size="small" />;
        return <Chip label={estado} color="default" size="small" />;
    };

    const formatearFecha = (fecha: string | undefined) => {
        if (!fecha) return '-';

        const [year, month, day] = String(fecha).split('T')[0].split('-').map(Number);
        if (!year || !month || !day) return '-';

        return new Date(year, month - 1, day).toLocaleDateString('es-GT');
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const limpiarFiltros = () => {
        setFilters(initialFilters);
    };

    const handleEliminar = async (contratoId: number) => {
        if (!window.confirm('Deseas eliminar este registro historico de contrato?')) return;

        try {
            setError('');
            setMensaje('');
            await eliminarContrato(contratoId);
            setMensaje('Registro de contrato eliminado correctamente');
            await cargarDatos();
        } catch (err: any) {
            setError('Error al eliminar contrato: ' + (err.response?.data?.error || err.message));
        }
    };

    const filasHistorial = useMemo<FilaHistorialContrato[]>(() => {
        const filasHistoricas: FilaHistorialContrato[] = datos.map((contrato) => ({
            id: `historico-${contrato.TCO_ID}`,
            contratoId: contrato.TCO_ID,
            fechaInicio: contrato.TCO_FECHA_INICIO,
            fechaFin: contrato.TCO_FECHA_FIN,
            estado: contrato.TCO_ESTADO,
            ticId: contrato.TIC_ID,
            empId: obtenerContratoEmpleadoId(contrato),
            motivoCambio: contrato.TCO_MOTIVO_CAMBIO,
            origen: 'historico'
        }));

        const filasContratoActual: FilaHistorialContrato[] = empleados
            .filter((empleado) => empleado.TIC_ID)
            .map((empleado) => ({
                id: `empleado-${empleado.EMP_ID}`,
                fechaInicio: empleado.EMP_FECHA_INICIO_CONTRATO || empleado.EMP_FECHA_CONTRATACION,
                fechaFin: empleado.EMP_FECHA_FIN_CONTRATO || '',
                estado: empleado.EMP_ESTADO,
                ticId: empleado.TIC_ID,
                empId: empleado.EMP_ID,
                motivoCambio: '',
                origen: 'actual' as const
            }))
            .filter((filaActual) => {
                const existeMismoPeriodo = filasHistoricas.some((filaHistorica) =>
                    String(filaHistorica.empId ?? '') === String(filaActual.empId ?? '') &&
                    String(filaHistorica.ticId ?? '') === String(filaActual.ticId ?? '') &&
                    String(filaHistorica.fechaInicio || '').slice(0, 10) === String(filaActual.fechaInicio || '').slice(0, 10) &&
                    String(filaHistorica.fechaFin || '').slice(0, 10) === String(filaActual.fechaFin || '').slice(0, 10)
                );

                return !existeMismoPeriodo;
            });

        return [...filasContratoActual, ...filasHistoricas].sort((a, b) => {
            const empleadoA = String(a.empId ?? '').padStart(10, '0');
            const empleadoB = String(b.empId ?? '').padStart(10, '0');
            if (empleadoA !== empleadoB) return empleadoA.localeCompare(empleadoB);

            return String(a.fechaInicio || '').localeCompare(String(b.fechaInicio || ''));
        });
    }, [datos, empleados]);

    const filasFiltradas = useMemo(
        () =>
            filasHistorial.filter((fila) => {
                const empleadoId = fila.empId;

                if (filters.empleado && String(empleadoId ?? '') !== filters.empleado) return false;
                if (filters.tipoContrato && String(fila.ticId ?? '') !== filters.tipoContrato) return false;
                if (filters.estado && fila.estado !== filters.estado) return false;

                return true;
            }),
        [filasHistorial, filters]
    );

    if (cargando) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6">Cargando contratos...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 2 }}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <ArticleIcon color="primary" />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        Historial de Contratos
                    </Typography>
                </Box>

                <Alert severity="info">
                    Esta vista muestra cada periodo de contrato asignado por empleado. Si un empleado cambia de contrato,
                    debe verse una fila para el contrato anterior y otra para el nuevo periodo.
                </Alert>
            </Paper>

            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Registros de contratos: {filasFiltradas.length} de {filasHistorial.length}
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                        {error}
                    </Alert>
                )}

                {mensaje && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensaje('')}>
                        {mensaje}
                    </Alert>
                )}

                {relacionesError && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        {relacionesError}
                    </Alert>
                )}

                <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Empleado"
                            name="empleado"
                            value={filters.empleado}
                            onChange={handleFilterChange}
                            disabled={cargandoRelaciones}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            {empleados.map((empleado) => (
                                <MenuItem key={empleado.EMP_ID} value={String(empleado.EMP_ID)}>
                                    {obtenerNombreEmpleado(empleado) || `Empleado #${empleado.EMP_ID}`}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Tipo de contrato"
                            name="tipoContrato"
                            value={filters.tipoContrato}
                            onChange={handleFilterChange}
                            disabled={cargandoRelaciones}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            {tiposContrato.map((tipo) => (
                                <MenuItem key={tipo.TIC_ID} value={String(tipo.TIC_ID)}>
                                    {tipo.TIC_NOMBRE} - {tipo.TIC_TIPO_JORNADA}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="Estado"
                            name="estado"
                            value={filters.estado}
                            onChange={handleFilterChange}
                        >
                            <MenuItem value="">Todos</MenuItem>
                            <MenuItem value="A">Activo</MenuItem>
                            <MenuItem value="I">Inactivo</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, md: 2 }}>
                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<CleaningServicesIcon />}
                            onClick={limpiarFiltros}
                        >
                            Limpiar
                        </Button>
                    </Grid>
                </Grid>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Empleado</strong></TableCell>
                                <TableCell><strong>Tipo de contrato</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell><strong>Fecha inicio</strong></TableCell>
                                <TableCell><strong>Fecha fin</strong></TableCell>
                                <TableCell><strong>Motivo cambio</strong></TableCell>
                                <TableCell><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {filasFiltradas.length > 0 ? (
                                filasFiltradas.map((fila) => {
                                    return (
                                        <TableRow key={fila.id} hover>
                                            <TableCell>
                                                <Typography variant="body2">{obtenerDetalleEmpleado(fila.empId)}</Typography>
                                                {fila.empId && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        ID {fila.empId}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {fila.ticId ? obtenerNombreTipoContrato(fila.ticId) : 'Sin contrato asignado'}
                                                </Typography>
                                                {fila.ticId && (
                                                    <Typography variant="caption" color="text.secondary">
                                                        ID {fila.ticId}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>{obtenerChipEstado(fila.estado)}</TableCell>
                                            <TableCell>{formatearFecha(fila.fechaInicio)}</TableCell>
                                            <TableCell>
                                                {fila.ticId && esContratoIndefinido(fila.ticId)
                                                    ? 'Indefinido'
                                                    : formatearFecha(fila.fechaFin)}
                                            </TableCell>
                                            <TableCell>{fila.motivoCambio || '-'}</TableCell>
                                            <TableCell>
                                                {fila.contratoId ? (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="error"
                                                        startIcon={<DeleteIcon />}
                                                        onClick={() => handleEliminar(fila.contratoId!)}
                                                    >
                                                        Eliminar
                                                    </Button>
                                                ) : (
                                                    <Typography variant="caption" color="text.secondary">
                                                        Editar en empleados
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        No hay registros de contratos
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}

export default EmpleadoContratoCRUD;
