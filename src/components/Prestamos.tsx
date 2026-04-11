import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
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
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

// ─── Interfaces locales ───────────────────────────────────────────────────────
interface Prestamo {
  PRE_ID: number;
  EMP_ID: number;
  PRE_MONTO_TOTAL: number;
  PRE_CUOTA_MENSUAL: number;
  PRE_TOTAL_CUOTAS: number;
  PRE_CUOTAS_PAGADAS: number;
  PRE_SALDO_PENDIENTE: number;
  PRE_FECHA_INICIO: string;
  PRE_ESTADO: string; // 'A' = Activo, 'F' = Finalizado, 'S' = Suspendido
  PRE_DESCRIPCION: string;
}

interface PrestamoForm {
  emp_id: string;
  pre_monto_total: string;
  pre_total_cuotas: string;
  pre_fecha_inicio: string;
  pre_estado: string;
  pre_descripcion: string;
}

const initialForm: PrestamoForm = {
  emp_id: '',
  pre_monto_total: '',
  pre_total_cuotas: '',
  pre_fecha_inicio: '',
  pre_estado: 'A',
  pre_descripcion: ''
};

// ─── Datos de ejemplo — reemplazar con tu API ─────────────────────────────────
const datosEjemplo: Prestamo[] = [
  {
    PRE_ID: 1, EMP_ID: 1, PRE_MONTO_TOTAL: 12000, PRE_CUOTA_MENSUAL: 1000,
    PRE_TOTAL_CUOTAS: 12, PRE_CUOTAS_PAGADAS: 4, PRE_SALDO_PENDIENTE: 8000,
    PRE_FECHA_INICIO: '2024-01-01', PRE_ESTADO: 'A', PRE_DESCRIPCION: 'Préstamo personal'
  },
  {
    PRE_ID: 2, EMP_ID: 2, PRE_MONTO_TOTAL: 6000, PRE_CUOTA_MENSUAL: 500,
    PRE_TOTAL_CUOTAS: 12, PRE_CUOTAS_PAGADAS: 12, PRE_SALDO_PENDIENTE: 0,
    PRE_FECHA_INICIO: '2023-06-01', PRE_ESTADO: 'F', PRE_DESCRIPCION: 'Préstamo emergencia'
  }
];

function PrestamoCRUD() {
  const [datos, setDatos] = useState<Prestamo[]>(datosEjemplo);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [form, setForm] = useState<PrestamoForm>(initialForm);

  // Cálculo automático de cuota mensual
  const cuotaMensualCalculada =
    form.pre_monto_total && form.pre_total_cuotas
      ? (Number(form.pre_monto_total) / Number(form.pre_total_cuotas))
      : 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
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
      !String(form.emp_id).trim() ||
      !form.pre_monto_total.trim() ||
      !form.pre_total_cuotas.trim() ||
      !form.pre_fecha_inicio.trim()
    ) {
      setError('Empleado, monto, cuotas y fecha son obligatorios');
      return false;
    }
    if (Number(form.pre_total_cuotas) <= 0) {
      setError('El número de cuotas debe ser mayor a 0');
      return false;
    }
    return true;
  };

  const guardar = () => {
    setError('');
    setMensaje('');
    if (!validar()) return;

    const monto = Number(form.pre_monto_total);
    const cuotas = Number(form.pre_total_cuotas);
    const cuota = monto / cuotas;

    if (modoEdicion && id !== null) {
      setDatos((prev) => prev.map((p) =>
        p.PRE_ID === id ? {
          ...p,
          EMP_ID: Number(form.emp_id),
          PRE_MONTO_TOTAL: monto,
          PRE_CUOTA_MENSUAL: cuota,
          PRE_TOTAL_CUOTAS: cuotas,
          PRE_SALDO_PENDIENTE: monto - (p.PRE_CUOTAS_PAGADAS * cuota),
          PRE_FECHA_INICIO: form.pre_fecha_inicio,
          PRE_ESTADO: form.pre_estado,
          PRE_DESCRIPCION: form.pre_descripcion
        } : p
      ));
      setMensaje('Préstamo actualizado correctamente');
    } else {
      const nuevo: Prestamo = {
        PRE_ID: datos.length + 1,
        EMP_ID: Number(form.emp_id),
        PRE_MONTO_TOTAL: monto,
        PRE_CUOTA_MENSUAL: cuota,
        PRE_TOTAL_CUOTAS: cuotas,
        PRE_CUOTAS_PAGADAS: 0,
        PRE_SALDO_PENDIENTE: monto,
        PRE_FECHA_INICIO: form.pre_fecha_inicio,
        PRE_ESTADO: form.pre_estado,
        PRE_DESCRIPCION: form.pre_descripcion
      };
      setDatos((prev) => [...prev, nuevo]);
      setMensaje('Préstamo registrado correctamente');
    }

    limpiarFormulario();
  };

  const handleEliminar = (idEliminar: number) => {
    if (!window.confirm('¿Deseas eliminar este préstamo?')) return;
    setDatos((prev) => prev.filter((p) => p.PRE_ID !== idEliminar));
    setMensaje('Préstamo eliminado correctamente');
    if (id === idEliminar) limpiarFormulario();
  };

  const handleEditar = (p: Prestamo) => {
    setModoEdicion(true);
    setId(p.PRE_ID);
    setMensaje('');
    setError('');
    setForm({
      emp_id: String(p.EMP_ID),
      pre_monto_total: String(p.PRE_MONTO_TOTAL),
      pre_total_cuotas: String(p.PRE_TOTAL_CUOTAS),
      pre_fecha_inicio: p.PRE_FECHA_INICIO
        ? String(p.PRE_FECHA_INICIO).split('T')[0] : '',
      pre_estado: p.PRE_ESTADO,
      pre_descripcion: p.PRE_DESCRIPCION
    });
  };

  const registrarPago = (idPrestamo: number) => {
    setDatos((prev) => prev.map((p) => {
      if (p.PRE_ID !== idPrestamo) return p;
      if (p.PRE_CUOTAS_PAGADAS >= p.PRE_TOTAL_CUOTAS) return p;
      const nuevasPagadas = p.PRE_CUOTAS_PAGADAS + 1;
      const nuevoSaldo = p.PRE_MONTO_TOTAL - (nuevasPagadas * p.PRE_CUOTA_MENSUAL);
      return {
        ...p,
        PRE_CUOTAS_PAGADAS: nuevasPagadas,
        PRE_SALDO_PENDIENTE: Math.max(0, nuevoSaldo),
        PRE_ESTADO: nuevasPagadas >= p.PRE_TOTAL_CUOTAS ? 'F' : 'A'
      };
    }));
    setMensaje('Pago de cuota registrado');
  };

  const obtenerChipEstado = (estado: string) => {
    if (estado === 'A') return <Chip label="Activo" color="warning" size="small" />;
    if (estado === 'F') return <Chip label="Finalizado" color="success" size="small" />;
    if (estado === 'S') return <Chip label="Suspendido" color="error" size="small" />;
    return <Chip label={estado} size="small" />;
  };

  const fmt = (valor: number) =>
    `Q ${valor.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Box sx={{ py: 2 }}>
      {/* Formulario */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <AccountBalanceIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Préstamos Banco Trabajadores
          </Typography>
        </Box>

        <Typography variant="h6" sx={{ mb: 2 }}>
          {modoEdicion ? 'Editar préstamo' : 'Nuevo préstamo'}
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Empleado ID" name="emp_id"
              type="number" value={form.emp_id} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Monto total (Q)" name="pre_monto_total"
              type="number" value={form.pre_monto_total} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Número de cuotas" name="pre_total_cuotas"
              type="number" value={form.pre_total_cuotas} onChange={handleChange} />
          </Grid>

          {/* Cuota mensual calculada automáticamente */}
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Cuota mensual (calculada)"
              value={cuotaMensualCalculada > 0 ? fmt(cuotaMensualCalculada) : ''}
              slotProps={{ input: { readOnly: true } }}
              sx={{ backgroundColor: '#f5f5f5' }} />
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Fecha de inicio" name="pre_fecha_inicio"
              type="date" value={form.pre_fecha_inicio} onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth>
              <InputLabel>Estado</InputLabel>
              <Select name="pre_estado" value={form.pre_estado}
                label="Estado" onChange={handleChange}>
                <MenuItem value="A">Activo</MenuItem>
                <MenuItem value="S">Suspendido</MenuItem>
                <MenuItem value="F">Finalizado</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Descripción" name="pre_descripcion"
              value={form.pre_descripcion} onChange={handleChange} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
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
          Listado de préstamos: {datos.length}
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Empleado</strong></TableCell>
                <TableCell><strong>Monto Total</strong></TableCell>
                <TableCell><strong>Cuota Mensual</strong></TableCell>
                <TableCell><strong>Avance</strong></TableCell>
                <TableCell><strong>Saldo Pendiente</strong></TableCell>
                <TableCell><strong>Estado</strong></TableCell>
                <TableCell><strong>Acciones</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {datos.length > 0 ? datos.map((p) => {
                const porcentaje = (p.PRE_CUOTAS_PAGADAS / p.PRE_TOTAL_CUOTAS) * 100;
                return (
                  <TableRow key={p.PRE_ID} hover>
                    <TableCell>{p.PRE_ID}</TableCell>
                    <TableCell>Emp. {p.EMP_ID}</TableCell>
                    <TableCell>{fmt(p.PRE_MONTO_TOTAL)}</TableCell>
                    <TableCell>{fmt(p.PRE_CUOTA_MENSUAL)}</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress variant="determinate" value={porcentaje}
                          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }} />
                        <Typography variant="caption">
                          {p.PRE_CUOTAS_PAGADAS}/{p.PRE_TOTAL_CUOTAS}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: p.PRE_SALDO_PENDIENTE > 0 ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                      {fmt(p.PRE_SALDO_PENDIENTE)}
                    </TableCell>
                    <TableCell>{obtenerChipEstado(p.PRE_ESTADO)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {p.PRE_ESTADO === 'A' && (
                          <Button size="small" variant="contained" color="success"
                            onClick={() => registrarPago(p.PRE_ID)}>
                            + Cuota
                          </Button>
                        )}
                        <Button size="small" variant="outlined" startIcon={<EditIcon />}
                          onClick={() => handleEditar(p)}>Editar</Button>
                        <Button size="small" variant="contained" color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleEliminar(p.PRE_ID)}>Eliminar</Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">No hay préstamos registrados</TableCell>
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

export default PrestamoCRUD;