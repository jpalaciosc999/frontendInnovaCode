import { useEffect, useMemo, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import {
  Alert,
  Box,
  Button,
  Chip,
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
import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import SendIcon from '@mui/icons-material/Send';
import CalculateIcon from '@mui/icons-material/Calculate';

import type { Nomina, NominaForm } from '../interfaces/nomina';
import type { NominaDetalle } from '../interfaces/nomina-detalle';
import type { Empleado } from '../interfaces/empleados';
import type { Periodo } from '../interfaces/periodo';
import type { Liquidacion } from '../interfaces/liquidacion';
import {
  obtenerNominas,
  crearNomina,
  actualizarNomina,
  eliminarNomina
} from '../services/nomina.service';
import { obtenerDetallesNomina } from '../services/nomina-detalle.service';
import { obtenerEmpleados } from '../services/empleados.service';
import { obtenerPeriodos } from '../services/periodo.service';
import { obtenerLiquidaciones } from '../services/liquidacion.service';
import { getApiErrorMessage } from '../api/errors';
import { formatearFecha, formatearMoneda, obtenerNombreEmpleado } from '../utils/relations';

type TotalesNomina = {
  ingresos: number;
  descuentos: number;
  liquido: number;
  cantidad: number;
};

const initialForm: NominaForm = {
  nom_total_ingresos: 0,
  nom_total_descuento: 0,
  nom_salario_liquido: 0,
  nom_fecha_generacion: '',
  per_id: '',
  empleado_id: '',
  liq_id: null,
  nom_estado: 'B'
};

const totalesVacios: TotalesNomina = {
  ingresos: 0,
  descuentos: 0,
  liquido: 0,
  cantidad: 0,
};

const toInputDate = (value: string | null | undefined) => {
  if (!value) return '';

  const raw = String(value);
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const oracleMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (oracleMatch) return `${oracleMatch[3]}-${oracleMatch[2]}-${oracleMatch[1]}`;

  return raw.slice(0, 10);
};

function NominaCRUD() {
  const [datos, setDatos] = useState<Nomina[]>([]);
  const [detalles, setDetalles] = useState<NominaDetalle[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<NominaForm>(initialForm);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const [nominasData, detallesData, empleadosData, periodosData, liquidacionesData] = await Promise.all([
        obtenerNominas(),
        obtenerDetallesNomina(),
        obtenerEmpleados(),
        obtenerPeriodos(),
        obtenerLiquidaciones(),
      ]);
      setDatos(nominasData);
      setDetalles(detallesData);
      setEmpleados(empleadosData);
      setPeriodos(periodosData);
      setLiquidaciones(liquidacionesData);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error cargando datos de nomina'));
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

  const periodosPorId = useMemo(
    () => new Map(periodos.map((periodo) => [String(periodo.PER_ID), periodo])),
    [periodos]
  );

  const liquidacionesPorId = useMemo(
    () => new Map(liquidaciones.map((liquidacion) => [String(liquidacion.LIQ_ID), liquidacion])),
    [liquidaciones]
  );

  const liquidacionesDisponibles = useMemo(() => {
    if (!form.empleado_id) return liquidaciones;
    return liquidaciones.filter((liquidacion) => String(liquidacion.EMP_ID) === String(form.empleado_id));
  }, [form.empleado_id, liquidaciones]);

  const totalesPorNomina = useMemo(() => {
    const totales = new Map<string, TotalesNomina>();

    detalles.forEach((detalle) => {
      const key = String(detalle.NOM_ID);
      const actual = totales.get(key) ?? { ...totalesVacios };
      const monto = Number(detalle.DET_MONTO || 0);

      if (detalle.TDS_ID) {
        actual.descuentos += monto;
      } else {
        actual.ingresos += monto;
      }

      actual.liquido = actual.ingresos - actual.descuentos;
      actual.cantidad += 1;
      totales.set(key, actual);
    });

    return totales;
  }, [detalles]);

  const obtenerTotalesCalculados = (nominaId: number) =>
    totalesPorNomina.get(String(nominaId)) ?? totalesVacios;

  const obtenerEtiquetaPeriodo = (periodo?: Periodo) =>
    periodo
      ? `${formatearFecha(periodo.PER_FECHA_INICIO)} al ${formatearFecha(periodo.PER_FECHA_FIN)}`
      : '';

  const obtenerEtiquetaLiquidacion = (liquidacion?: Liquidacion) => {
    if (!liquidacion) return '';
    const empleado = empleadosPorId.get(String(liquidacion.EMP_ID));
    const nombreEmpleado = obtenerNombreEmpleado(empleado) || `Empleado #${liquidacion.EMP_ID}`;
    return `${nombreEmpleado} - ${formatearMoneda(liquidacion.LIQ_LIQUIDACION)}`;
  };

  const crearPayloadNomina = (
    datosForm: NominaForm,
    totales: TotalesNomina = totalesVacios,
    estado = datosForm.nom_estado
  ): NominaForm => ({
    nom_total_ingresos: totales.ingresos.toFixed(2),
    nom_total_descuento: totales.descuentos.toFixed(2),
    nom_salario_liquido: totales.liquido.toFixed(2),
    nom_fecha_generacion: datosForm.nom_fecha_generacion,
    per_id: datosForm.per_id,
    empleado_id: datosForm.empleado_id,
    liq_id: datosForm.liq_id || null,
    nom_estado: estado,
  });

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    if (name === 'empleado_id') {
      setForm((prev) => ({ ...prev, empleado_id: value, liq_id: null }));
      return;
    }

    setForm((prev) => ({ ...prev, [name as string]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setId(null);
    setError('');
  };

  const validar = () => {
    if (
      !form.nom_fecha_generacion.trim() ||
      !String(form.per_id).trim() ||
      !String(form.empleado_id).trim() ||
      !form.nom_estado.trim()
    ) {
      setError('Fecha, periodo, empleado y estado son obligatorios');
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
        const totales = obtenerTotalesCalculados(id);
        await actualizarNomina(id, crearPayloadNomina(form, totales));
        setMensaje('Cabecera de nomina actualizada correctamente');
      } else {
        await crearNomina(crearPayloadNomina(form));
        setMensaje('Cabecera creada. Ahora agrega ingresos y descuentos en Detalle de Nomina.');
      }

      limpiarFormulario();
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error guardando nomina'));
    }
  };

  const handleEditar = (n: Nomina) => {
    setModoEdicion(true);
    setId(n.NOM_ID);
    setMensaje('');
    setError('');
    setForm({
      nom_total_ingresos: n.NOM_TOTAL_INGRESOS,
      nom_total_descuento: n.NOM_TOTAL_DESCUENTO,
      nom_salario_liquido: n.NOM_SALARIO_LIQUIDO,
      nom_fecha_generacion: toInputDate(n.NOM_FECHA_GENERACION),
      per_id: String(n.PER_ID),
      empleado_id: n.EMP_ID ? String(n.EMP_ID) : '',
      liq_id: n.LIQ_ID ? String(n.LIQ_ID) : null,
      nom_estado: n.NOM_ESTADO
    });
  };

  const handleEliminar = async (idEliminar: number) => {
    if (!window.confirm('Deseas eliminar esta nomina?')) return;

    try {
      setError('');
      setMensaje('');
      await eliminarNomina(idEliminar);
      setMensaje('Nomina eliminada correctamente');

      if (id === idEliminar) limpiarFormulario();

      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error eliminando nomina'));
    }
  };

  const recalcularNomina = async (n: Nomina, estado = n.NOM_ESTADO) => {
    const totales = obtenerTotalesCalculados(n.NOM_ID);

    if (totales.cantidad === 0) {
      setError('Esta nomina no tiene detalle. Primero agrega ingresos y descuentos en Detalle de Nomina.');
      return false;
    }

    await actualizarNomina(n.NOM_ID, crearPayloadNomina({
      nom_total_ingresos: n.NOM_TOTAL_INGRESOS,
      nom_total_descuento: n.NOM_TOTAL_DESCUENTO,
      nom_salario_liquido: n.NOM_SALARIO_LIQUIDO,
      nom_fecha_generacion: toInputDate(n.NOM_FECHA_GENERACION),
      per_id: n.PER_ID,
      empleado_id: n.EMP_ID,
      liq_id: n.LIQ_ID ?? null,
      nom_estado: n.NOM_ESTADO,
    }, totales, estado));

    return true;
  };

  const handleRecalcular = async (n: Nomina) => {
    try {
      setError('');
      setMensaje('');
      const ok = await recalcularNomina(n);
      if (!ok) return;
      setMensaje('Totales recalculados desde el detalle de nomina');
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error recalculando totales de nomina'));
    }
  };

  const enviarAGerente = async (n: Nomina) => {
    try {
      setError('');
      setMensaje('');
      const ok = await recalcularNomina(n, 'P');
      if (!ok) return;
      setMensaje('Nomina recalculada y enviada a aprobacion gerencial');
      await cargarDatos();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Error enviando nomina a gerente'));
    }
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'A' || estado === 'Activo')
      return <Chip label="Aprobada" color="success" size="small" />;
    if (estado === 'I' || estado === 'Inactivo')
      return <Chip label="Rechazada" color="error" size="small" />;
    if (estado === 'P' || estado === 'Pendiente')
      return <Chip label="Pendiente" color="warning" size="small" />;
    if (estado === 'B' || estado === 'Borrador')
      return <Chip label="Borrador" color="default" size="small" />;
    return <Chip label={estado || 'Sin estado'} size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando nominas...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <RequestQuoteIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Gestion de Nomina
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar cabecera de nomina' : 'Nueva cabecera de nomina'}
        </Typography>

        <Alert severity="info" sx={{ mb: 2 }}>
          Esta vista solo registra la cabecera: empleado, periodo y estado. La liquidacion es opcional y solo se usa cuando corresponde a una salida laboral. Los ingresos, descuentos y KPI se agregan en Detalle de Nomina.
        </Alert>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Fecha de generacion"
              name="nom_fecha_generacion"
              type="date"
              value={form.nom_fecha_generacion}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Periodo</InputLabel>
              <Select name="per_id" value={String(form.per_id)} label="Periodo" onChange={handleChange}>
                <MenuItem value="">Seleccione periodo</MenuItem>
                {periodos.map((periodo) => (
                  <MenuItem key={periodo.PER_ID} value={String(periodo.PER_ID)}>
                    {obtenerEtiquetaPeriodo(periodo)} - Pago {formatearFecha(periodo.PER_FECHA_PAGO)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Empleado</InputLabel>
              <Select name="empleado_id" value={String(form.empleado_id)} label="Empleado" onChange={handleChange}>
                <MenuItem value="">Seleccione empleado</MenuItem>
                {empleados.map((empleado) => (
                  <MenuItem key={empleado.EMP_ID} value={String(empleado.EMP_ID)}>
                    {obtenerNombreEmpleado(empleado)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Liquidacion opcional</InputLabel>
              <Select name="liq_id" value={String(form.liq_id ?? '')} label="Liquidacion opcional" onChange={handleChange}>
                <MenuItem value="">No aplica</MenuItem>
                {liquidacionesDisponibles.map((liquidacion) => (
                  <MenuItem key={liquidacion.LIQ_ID} value={String(liquidacion.LIQ_ID)}>
                    {obtenerEtiquetaLiquidacion(liquidacion)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select
                name="nom_estado"
                value={form.nom_estado}
                label="Estado"
                onChange={handleChange}
              >
                <MenuItem value="">Seleccione estado</MenuItem>
                <MenuItem value="B">Borrador</MenuItem>
                <MenuItem value="P">Pendiente</MenuItem>
                <MenuItem value="A">Aprobada</MenuItem>
                <MenuItem value="I">Rechazada</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={guardar}
              >
                {modoEdicion ? 'Actualizar cabecera' : 'Guardar cabecera'}
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

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Listado de nominas: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Periodo</strong></TableCell>
                <TableCell><strong>Liquidacion</strong></TableCell>
                <TableCell align="right"><strong>Ingresos</strong></TableCell>
                <TableCell align="right"><strong>Descuentos</strong></TableCell>
                <TableCell align="right"><strong>Liquido</strong></TableCell>
                <TableCell align="center"><strong>Detalle</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datos.length > 0 ? (
                datos.map((n) => {
                  const empleado = empleadosPorId.get(String(n.EMP_ID));
                  const periodo = periodosPorId.get(String(n.PER_ID));
                  const liquidacion = liquidacionesPorId.get(String(n.LIQ_ID));
                  const totales = obtenerTotalesCalculados(n.NOM_ID);
                  const mostrarTotales = totales.cantidad > 0
                    ? totales
                    : {
                      ingresos: Number(n.NOM_TOTAL_INGRESOS || 0),
                      descuentos: Number(n.NOM_TOTAL_DESCUENTO || 0),
                      liquido: Number(n.NOM_SALARIO_LIQUIDO || 0),
                      cantidad: 0,
                    };

                  return (
                    <TableRow key={n.NOM_ID} hover>
                      <TableCell>{n.NOM_ID}</TableCell>
                      <TableCell>
                        <Typography variant="body2">{obtenerNombreEmpleado(empleado) || 'Sin empleado'}</Typography>
                        <Typography variant="caption" color="text.secondary">ID: {n.EMP_ID ?? '-'}</Typography>
                      </TableCell>
                      <TableCell>{obtenerEtiquetaPeriodo(periodo) || `Periodo #${n.PER_ID}`}</TableCell>
                      <TableCell>{liquidacion ? formatearMoneda(liquidacion.LIQ_LIQUIDACION) : 'No aplica'}</TableCell>
                      <TableCell align="right">{formatearMoneda(mostrarTotales.ingresos)}</TableCell>
                      <TableCell align="right">{formatearMoneda(mostrarTotales.descuentos)}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{formatearMoneda(mostrarTotales.liquido)}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={`${totales.cantidad} conceptos`}
                          color={totales.cantidad > 0 ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatearFecha(n.NOM_FECHA_GENERACION) || '-'}</TableCell>
                      <TableCell>{obtenerChipEstado(n.NOM_ESTADO)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {n.NOM_ESTADO !== 'P' && n.NOM_ESTADO !== 'A' && (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<CalculateIcon />}
                                onClick={() => handleRecalcular(n)}
                              >
                                Recalcular
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="warning"
                                startIcon={<SendIcon />}
                                onClick={() => enviarAGerente(n)}
                              >
                                Enviar
                              </Button>
                            </>
                          )}
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => handleEditar(n)}
                          >
                            Editar
                          </Button>

                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleEliminar(n.NOM_ID)}
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
                  <TableCell colSpan={11} align="center">
                    No hay nominas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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

export default NominaCRUD;
