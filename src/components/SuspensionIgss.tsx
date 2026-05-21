import { useEffect, useState } from 'react';
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

import type { SelectChangeEvent } from '@mui/material/Select';
import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';

import { obtenerEmpleados } from '../services/empleados.service';
import type { Empleado } from '../interfaces/empleados';
import { obtenerPuestos } from '../services/puestos.service';
import type { Puesto } from '../interfaces/puestos';
import type { SuspensionIgss, SuspensionIgssForm } from '../interfaces/suspensionIgss';
import {
  actualizarSuspensionIgss,
  crearSuspensionIgss,
  eliminarSuspensionIgss,
  obtenerSuspensionesIgss
} from '../services/suspensionIgss.service';
import { useUnsavedFormGuard } from '../hooks/useUnsavedFormGuard';

// Regla IGSS: días 1-3 empleador paga 100%, días 4+ IGSS paga 66.67%
const calcularImpacto = (salarioDiario: number, dias: number) => {
  const dias_empleador = Math.min(dias, 3);
  const dias_igss = Math.max(0, dias - 3);
  const pago_empleador = salarioDiario * dias_empleador;
  const pago_igss = salarioDiario * dias_igss * 0.6667;
  const descuento_salario = salarioDiario * dias - pago_empleador;
  const detalle = dias <= 3
    ? `Empleador cubre los ${dias} días al 100%`
    : `Empleador: días 1-3 (Q${pago_empleador.toFixed(2)}) | IGSS: días 4-${dias} al 66.67% (Q${pago_igss.toFixed(2)})`;
  return { dias_empleador, dias_igss, pago_empleador, pago_igss, descuento_salario, detalle };
};

const initialForm: SuspensionIgssForm = {
  emp_id: '', sus_no_certificado: '', sus_fecha_inicio: '',
  sus_fecha_fin: '', sus_salario_diario: '',
  sus_tipo: 'ENFERMEDAD', sus_estado: 'A', sus_observacion: ''
};

function SuspensionIGSS() {
  const [datos, setDatos] = useState<SuspensionIgss[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<SuspensionIgssForm>(initialForm);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerSuspensionesIgss();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando suspensiones: ' + (err.response?.data?.error || err.message));
    } finally {
      setCargando(false);
    }
  };

  const cargarRelaciones = async () => {
    try {
      const [empleadosData, puestosData] = await Promise.all([obtenerEmpleados(), obtenerPuestos()]);
      setEmpleados(empleadosData.filter((e: Empleado) => e.EMP_ESTADO === 'A'));
      setPuestos(puestosData);
    } catch (err: any) {
      setError('Error cargando empleados o puestos: ' + (err.response?.data?.error || err.message));
    }
  };

  useEffect(() => {
    cargarDatos();
    cargarRelaciones();
  }, []);

  // Días calculados automáticamente
  const diasSuspension = (() => {
    if (!form.sus_fecha_inicio || !form.sus_fecha_fin) return 0;
    const diff = Math.ceil(
      (new Date(form.sus_fecha_fin).getTime() - new Date(form.sus_fecha_inicio).getTime())
      / (1000 * 60 * 60 * 24)
    ) + 1;
    return Math.max(0, diff);
  })();

  const impacto = diasSuspension > 0 && form.sus_salario_diario
    ? calcularImpacto(Number(form.sus_salario_diario), diasSuspension)
    : null;

  const obtenerSalarioDiario = (empId: string) => {
    const empleado = empleados.find((e) => String(e.EMP_ID) === String(empId));
    const puesto = puestos.find((p) => String(p.PUE_ID) === String(empleado?.PUE_ID));
    const sueldoMensual = Number(empleado?.EMP_SUELDO ?? puesto?.PUE_SALARIO_BASE ?? 0);

    if (!sueldoMensual || sueldoMensual <= 0) return '';

    return (sueldoMensual / 30).toFixed(2);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === 'emp_id') {
        return {
          ...prev,
          emp_id: value,
          sus_salario_diario: obtenerSalarioDiario(value)
        };
      }

      return { ...prev, [name as string]: value };
    });
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setId(null);
    setError('');
  };

  const validar = () => {
    if (!form.emp_id || !form.sus_no_certificado.trim() ||
      !form.sus_fecha_inicio || !form.sus_fecha_fin ||
      !String(form.sus_salario_diario).trim()) {
      setError('Todos los campos marcados son obligatorios');
      return false;
    }
    if (new Date(form.sus_fecha_fin) < new Date(form.sus_fecha_inicio)) {
      setError('La fecha fin no puede ser anterior a la fecha inicio');
      return false;
    }
    return true;
  };

  const guardar = async () => {
    try {
      setError('');
      setMensaje('');
      if (!validar()) return false;

      const payload: SuspensionIgssForm = {
        ...form,
        emp_id: Number(form.emp_id),
        sus_dias: diasSuspension,
        sus_salario_diario: Number(form.sus_salario_diario)
      };

      if (modoEdicion && id !== null) {
        await actualizarSuspensionIgss(id, payload);
        setMensaje('Suspensión actualizada correctamente');
      } else {
        await crearSuspensionIgss(payload);
        setMensaje('Suspensión registrada correctamente');
      }

      limpiarFormulario();
      await cargarDatos();
      return true;
    } catch (err: any) {
      setError('Error al guardar: ' + (err.response?.data?.error || err.message));
      return false;
    }
  };

  useUnsavedFormGuard(form, initialForm, guardar);

  const handleEliminar = async (idEliminar: number) => {
    if (!window.confirm('¿Deseas eliminar esta suspensión?')) return;
    try {
      setError('');
      setMensaje('');
      await eliminarSuspensionIgss(idEliminar);
      setMensaje('Suspensión eliminada');
      if (id === idEliminar) limpiarFormulario();
      await cargarDatos();
    } catch (err: any) {
      setError('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (s: SuspensionIgss) => {
    setModoEdicion(true);
    setId(s.SUS_ID);
    setMensaje('');
    setError('');
    setForm({
      emp_id: String(s.EMP_ID),
      sus_no_certificado: s.SUS_NO_CERTIFICADO,
      sus_fecha_inicio: String(s.SUS_FECHA_INICIO).split('T')[0],
      sus_fecha_fin: String(s.SUS_FECHA_FIN).split('T')[0],
      sus_salario_diario: String(s.SUS_SALARIO_DIARIO),
      sus_tipo: s.SUS_TIPO,
      sus_estado: s.SUS_ESTADO,
      sus_observacion: s.SUS_OBSERVACION
    });
  };

  const chipTipo = (tipo: string) => {
    const map: Record<string, 'warning' | 'error' | 'info'> = {
      ENFERMEDAD: 'warning', MATERNIDAD: 'info', ACCIDENTE: 'error'
    };
    return <Chip label={tipo} color={map[tipo] ?? 'default'} size="small" />;
  };

  const fmt = (v: number) =>
    `Q ${v.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando suspensiones...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <MedicalServicesIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Suspensiones IGSS</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <strong>Regla IGSS:</strong> Días 1-3 → empleador paga 100% &nbsp;|&nbsp;
          Días 4 en adelante → IGSS paga 66.67%
        </Alert>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar suspensión' : 'Nueva suspensión'}
        </Typography>

        <Grid container spacing={2}>
          {/* Select de empleados desde la API */}
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Empleado</InputLabel>
              <Select name="emp_id" value={String(form.emp_id)}
                label="Empleado" onChange={handleChange}>
                <MenuItem value="">Seleccione empleado</MenuItem>
                {empleados.map((e) => (
                  <MenuItem key={e.EMP_ID} value={String(e.EMP_ID)}>
                    {e.EMP_NOMBRE} {e.EMP_APELLIDO}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="No. Certificado IGSS" name="sus_no_certificado"
              value={form.sus_no_certificado} onChange={handleChange}
              placeholder="IGSS-2024-001" />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Tipo de suspensión</InputLabel>
              <Select name="sus_tipo" value={form.sus_tipo}
                label="Tipo de suspensión" onChange={handleChange}>
                <MenuItem value="ENFERMEDAD">Enfermedad</MenuItem>
                <MenuItem value="MATERNIDAD">Maternidad</MenuItem>
                <MenuItem value="ACCIDENTE">Accidente laboral</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Fecha inicio" name="sus_fecha_inicio"
              type="date" value={form.sus_fecha_inicio} onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Fecha fin" name="sus_fecha_fin"
              type="date" value={form.sus_fecha_fin} onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Días suspendido (calculado)"
              value={diasSuspension > 0 ? `${diasSuspension} días` : ''}
              slotProps={{ input: { readOnly: true } }}
              sx={{ backgroundColor: '#f5f5f5' }} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Salario diario (Q)" name="sus_salario_diario"
              type="number" value={form.sus_salario_diario}
              placeholder="Salario mensual ÷ 30"
              helperText="Se calcula automáticamente desde el sueldo del empleado"
              slotProps={{ input: { readOnly: true } }}
              sx={{ backgroundColor: '#f5f5f5' }} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select name="sus_estado" value={form.sus_estado}
                label="Estado" onChange={handleChange}>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="I">Inactivo</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Observación" name="sus_observacion"
              value={form.sus_observacion} onChange={handleChange} />
          </Grid>

          {/* Preview impacto en tiempo real */}
          {impacto && (
            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" sx={{ p: 2, borderColor: '#1976d2' }}>
                <Typography variant="subtitle2" color="primary" sx={{ mb: 1 }}>
                  Vista previa del impacto salarial
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Días empleador</Typography>
                    <Typography variant="h6">{impacto.dias_empleador} días</Typography>
                    <Typography variant="caption" color="success.main">
                      Paga: {fmt(impacto.pago_empleador)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <Typography variant="caption" color="text.secondary">Días IGSS</Typography>
                    <Typography variant="h6">{impacto.dias_igss} días</Typography>
                    <Typography variant="caption" color="info.main">
                      IGSS paga: {fmt(impacto.pago_igss)}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="caption" color="text.secondary">Detalle</Typography>
                    <Typography variant="body2">{impacto.detalle}</Typography>
                    <Typography variant="caption" color="error.main">
                      Descuento nómina: -{fmt(impacto.descuento_salario)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={guardar}>
                {modoEdicion ? 'Actualizar' : 'Guardar'}
              </Button>
              <Button variant="outlined" color="secondary"
                startIcon={<CleaningServicesIcon />} onClick={limpiarFormulario}>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabla */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Suspensiones registradas: {datos.length}
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>Certificado</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Tipo</strong></TableCell>
                <TableCell><strong>Fecha Inicio</strong></TableCell>
                <TableCell><strong>Fecha Fin</strong></TableCell>
                <TableCell align="right"><strong>Días</strong></TableCell>
                <TableCell align="right"><strong>Salario Diario</strong></TableCell>
                <TableCell align="right"><strong>Descuento Nómina</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? datos.map((s) => {
                const imp = calcularImpacto(s.SUS_SALARIO_DIARIO, s.SUS_DIAS);
                return (
                  <TableRow key={s.SUS_ID} hover>
                    <TableCell>{s.SUS_NO_CERTIFICADO}</TableCell>
                    <TableCell>{s.EMP_NOMBRE}</TableCell>
                    <TableCell>{chipTipo(s.SUS_TIPO)}</TableCell>
                    <TableCell>{new Date(s.SUS_FECHA_INICIO).toLocaleDateString('es-GT')}</TableCell>
                    <TableCell>{new Date(s.SUS_FECHA_FIN).toLocaleDateString('es-GT')}</TableCell>
                    <TableCell align="right">{s.SUS_DIAS}</TableCell>
                    <TableCell align="right">{fmt(s.SUS_SALARIO_DIARIO)}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      -{fmt(imp.descuento_salario)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="outlined" startIcon={<EditIcon />}
                          onClick={() => handleEditar(s)}>Editar</Button>
                        <Button size="small" variant="contained" color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(s.SUS_ID)}>Eliminar</Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">No hay suspensiones registradas</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" onClose={() => setMensaje('')} sx={{ width: '100%' }}>
          {mensaje}
        </Alert>
      </Snackbar>
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" onClose={() => setError('')} sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default SuspensionIGSS;
