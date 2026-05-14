import { useEffect, useMemo, useState } from 'react';
import type { NominaDetalle, NominaDetalleForm } from '../interfaces/nomina-detalle';
import type { Nomina } from '../interfaces/nomina';
import type { Ingreso } from '../interfaces/tipoIngresos';
import type { Descuento } from '../interfaces/descuentos';
import type { KPIResultado } from '../interfaces/kpi-resultado';
import type { Empleado } from '../interfaces/empleados';
import type { Puesto } from '../interfaces/puestos';
import {
    obtenerDetallesNomina,
    crearDetalleNomina,
    actualizarDetalleNomina,
    eliminarDetalleNomina
} from '../services/nomina-detalle.service.ts';
import { actualizarNomina, obtenerNominas } from '../services/nomina.service';
import { obtenerIngresos } from '../services/tipoIngresos.service';
import { obtenerDescuentos } from '../services/descuentos.service';
import { obtenerResultados } from '../services/kpi-resultado.service';
import { obtenerEmpleados } from '../services/empleados.service';
import { obtenerPuestos } from '../services/puestos.service';
import { getApiErrorMessage } from '../api/errors';
import { formatearMoneda, obtenerNombreEmpleado } from '../utils/relations';
import { calcularISR, obtenerSueldoMensual, TASA_IGSS_LABORAL } from '../utils/payroll';

import {
    Alert,
    Box,
    Button,
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
    Typography
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const initialForm: NominaDetalleForm = {
    det_referencia: null,
    det_monto: null,
    nom_id: null,
    tis_id: null,
    tds_id: null,
    kre_id: null
};

type TipoConceptoNomina = '' | 'INGRESO' | 'DESCUENTO' | 'KPI';

function NominaDetalleCRUD() {
    const [datos, setDatos] = useState<NominaDetalle[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [detalleId, setDetalleId] = useState<number | null>(null);
    const [form, setForm] = useState<NominaDetalleForm>(initialForm);
    const [nominas, setNominas] = useState<Nomina[]>([]);
    const [ingresos, setIngresos] = useState<Ingreso[]>([]);
    const [descuentos, setDescuentos] = useState<Descuento[]>([]);
    const [resultadosKpi, setResultadosKpi] = useState<KPIResultado[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [puestos, setPuestos] = useState<Puesto[]>([]);
    const [tipoConcepto, setTipoConcepto] = useState<TipoConceptoNomina>('');

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError('');
            const [detallesData, nominasData, ingresosData, descuentosData, resultadosData, empleadosData, puestosData] = await Promise.all([
                obtenerDetallesNomina(),
                obtenerNominas(),
                obtenerIngresos(),
                obtenerDescuentos(),
                obtenerResultados(),
                obtenerEmpleados(),
                obtenerPuestos()
            ]);
            setDatos(detallesData);
            setNominas(nominasData);
            setIngresos(ingresosData);
            setDescuentos(descuentosData);
            setResultadosKpi(resultadosData);
            setEmpleados(empleadosData);
            setPuestos(puestosData);
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Error cargando detalles de nomina'));
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const empleadosPorId = useMemo(
        () => new Map(empleados.map((empleado) => [String(empleado.EMP_ID), empleado])),
        [empleados]
    );

    const puestosPorId = useMemo(
        () => new Map(puestos.map((puesto) => [String(puesto.PUE_ID), puesto])),
        [puestos]
    );

    const nominasPorId = useMemo(
        () => new Map(nominas.map((nomina) => [String(nomina.NOM_ID), nomina])),
        [nominas]
    );

    const ingresosPorId = useMemo(
        () => new Map(ingresos.map((ingreso) => [String(ingreso.TIS_ID), ingreso])),
        [ingresos]
    );

    const descuentosPorId = useMemo(
        () => new Map(descuentos.map((descuento) => [String(descuento.TDS_ID), descuento])),
        [descuentos]
    );

    const resultadosPorId = useMemo(
        () => new Map(resultadosKpi.map((resultado) => [String(resultado.KRE_ID), resultado])),
        [resultadosKpi]
    );

    const toInputDate = (value: string | null | undefined) => {
        if (!value) return '';
        const raw = String(value);
        const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

        const oracleMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
        if (oracleMatch) return `${oracleMatch[3]}-${oracleMatch[2]}-${oracleMatch[1]}`;

        return raw.slice(0, 10);
    };

    const calcularTotalesNomina = (nomId: string | number, listaDetalles: NominaDetalle[]) =>
        listaDetalles
            .filter((detalle) => String(detalle.NOM_ID) === String(nomId))
            .reduce(
                (totales, detalle) => {
                    const monto = Number(detalle.DET_MONTO || 0);
                    if (detalle.TDS_ID) {
                        totales.descuentos += monto;
                    } else {
                        totales.ingresos += monto;
                    }
                    totales.liquido = totales.ingresos - totales.descuentos;
                    return totales;
                },
                { ingresos: 0, descuentos: 0, liquido: 0 }
            );

    const actualizarTotalesCabecera = async (nomId: string | number, listaDetalles: NominaDetalle[]) => {
        const nomina = nominasPorId.get(String(nomId));
        if (!nomina) return;

        const totales = calcularTotalesNomina(nomId, listaDetalles);
        await actualizarNomina(nomina.NOM_ID, {
            nom_total_ingresos: totales.ingresos.toFixed(2),
            nom_total_descuento: totales.descuentos.toFixed(2),
            nom_salario_liquido: totales.liquido.toFixed(2),
            nom_fecha_generacion: toInputDate(nomina.NOM_FECHA_GENERACION),
            per_id: nomina.PER_ID,
            empleado_id: nomina.EMP_ID,
            liq_id: nomina.LIQ_ID,
            nom_estado: nomina.NOM_ESTADO
        });
    };

    const sincronizarCabeceras = async (nomIds: Array<string | number | null | undefined>) => {
        const idsUnicos = Array.from(new Set(nomIds.filter(Boolean).map(String)));
        if (idsUnicos.length === 0) return;

        const detallesActualizados = await obtenerDetallesNomina();
        await Promise.all(idsUnicos.map((nomId) => actualizarTotalesCabecera(nomId, detallesActualizados)));
    };

    const obtenerEmpleadoDeNomina = (nomId: string | number | null | undefined) => {
        const nomina = nominasPorId.get(String(nomId ?? ''));
        return nomina ? empleadosPorId.get(String(nomina.EMP_ID)) : undefined;
    };

    const obtenerNominaSeleccionada = () => nominasPorId.get(String(form.nom_id ?? ''));

    const resultadosKpiDisponibles = useMemo(() => {
        const nomina = nominasPorId.get(String(form.nom_id ?? ''));
        if (!nomina) return [];
        return resultadosKpi.filter((resultado) => String(resultado.EMP_ID ?? '') === String(nomina.EMP_ID));
    }, [form.nom_id, nominasPorId, resultadosKpi]);

    const obtenerPuestoEmpleado = (empleado?: Empleado) =>
        empleado?.PUE_ID ? puestosPorId.get(String(empleado.PUE_ID)) : undefined;

    const obtenerSueldoNomina = (nomId: string | number | null | undefined) => {
        const empleado = obtenerEmpleadoDeNomina(nomId);
        if (!empleado) return 0;
        return obtenerSueldoMensual(empleado, obtenerPuestoEmpleado(empleado));
    };

    const calcularMontoIngreso = (ingreso: Ingreso, nomId: string | number | null | undefined) => {
        const codigo = ingreso.TIS_CODIGO.toUpperCase();
        if (codigo === 'SALARIO') return obtenerSueldoNomina(nomId);
        return Number(ingreso.TIS_VALOR_BASE || 0);
    };

    const calcularMontoDescuento = (descuento: Descuento, nomId: string | number | null | undefined) => {
        const sueldo = obtenerSueldoNomina(nomId);
        const codigo = descuento.TDS_CODIGO.toUpperCase();

        if (codigo === 'IGSS-LAB') return sueldo * TASA_IGSS_LABORAL;
        if (codigo === 'ISR') return calcularISR(sueldo).isr_mensual;
        if (descuento.TDS_TIPO_CALCULO === 'PORCENTAJE') return sueldo * (Number(descuento.TDS_PORCENTAJE || 0) / 100);
        return Number(descuento.TDS_VALOR_BASE || 0);
    };

    const aplicarMontoSugerido = (next: NominaDetalleForm) => {
        const ingreso = ingresosPorId.get(String(next.tis_id ?? ''));
        const descuento = descuentosPorId.get(String(next.tds_id ?? ''));
        const resultado = resultadosPorId.get(String(next.kre_id ?? ''));

        if (resultado) {
            return {
                ...next,
                det_referencia: resultado.KRE_ID,
                det_monto: Number(resultado.KRE_MONTO_TOTAL || 0).toFixed(2)
            };
        }

        if (ingreso) {
            return {
                ...next,
                det_referencia: ingreso.TIS_ID,
                det_monto: calcularMontoIngreso(ingreso, next.nom_id).toFixed(2)
            };
        }

        if (descuento) {
            return {
                ...next,
                det_referencia: descuento.TDS_ID,
                det_monto: calcularMontoDescuento(descuento, next.nom_id).toFixed(2)
            };
        }

        return next;
    };

    const obtenerEtiquetaNomina = (nomina?: Nomina) => {
        if (!nomina) return '';
        const empleado = empleadosPorId.get(String(nomina.EMP_ID));
        return `Nomina #${nomina.NOM_ID} - ${obtenerNombreEmpleado(empleado) || `Empleado #${nomina.EMP_ID}`}`;
    };

    const handleTipoConceptoChange = (e: SelectChangeEvent) => {
        const value = e.target.value as TipoConceptoNomina;
        setTipoConcepto(value);
        setForm((prev) => ({
            ...prev,
            det_referencia: null,
            det_monto: null,
            tis_id: null,
            tds_id: null,
            kre_id: null
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
        const { name, value } = e.target;
        setForm((prev) => {
            const next = { ...prev, [name as string]: value };
            if (name === 'nom_id' && tipoConcepto === 'KPI') {
                return { ...next, det_referencia: null, det_monto: null, kre_id: null };
            }
            if (name === 'nom_id') return aplicarMontoSugerido(next);
            if (name === 'tis_id' && value) return aplicarMontoSugerido({ ...next, tds_id: null, kre_id: null });
            if (name === 'tds_id' && value) return aplicarMontoSugerido({ ...next, tis_id: null, kre_id: null });
            if (name === 'kre_id' && value) return aplicarMontoSugerido({ ...next, tis_id: null, tds_id: null });
            return next;
        });
    };

    const limpiarFormulario = () => {
        setForm(initialForm);
        setModoEdicion(false);
        setDetalleId(null);
        setError('');
        setTipoConcepto('');
    };

    const validarFormulario = () => {
        if (!form.det_referencia || form.det_monto === null || form.det_monto === '' || !form.nom_id) {
            setError('Referencia, monto y nomina son obligatorios');
            return false;
        }
        if (!tipoConcepto) {
            setError('Selecciona si el detalle es ingreso, descuento o KPI');
            return false;
        }
        const conceptosSeleccionados = [form.tis_id, form.tds_id, form.kre_id].filter(Boolean).length;
        if (conceptosSeleccionados !== 1) {
            setError('Selecciona exactamente un concepto: ingreso, descuento o resultado KPI');
            return false;
        }
        if (form.kre_id) {
            const nomina = nominasPorId.get(String(form.nom_id));
            const resultado = resultadosPorId.get(String(form.kre_id));
            if (!nomina || !resultado || String(resultado.EMP_ID ?? '') !== String(nomina.EMP_ID)) {
                setError('El resultado KPI seleccionado no pertenece al empleado de esta nomina');
                return false;
            }
        }
        return true;
    };

    const limpiarDatos = (f: NominaDetalleForm) => ({
        det_referencia: f.det_referencia ? Number(f.det_referencia) : null,
        det_monto: f.det_monto !== null && f.det_monto !== '' ? Number(f.det_monto) : null,
        nom_id: f.nom_id ? Number(f.nom_id) : null,
        tis_id: f.tis_id ? Number(f.tis_id) : null,
        tds_id: f.tds_id ? Number(f.tds_id) : null,
        kre_id: f.kre_id ? Number(f.kre_id) : null
    });

    const guardarDetalle = async () => {
        try {
            setError('');
            setMensaje('');
            if (!validarFormulario()) return;

            const dataLimpia = limpiarDatos(form);
            const detalleAnterior = detalleId !== null
                ? datos.find((detalle) => detalle.DET_ID === detalleId)
                : undefined;

            if (modoEdicion && detalleId !== null) {
                await actualizarDetalleNomina(detalleId, dataLimpia);
                await sincronizarCabeceras([detalleAnterior?.NOM_ID, dataLimpia.nom_id]);
                setMensaje('Registro actualizado correctamente');
            } else {
                await crearDetalleNomina(dataLimpia);
                await sincronizarCabeceras([dataLimpia.nom_id]);
                setMensaje('Registro creado correctamente');
            }

            limpiarFormulario();
            await cargarDatos();
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Error guardando registro'));
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Deseas eliminar este registro de nómina?')) return;
        try {
            setError('');
            setMensaje('');
            const detalleAnterior = datos.find((detalle) => detalle.DET_ID === id);
            await eliminarDetalleNomina(id);
            await sincronizarCabeceras([detalleAnterior?.NOM_ID]);
            setMensaje('Registro eliminado correctamente');
            if (detalleId === id) limpiarFormulario();
            await cargarDatos();
        } catch (err: unknown) {
            setError(getApiErrorMessage(err, 'Error eliminando registro'));
        }
    };

    const handleEditar = (d: NominaDetalle) => {
        setModoEdicion(true);
        setDetalleId(d.DET_ID);
        setMensaje('');
        setError('');
        setForm({
            det_referencia: d.DET_REFERENCIA ?? 0,
            det_monto: d.DET_MONTO ?? 0,
            nom_id: d.NOM_ID ?? 0,
            tis_id: d.TIS_ID ?? null,
            tds_id: d.TDS_ID ?? null,
            kre_id: d.KRE_ID ?? null
        });
        if (d.TIS_ID) setTipoConcepto('INGRESO');
        else if (d.TDS_ID) setTipoConcepto('DESCUENTO');
        else if (d.KRE_ID) setTipoConcepto('KPI');
        else setTipoConcepto('');
    };

    if (cargando) {
        return (
            <Box sx={{ p: 3 }}>
                <Typography variant="h6">Cargando detalles de nómina...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ py: 2 }}>
            {/* Formulario */}
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                    <ReceiptLongIcon color="primary" />
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        Detalle de Nómina
                    </Typography>
                </Box>

                <Typography variant="h6" sx={{ mb: 2 }}>
                    {modoEdicion ? 'Editar detalle' : 'Nuevo detalle'}
                </Typography>

                <Alert severity="info" sx={{ mb: 2 }}>
                    Primero selecciona la nomina. Luego elige si el movimiento es ingreso, descuento o KPI. Los KPI se muestran solo si pertenecen al empleado de la nomina seleccionada.
                </Alert>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Referencia"
                            name="det_referencia"
                            type="text"
                            value={form.det_referencia ?? ''}
                            onChange={handleChange}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Monto (Q)"
                            name="det_monto"
                            type="number"
                            value={form.det_monto ?? ''}
                            onChange={handleChange}
                            slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                            <InputLabel>Nomina</InputLabel>
                            <Select name="nom_id" value={String(form.nom_id ?? '')} label="Nomina" onChange={handleChange}>
                                <MenuItem value="">Seleccione nomina</MenuItem>
                                {nominas.map((nomina) => (
                                    <MenuItem key={nomina.NOM_ID} value={String(nomina.NOM_ID)}>
                                        {obtenerEtiquetaNomina(nomina)} - Liquido {formatearMoneda(nomina.NOM_SALARIO_LIQUIDO)}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                            <InputLabel>Tipo de movimiento</InputLabel>
                            <Select value={tipoConcepto} label="Tipo de movimiento" onChange={handleTipoConceptoChange}>
                                <MenuItem value="">Seleccione tipo</MenuItem>
                                <MenuItem value="INGRESO">Ingreso</MenuItem>
                                <MenuItem value="DESCUENTO">Descuento</MenuItem>
                                <MenuItem value="KPI">Resultado KPI</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {tipoConcepto === 'INGRESO' && (
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel>Ingreso</InputLabel>
                            <Select name="tis_id" value={String(form.tis_id ?? '')} label="Ingreso" onChange={handleChange}>
                                <MenuItem value="">No aplica</MenuItem>
                                {ingresos.map((ingreso) => (
                                    <MenuItem key={ingreso.TIS_ID} value={String(ingreso.TIS_ID)}>
                                        {ingreso.TIS_CODIGO} - {ingreso.TIS_NOMBRE}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    )}

                    {tipoConcepto === 'DESCUENTO' && (
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel>Descuento</InputLabel>
                            <Select name="tds_id" value={String(form.tds_id ?? '')} label="Descuento" onChange={handleChange}>
                                <MenuItem value="">No aplica</MenuItem>
                                {descuentos.map((descuento) => (
                                    <MenuItem key={descuento.TDS_ID} value={String(descuento.TDS_ID)}>
                                        {descuento.TDS_CODIGO} - {descuento.TDS_NOMBRE}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    )}

                    {tipoConcepto === 'KPI' && (
                    <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth>
                            <InputLabel>Resultado KPI</InputLabel>
                            <Select name="kre_id" value={String(form.kre_id ?? '')} label="Resultado KPI" onChange={handleChange}>
                                <MenuItem value="">No aplica</MenuItem>
                                {resultadosKpiDisponibles.map((resultado) => {
                                    const empleado = empleadosPorId.get(String(resultado.EMP_ID));
                                    return (
                                        <MenuItem key={resultado.KRE_ID} value={String(resultado.KRE_ID)}>
                                            KPI #{resultado.KPI_ID} - {obtenerNombreEmpleado(empleado) || `Empleado #${resultado.EMP_ID ?? '-'}`} - {formatearMoneda(resultado.KRE_MONTO_TOTAL)}
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                            {obtenerNominaSeleccionada() && resultadosKpiDisponibles.length === 0 && (
                                <Typography variant="caption" color="text.secondary">
                                    Este empleado no tiene resultados KPI disponibles.
                                </Typography>
                            )}
                        </FormControl>
                    </Grid>
                    )}

                    <Grid size={{ xs: 12 }}>
                        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                            <Button
                                variant="contained"
                                startIcon={<SaveIcon />}
                                onClick={guardarDetalle}
                            >
                                {modoEdicion ? 'Actualizar' : 'Guardar'}
                            </Button>

                            <Button
                                variant="outlined"
                                color="secondary"
                                startIcon={<CleaningServicesIcon />}
                                onClick={limpiarFormulario}
                            >
                                Limpiar
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Tabla */}
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                    Listado de detalles: {datos.length}
                </Typography>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>ID</strong></TableCell>
                                <TableCell><strong>Referencia</strong></TableCell>
                                <TableCell><strong>Monto</strong></TableCell>
                                <TableCell><strong>Nómina</strong></TableCell>
                                <TableCell><strong>Ingreso (TIS)</strong></TableCell>
                                <TableCell><strong>Descuento (TDS)</strong></TableCell>
                                <TableCell><strong>KRE</strong></TableCell>
                                <TableCell><strong>Acciones</strong></TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {datos.length > 0 ? (
                                datos.map((d) => {
                                    const nomina = nominasPorId.get(String(d.NOM_ID));
                                    const ingreso = ingresosPorId.get(String(d.TIS_ID));
                                    const descuento = descuentosPorId.get(String(d.TDS_ID));
                                    const resultado = resultadosPorId.get(String(d.KRE_ID));

                                    return (
                                    <TableRow key={d.DET_ID} hover>
                                        <TableCell>{d.DET_ID}</TableCell>
                                        <TableCell>{d.DET_REFERENCIA}</TableCell>
                                        <TableCell>{formatearMoneda(d.DET_MONTO)}</TableCell>
                                        <TableCell>{obtenerEtiquetaNomina(nomina) || `Nomina #${d.NOM_ID}`}</TableCell>
                                        <TableCell>{ingreso ? `${ingreso.TIS_CODIGO} - ${ingreso.TIS_NOMBRE}` : '—'}</TableCell>
                                        <TableCell>{descuento ? `${descuento.TDS_CODIGO} - ${descuento.TDS_NOMBRE}` : '—'}</TableCell>
                                        <TableCell>{resultado ? formatearMoneda(resultado.KRE_MONTO_TOTAL) : '—'}</TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    startIcon={<EditIcon />}
                                                    onClick={() => handleEditar(d)}
                                                >
                                                    Editar
                                                </Button>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    color="error"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() => handleEliminar(d.DET_ID)}
                                                >
                                                    Eliminar
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        No hay registros de nómina
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

export default NominaDetalleCRUD;
