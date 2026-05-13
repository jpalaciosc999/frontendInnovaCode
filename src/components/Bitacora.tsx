import { useEffect, useMemo, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { Bitacora } from '../interfaces/bitacora';
import { obtenerAdminActividad } from '../services/admin.service';
import { getApiErrorMessage } from '../api/errors';

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

import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import HistoryIcon from '@mui/icons-material/History';

const normalizar = (valor: unknown) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const formatearFecha = (fecha?: string) => {
  if (!fecha) return '-';
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return String(fecha).slice(0, 10);

  return parsed.toLocaleString('es-GT', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

function BitacoraCRUD() {
  const [datos, setDatos] = useState<Bitacora[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');
  const [filtroTabla, setFiltroTabla] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [totalBackend, setTotalBackend] = useState<number | null>(null);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerAdminActividad();
      setDatos(data.bitacora);
      setTotalBackend(data.pagination?.count ?? null);
    } catch (err: any) {
      setError('Error cargando bitácora: ' + getApiErrorMessage(err, 'No se pudo cargar la bitácora'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const tablas = useMemo(
    () =>
      Array.from(
        new Set(datos.map((item) => item.BIT_TABLA_AFECTADA).filter(Boolean))
      ).sort((a, b) => a.localeCompare(b)),
    [datos]
  );

  const datosFiltrados = useMemo(() => {
    const texto = normalizar(busqueda);

    return [...datos]
      .filter((item) => {
        const coincideAccion = !filtroAccion || item.BIT_ACCION === filtroAccion;
        const coincideTabla = !filtroTabla || item.BIT_TABLA_AFECTADA === filtroTabla;
        const fecha = String(item.BIT_FECHA || '').slice(0, 10);
        const coincideDesde = !fechaDesde || fecha >= fechaDesde;
        const coincideHasta = !fechaHasta || fecha <= fechaHasta;
        const contenido = normalizar(
          [
            item.BIT_ID,
            item.BIT_ACCION,
            item.BIT_TABLA_AFECTADA,
            item.BIT_ID_REGISTRO,
            item.BIT_DESCRIPCION,
            item.BIT_VALOR_ANTERIOR,
            item.BIT_VALOR_NUEVO,
            item.BIT_IP_USUARIO,
          ].join(' ')
        );

        return coincideAccion && coincideTabla && coincideDesde && coincideHasta && (!texto || contenido.includes(texto));
      })
      .sort((a, b) => {
        const fechaA = new Date(a.BIT_FECHA || '').getTime();
        const fechaB = new Date(b.BIT_FECHA || '').getTime();
        return (Number.isNaN(fechaB) ? 0 : fechaB) - (Number.isNaN(fechaA) ? 0 : fechaA);
      });
  }, [busqueda, datos, fechaDesde, fechaHasta, filtroAccion, filtroTabla]);

  const resumenAcciones = useMemo(() => ({
    inserts: datos.filter((item) => ['insert', 'crear'].includes(normalizar(item.BIT_ACCION))).length,
    updates: datos.filter((item) => ['update', 'actualizar'].includes(normalizar(item.BIT_ACCION))).length,
    deletes: datos.filter((item) => ['delete', 'eliminar'].includes(normalizar(item.BIT_ACCION))).length,
    tablas: tablas.length,
  }), [datos, tablas.length]);

  const limpiarFiltros = () => {
    setFiltroAccion('');
    setFiltroTabla('');
    setBusqueda('');
    setFechaDesde('');
    setFechaHasta('');
  };

  const obtenerChipAccion = (accion: string) => {
    const lower = accion?.toLowerCase() || '';
    if (lower === 'insert' || lower === 'crear')
      return <Chip label={accion} color="success" size="small" />;
    if (lower === 'update' || lower === 'actualizar')
      return <Chip label={accion} color="warning" size="small" />;
    if (lower === 'delete' || lower === 'eliminar')
      return <Chip label={accion} color="error" size="small" />;
    return <Chip label={accion || '-'} color="info" size="small" />;
  };

  if (cargando) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Cargando bitácora...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <HistoryIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Bitácora del Sistema
          </Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          La bitácora es una consulta de auditoría. Los registros deben generarse desde el backend cuando un usuario crea, actualiza, inactiva o elimina información.
        </Alert>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
          <Chip label={`Altas: ${resumenAcciones.inserts}`} color="success" />
          <Chip label={`Cambios: ${resumenAcciones.updates}`} color="warning" />
          <Chip label={`Bajas: ${resumenAcciones.deletes}`} color="error" />
          <Chip label={`Tablas auditadas: ${resumenAcciones.tablas}`} color="info" />
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Acción</InputLabel>
              <Select
                value={filtroAccion}
                label="Acción"
                onChange={(event: SelectChangeEvent) => setFiltroAccion(event.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="INSERT">INSERT</MenuItem>
                <MenuItem value="UPDATE">UPDATE</MenuItem>
                <MenuItem value="DELETE">DELETE</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Tabla</InputLabel>
              <Select
                value={filtroTabla}
                label="Tabla"
                onChange={(event: SelectChangeEvent) => setFiltroTabla(event.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {tablas.map((tabla) => (
                  <MenuItem key={tabla} value={tabla}>
                    {tabla}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Buscar"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              label="Desde"
              type="date"
              value={fechaDesde}
              onChange={(event) => setFechaDesde(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <TextField
              fullWidth
              label="Hasta"
              type="date"
              value={fechaHasta}
              onChange={(event) => setFechaHasta(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CleaningServicesIcon />}
              onClick={limpiarFiltros}
              sx={{ height: '100%' }}
            >
              Limpiar
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Registros de auditoría: {datosFiltrados.length} de {totalBackend ?? datos.length}
        </Typography>

        <TableContainer sx={{ maxHeight: 620 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>ID</strong></TableCell>
                <TableCell><strong>Acción</strong></TableCell>
                <TableCell><strong>Tabla</strong></TableCell>
                <TableCell><strong>ID Registro</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell><strong>Valor anterior</strong></TableCell>
                <TableCell><strong>Valor nuevo</strong></TableCell>
                <TableCell><strong>IP</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datosFiltrados.length > 0 ? (
                datosFiltrados.map((b) => (
                  <TableRow key={b.BIT_ID} hover>
                    <TableCell>{b.BIT_ID}</TableCell>
                    <TableCell>{obtenerChipAccion(b.BIT_ACCION)}</TableCell>
                    <TableCell>{b.BIT_TABLA_AFECTADA}</TableCell>
                    <TableCell>{b.BIT_ID_REGISTRO || '-'}</TableCell>
                    <TableCell sx={{ minWidth: 220 }}>{b.BIT_DESCRIPCION || '-'}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{b.BIT_VALOR_ANTERIOR || '-'}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{b.BIT_VALOR_NUEVO || '-'}</TableCell>
                    <TableCell>{b.BIT_IP_USUARIO || '-'}</TableCell>
                    <TableCell>{formatearFecha(b.BIT_FECHA)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    No hay registros de auditoría para los filtros seleccionados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

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

export default BitacoraCRUD;
