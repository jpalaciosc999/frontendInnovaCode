import { useEffect, useState } from 'react';
import type { NominaDetalle, NominaDetalleForm } from '../interfaces/nomina-detalle';
import {
    obtenerDetallesNomina,
    crearDetalleNomina,
    actualizarDetalleNomina,
    eliminarDetalleNomina
} from '../services/nomina-detalle.service.ts';

import {
    Alert,
    Box,
    Button,
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
    Typography
} from '@mui/material';

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const initialForm: NominaDetalleForm = {
    det_referencia: 0,
    det_monto: 0,
    nom_id: 0,
    tis_id: 0,
    tds_id: 0,
    kre_id: 0
};

function NominaDetalleCRUD() {
    const [datos, setDatos] = useState<NominaDetalle[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [detalleId, setDetalleId] = useState<number | null>(null);
    const [form, setForm] = useState<NominaDetalleForm>(initialForm);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            setError('');
            const data = await obtenerDetallesNomina();
            setDatos(data);
        } catch (err: any) {
            setError('Error cargando detalles de nómina: ' + err.message);
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
        setDetalleId(null);
        setError('');
    };

    const validarFormulario = () => {
        if (!form.det_referencia || !form.det_monto || !form.nom_id) {
            setError('Referencia, Monto y Nómina ID son obligatorios');
            return false;
        }
        return true;
    };

    const limpiarDatos = (f: NominaDetalleForm) => ({
        det_referencia: f.det_referencia ? Number(f.det_referencia) : null,
        det_monto: f.det_monto ? Number(f.det_monto) : null,
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

            if (modoEdicion && detalleId !== null) {
                await actualizarDetalleNomina(detalleId, dataLimpia);
                setMensaje('Registro actualizado correctamente');
            } else {
                await crearDetalleNomina(dataLimpia);
                setMensaje('Registro creado correctamente');
            }

            limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            setError('Error guardando registro: ' + (err.response?.data?.error || err.message));
        }
    };

    const handleEliminar = async (id: number) => {
        if (!window.confirm('¿Deseas eliminar este registro de nómina?')) return;
        try {
            setError('');
            setMensaje('');
            await eliminarDetalleNomina(id);
            setMensaje('Registro eliminado correctamente');
            if (detalleId === id) limpiarFormulario();
            await cargarDatos();
        } catch (err: any) {
            setError('Error eliminando registro: ' + (err.response?.data?.error || err.message));
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
            tis_id: d.TIS_ID ?? 0,
            tds_id: d.TDS_ID ?? 0,
            kre_id: d.KRE_ID ?? 0
        });
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

                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Referencia"
                            name="det_referencia"
                            type="text"
                            value={form.det_referencia}
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
                            value={form.det_monto}
                            onChange={handleChange}
                            slotProps={{ htmlInput: { step: 0.01, min: 0 } }}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="Nómina ID"
                            name="nom_id"
                            type="number"
                            value={form.nom_id}
                            onChange={handleChange}
                            required
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="TIS ID (Ingreso)"
                            name="tis_id"
                            type="number"
                            value={form.tis_id}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="TDS ID (Descuento)"
                            name="tds_id"
                            type="number"
                            value={form.tds_id}
                            onChange={handleChange}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                            fullWidth
                            label="KRE ID (Resultado KPI)"
                            name="kre_id"
                            type="number"
                            value={form.kre_id}
                            onChange={handleChange}
                        />
                    </Grid>

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
                                datos.map((d) => (
                                    <TableRow key={d.DET_ID} hover>
                                        <TableCell>{d.DET_ID}</TableCell>
                                        <TableCell>{d.DET_REFERENCIA}</TableCell>
                                        <TableCell>Q{Number(d.DET_MONTO).toLocaleString('es-GT')}</TableCell>
                                        <TableCell>{d.NOM_ID}</TableCell>
                                        <TableCell>{d.TIS_ID || '—'}</TableCell>
                                        <TableCell>{d.TDS_ID || '—'}</TableCell>
                                        <TableCell>{d.KRE_ID || '—'}</TableCell>
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
                                ))
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