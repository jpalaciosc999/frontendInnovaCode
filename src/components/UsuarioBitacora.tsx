import { useEffect, useMemo, useState } from 'react';
import type { UsuarioBitacora } from '../interfaces/usuarioBitacora';
import type { Usuario } from '../interfaces/usuario';
import type { Bitacora } from '../interfaces/bitacora';
import { obtenerAdminActividad, obtenerAdminCatalogo } from '../services/admin.service';
import { getApiErrorMessage } from '../api/errors';

import {
  Alert,
  Box,
  Chip,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from '@mui/material';

import MenuBookIcon from '@mui/icons-material/MenuBook';

const formatearFecha = (fecha?: string) => {
  if (!fecha) return '-';
  const parsed = new Date(fecha);
  if (Number.isNaN(parsed.getTime())) return String(fecha).slice(0, 10);

  return parsed.toLocaleString('es-GT', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const leerCampo = (item: unknown, keys: string[]) => {
  if (!item || typeof item !== 'object') return undefined;
  const record = item as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }

  return undefined;
};

const getUsuarioId = (usuario: Usuario) =>
  String(leerCampo(usuario, ['id', 'USU_ID', 'usu_id', 'usuario_id', 'USER_ID']) ?? '');

const getUsuarioNombre = (usuario: Usuario) =>
  String(leerCampo(usuario, ['nombre_completo', 'NOMBRE_COMPLETO', 'USU_NOMBRE_COMPLETO', 'username', 'USERNAME']) ?? '');

const getUsuarioCorreo = (usuario: Usuario) =>
  String(leerCampo(usuario, ['correo', 'CORREO', 'email', 'EMAIL', 'USU_CORREO']) ?? '');

function UsuarioBitacoraCRUD() {
  const [datos, setDatos] = useState<UsuarioBitacora[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [bitacoras, setBitacoras] = useState<Bitacora[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError('');
      const [actividad, catalogo] = await Promise.all([
        obtenerAdminActividad(),
        obtenerAdminCatalogo(),
      ]);
      setDatos(actividad.usuarioBitacora);
      setUsuarios(catalogo.usuarios);
      setBitacoras(actividad.bitacora);
    } catch (err: any) {
      setError('Error cargando trazabilidad usuario-bitácora: ' + getApiErrorMessage(err, 'No se pudo cargar la trazabilidad'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const usuariosPorId = useMemo(
    () => new Map(usuarios.map((usuario) => [getUsuarioId(usuario), usuario])),
    [usuarios]
  );

  const bitacorasPorId = useMemo(
    () => new Map(bitacoras.map((bitacora) => [String(bitacora.BIT_ID), bitacora])),
    [bitacoras]
  );

  const registros = useMemo(
    () =>
      [...datos].sort((a, b) => {
        const bitA = bitacorasPorId.get(String(a.BIT_ID));
        const bitB = bitacorasPorId.get(String(b.BIT_ID));
        const fechaA = new Date(bitA?.BIT_FECHA || '').getTime();
        const fechaB = new Date(bitB?.BIT_FECHA || '').getTime();
        return (Number.isNaN(fechaB) ? 0 : fechaB) - (Number.isNaN(fechaA) ? 0 : fechaA);
      }),
    [bitacorasPorId, datos]
  );

  const obtenerChipAccion = (accion?: string) => {
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
        <Typography variant="h6">Cargando trazabilidad...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <MenuBookIcon color="primary" />
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Trazabilidad Usuario-Bitácora
          </Typography>
        </Box>

        <Alert severity="info">
          Esta vista solo cruza usuarios con eventos de bitácora. La relación debe crearla el backend automáticamente al registrar cada acción auditada.
        </Alert>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Relaciones de auditoría: {registros.length}
        </Typography>

        <TableContainer sx={{ maxHeight: 620 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell><strong>USB ID</strong></TableCell>
                <TableCell><strong>Usuario</strong></TableCell>
                <TableCell><strong>Acción</strong></TableCell>
                <TableCell><strong>Tabla</strong></TableCell>
                <TableCell><strong>ID Registro</strong></TableCell>
                <TableCell><strong>Descripción</strong></TableCell>
                <TableCell><strong>Fecha</strong></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {registros.length > 0 ? (
                registros.map((relacion) => {
                  const usuario = usuariosPorId.get(String(relacion.USU_ID));
                  const bitacora = bitacorasPorId.get(String(relacion.BIT_ID));

                  return (
                    <TableRow key={relacion.USB_ID} hover>
                      <TableCell>{relacion.USB_ID}</TableCell>
                      <TableCell>
                        <Typography sx={{ fontWeight: 600 }}>
                          {(usuario && getUsuarioNombre(usuario)) || `Usuario #${relacion.USU_ID}`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {(usuario && getUsuarioCorreo(usuario)) || `USU_ID ${relacion.USU_ID}`}
                        </Typography>
                      </TableCell>
                      <TableCell>{obtenerChipAccion(bitacora?.BIT_ACCION)}</TableCell>
                      <TableCell>{bitacora?.BIT_TABLA_AFECTADA || '-'}</TableCell>
                      <TableCell>{bitacora?.BIT_ID_REGISTRO || '-'}</TableCell>
                      <TableCell sx={{ minWidth: 240 }}>{bitacora?.BIT_DESCRIPCION || '-'}</TableCell>
                      <TableCell>{formatearFecha(bitacora?.BIT_FECHA)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No hay relaciones usuario-bitácora registradas
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

export default UsuarioBitacoraCRUD;
