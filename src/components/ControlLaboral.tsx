import { useEffect, useState } from 'react';
import type { ControlLaboral, ControlLaboralForm } from '../interfaces/controlLaboral';
import {
  obtenerControles,
  crearControl,
  actualizarControl,
  eliminarControl
} from '../services/controlLaboral.service';

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
  Typography,
  Tooltip
} from '@mui/material';

import type { SelectChangeEvent } from '@mui/material/Select';

import SaveIcon from '@mui/icons-material/Save';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

const initialForm: ControlLaboralForm = {
  ctl_fecha_inicio: '',
  ctl_fecha_regreso: '',
  ctl_motivo: '',
  ctl_horas: '',
  ctl_descripcion: '',
  ctl_estado: '',
  ctl_fecha_registro: '',
  emp_id: ''
};

function ControlLaboralPage() {
  const [datos, setDatos] = useState<ControlLaboral[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [ctlId, setCtlId] = useState<number | null>(null);
  const [form, setForm] = useState<ControlLaboralForm>(initialForm);

  const cargarControles = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerControles();
      setDatos(data);
    } catch (err: any) {
      setError('Error cargando controles: ' + err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarControles(); }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name as string]: value }));
  };

  const limpiarFormulario = () => {
    setForm(initialForm);
    setModoEdicion(false);
    setCtlId(null);
    setError('');
  };

  const validarFormulario = () => {
    const { ctl_fecha_inicio, ctl_fecha_regreso, ctl_motivo, ctl_horas, ctl_descripcion, ctl_estado, ctl_fecha_registro, emp_id } = form;
    if (!ctl_fecha_inicio || !ctl_fecha_regreso || !ctl_motivo || !ctl_horas ||
      !ctl_descripcion.trim() || !ctl_estado || !ctl_fecha_registro || !emp_id) {
      setError('Todos los campos son obligatorios');
      return false;
    }
    if (new Date(ctl_fecha_regreso) < new Date(ctl_fecha_inicio)) {
      setError('La fecha de regreso no puede ser anterior a la de inicio');
      return false;
    }
    if (Number(ctl_horas) <= 0) {
      setError('Las horas deben ser un valor positivo');
      return false;
    }
    return true;
  };

  const guardarControl = async () => {
    try {
      setError(''); setMensaje('');
      if (!validarFormulario()) return;

      if (modoEdicion && ctlId !== null) {
        await actualizarControl(ctlId, form);
        setMensaje('Control actualizado correctamente');
      } else {
        await crearControl(form);
        setMensaje('Control creado correctamente');
      }
      limpiarFormulario();
      await cargarControles();
    } catch (err: any) {
      setError('Error guardando control: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEliminar = async (id: number) => {
    if (!window.confirm('¿Deseas eliminar este registro?')) return;
    try {
      setError(''); setMensaje('');
      await eliminarControl(id);
      setMensaje('Registro eliminado correctamente');
      if (ctlId === id) limpiarFormulario();
      await cargarControles();
    } catch (err: any) {
      setError('Error eliminando: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleEditar = (ctl: ControlLaboral) => {
    setModoEdicion(true);
    setCtlId(ctl.CTL_ID);
    setMensaje(''); setError('');
    setForm({
      ctl_fecha_inicio: ctl.CTL_FECHA_INICIO?.slice(0, 10) || '',
      ctl_fecha_regreso: ctl.CTL_FECHA_REGRESO?.slice(0, 10) || '',
      ctl_motivo: ctl.CTL_MOTIVO || '',
      ctl_horas: String(ctl.CTL_HORAS) || '',
      ctl_descripcion: ctl.CTL_DESCRIPCION || '',
      ctl_estado: ctl.CTL_ESTADO || '',
      ctl_fecha_registro: ctl.CTL_FECHA_REGISTRO?.slice(0, 10) || '',
      emp_id: String(ctl.EMP_ID) || ''
    });
  };

  const getStatusChip = (estado: string) => {
    const configs: Record<string, { label: string, color: any }> = {
      'A': { label: 'Aprobado', color: 'success' },
      'P': { label: 'Pendiente', color: 'warning' },
      'R': { label: 'Rechazado', color: 'error' }
    };
    const config = configs[estado] || { label: estado, color: 'default' };
    return <Chip label={config.label} color={config.color} size="small" variant="filled" />;
  };

  if (cargando) return <Box sx={{ p: 5, textAlign: 'center' }}><Typography>Cargando registros...</Typography></Box>;

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AssignmentIndIcon color="primary" fontSize="large" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Control Laboral</Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>{modoEdicion ? 'Editar Registro' : 'Nuevo Registro'}</Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth type="number" label="ID Empleado" name="emp_id" value={form.emp_id} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth type="date" label="F. Inicio" name="ctl_fecha_inicio" slotProps={{ inputLabel: { shrink: true } }} value={form.ctl_fecha_inicio} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth type="date" label="F. Regreso" name="ctl_fecha_regreso" slotProps={{ inputLabel: { shrink: true } }} value={form.ctl_fecha_regreso} onChange={handleChange} />
          </Grid>
          <Grid size={{ xs: 12, md: 3 }}>
            <TextField fullWidth type="date" label="F. Registro" name="ctl_fecha_registro" slotProps={{ inputLabel: { shrink: true } }} value={form.ctl_fecha_registro} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Motivo</InputLabel>
              <Select name="ctl_motivo" value={form.ctl_motivo} label="Motivo" onChange={handleChange}>
                <MenuItem value="VAC">Vacaciones</MenuItem>
                <MenuItem value="PER">Permiso</MenuItem>
                <MenuItem value="ENF">Enfermedad</MenuItem>
                <MenuItem value="SUS">Suspensión</MenuItem>
                <MenuItem value="OTR">Otro</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth type="number" label="Horas" name="ctl_horas" value={form.ctl_horas} onChange={handleChange} placeholder="0.0000" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select name="ctl_estado" value={form.ctl_estado} label="Estado" onChange={handleChange}>
                <MenuItem value="P">Pendiente</MenuItem>
                <MenuItem value="A">Aprobado</MenuItem>
                <MenuItem value="R">Rechazado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField fullWidth multiline rows={2} label="Descripción" name="ctl_descripcion" value={form.ctl_descripcion} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarControl}>
                {modoEdicion ? 'Actualizar' : 'Guardar'}
              </Button>
              <Button variant="outlined" color="secondary" startIcon={<CleaningServicesIcon />} onClick={limpiarFormulario}>
                Limpiar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Listado de Registros: {datos.length}</Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Emp.</strong></TableCell>
                <TableCell><strong>Fechas</strong></TableCell>
                <TableCell><strong>Motivo</strong></TableCell>
                <TableCell><strong>Horas</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell align="center"><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? datos.map(ctl => (
                <TableRow key={ctl.CTL_ID} hover>
                  <TableCell>{ctl.CTL_ID}</TableCell>
                  <TableCell>#{ctl.EMP_ID}</TableCell>
                  <TableCell>
                    <Typography variant="caption" sx={{ display: 'block' }}>I: {ctl.CTL_FECHA_INICIO?.slice(0, 10)}</Typography>
                    <Typography variant="caption" sx={{ display: 'block' }}>R: {ctl.CTL_FECHA_REGRESO?.slice(0, 10)}</Typography>
                  </TableCell>
                  <TableCell>{ctl.CTL_MOTIVO}</TableCell>
                  <TableCell>{ctl.CTL_HORAS}</TableCell>
                  <TableCell>
                    <Tooltip title={ctl.CTL_DESCRIPCION}>
                      <Typography variant="body2" sx={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ctl.CTL_DESCRIPCION}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>{getStatusChip(ctl.CTL_ESTADO)}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Button size="small" variant="outlined" onClick={() => handleEditar(ctl)}><EditIcon fontSize="small" /></Button>
                      <Button size="small" variant="contained" color="error" onClick={() => handleEliminar(ctl.CTL_ID)}><DeleteIcon fontSize="small" /></Button>
                    </Box>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={8} align="center">No hay registros</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar open={!!mensaje} autoHideDuration={3000} onClose={() => setMensaje('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="success" variant="filled">{mensaje}</Alert>
      </Snackbar>

      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError('')} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity="error" variant="filled">{error}</Alert>
      </Snackbar>
    </Box>
  );
}

export default ControlLaboralPage;