import { useEffect, useMemo, useState } from 'react';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { AuditoriaCambio } from '../interfaces/auditoriaCambio';
import { obtenerAuditoriaCambio } from '../services/admin.service';

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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';

const normalizar = (valor: unknown) =>
  String(valor ?? '')
    .normalize('NFD')
    .replace(/[^\w\s]/g, '')
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

function exportCsv(rows: AuditoriaCambio[]) {
  const headers = ['Fecha', 'Usuario', 'Tabla', 'Registro ID', 'Campo', 'Valor anterior', 'Valor nuevo', 'IP'];
  const csv = [headers.join(',')]
    .concat(
      rows.map((r) => [
        JSON.stringify(r.AUD_FECHA ?? ''),
        JSON.stringify(r.USU_ID ?? ''),
        JSON.stringify(r.AUD_TABLA ?? ''),
        JSON.stringify(r.AUD_REGISTRO_ID ?? ''),
        JSON.stringify(r.AUD_CAMPO ?? ''),
        JSON.stringify(r.AUD_VALOR_ANTERIOR ?? ''),
        JSON.stringify(r.AUD_VALOR_NUEVO ?? ''),
        JSON.stringify(r.AUD_IP ?? ''),
      ].join(','))
    )
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `auditoria_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function exportXlsx(rows: AuditoriaCambio[]) {
  const data = rows.map((r) => ({
    Fecha: r.AUD_FECHA ?? '',
    Usuario: r.USU_ID ?? '',
    Tabla: r.AUD_TABLA ?? '',
    'ID Registro': r.AUD_REGISTRO_ID ?? '',
    Campo: r.AUD_CAMPO ?? '',
    'Valor anterior': r.AUD_VALOR_ANTERIOR ?? '',
    'Valor nuevo': r.AUD_VALOR_NUEVO ?? '',
    IP: r.AUD_IP ?? '',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Auditoria');
  const filename = `auditoria_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}

function Auditoria() {
  const [datos, setDatos] = useState<AuditoriaCambio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroTabla, setFiltroTabla] = useState('');
  const [filtroUsuario, setFiltroUsuario] = useState('');
  const [campo, setCampo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const data = await obtenerAuditoriaCambio();
      setDatos(Array.isArray(data) ? (data as AuditoriaCambio[]) : []);
    } catch (err: any) {
      setError('Error cargando auditoría');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const tablas = useMemo(
    () => Array.from(new Set(datos.map((d) => d.AUD_TABLA).filter(Boolean))).sort(),
    [datos]
  );

  const datosFiltrados = useMemo(() => {
    const texto = normalizar(busqueda);

    return [...datos]
      .filter((item) => {
        const coincideTabla = !filtroTabla || item.AUD_TABLA === filtroTabla;
        const coincideUsuario = !filtroUsuario || String(item.USU_ID) === filtroUsuario;
        const coincideCampo = !campo || (item.AUD_CAMPO || '').toLowerCase() === campo.toLowerCase();
        const fecha = String(item.AUD_FECHA || '').slice(0, 10);
        const coincideDesde = !fechaDesde || fecha >= fechaDesde;
        const coincideHasta = !fechaHasta || fecha <= fechaHasta;
        const contenido = normalizar([
          item.AUD_TABLA,
          item.AUD_CAMPO,
          item.AUD_VALOR_ANTERIOR,
          item.AUD_VALOR_NUEVO,
        ].join(' '));

        return coincideTabla && coincideUsuario && coincideCampo && coincideDesde && coincideHasta && (!texto || contenido.includes(texto));
      })
      .sort((a, b) => {
        const fechaA = new Date(a.AUD_FECHA || '').getTime();
        const fechaB = new Date(b.AUD_FECHA || '').getTime();
        return (Number.isNaN(fechaB) ? 0 : fechaB) - (Number.isNaN(fechaA) ? 0 : fechaA);
      });
  }, [datos, filtroTabla, filtroUsuario, campo, busqueda, fechaDesde, fechaHasta]);

  if (cargando) return <Box sx={{ p: 3 }}><Typography>Cargando auditoría...</Typography></Box>;

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <DescriptionIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Auditoría de Cambios</Typography>
        </Box>

        <Alert severity="info" sx={{ mb: 2 }}>
          Registros de cambios sensibles. Vista de solo lectura. Los cambios se deben generar desde el backend.
        </Alert>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tabla</InputLabel>
              <Select value={filtroTabla} label="Tabla" onChange={(e: SelectChangeEvent) => setFiltroTabla(e.target.value)}>
                <MenuItem value="">Todas</MenuItem>
                {tablas.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={3}>
            <TextField fullWidth label="Usuario (ID)" value={filtroUsuario} onChange={(e) => setFiltroUsuario(e.target.value)} />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField fullWidth label="Campo" value={campo} onChange={(e) => setCampo(e.target.value)} />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField fullWidth label="Desde" type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField fullWidth label="Hasta" type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>

          <Grid item xs={12} md={2}>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => exportCsv(datosFiltrados)} fullWidth sx={{ mb: 1 }}>Exportar CSV</Button>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={() => exportXlsx(datosFiltrados)} fullWidth>Exportar XLSX</Button>
          </Grid>

          <Grid item xs={12} md={10}>
            <TextField fullWidth label="Buscar" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Registros: {datosFiltrados.length}
        </Typography>

        <TableContainer sx={{ maxHeight: 620 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>Fecha</strong></TableCell>
                <TableCell><strong>Usuario</strong></TableCell>
                <TableCell><strong>Tabla</strong></TableCell>
                <TableCell><strong>ID Registro</strong></TableCell>
                <TableCell><strong>Campo</strong></TableCell>
                <TableCell><strong>Valor anterior</strong></TableCell>
                <TableCell><strong>Valor nuevo</strong></TableCell>
                <TableCell><strong>IP</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {datosFiltrados.length > 0 ? (
                datosFiltrados.map((r) => (
                  <TableRow key={r.AUD_ID} hover>
                    <TableCell>{formatearFecha(r.AUD_FECHA)}</TableCell>
                    <TableCell>{r.USU_ID ?? '-'}</TableCell>
                    <TableCell>{r.AUD_TABLA ?? '-'}</TableCell>
                    <TableCell>{r.AUD_REGISTRO_ID ?? '-'}</TableCell>
                    <TableCell>{r.AUD_CAMPO ?? '-'}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{r.AUD_VALOR_ANTERIOR ?? '-'}</TableCell>
                    <TableCell sx={{ minWidth: 180 }}>{r.AUD_VALOR_NUEVO ?? '-'}</TableCell>
                    <TableCell>{r.AUD_IP ?? '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">No hay registros para los filtros seleccionados</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}

export default Auditoria;
