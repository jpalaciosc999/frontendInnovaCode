import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import type { Usuario } from '../interfaces/usuario';
import type { Rol } from '../interfaces/roles';
import { obtenerUsuarios } from '../services/usuario.service';
import { obtenerRoles } from '../services/roles.service';
import {
  clearSelectedUserFromLocalStorage,
  getCurrentStoredUserId,
  saveSelectedUserToLocalStorage,
} from '../config/roleViews';

type UserRoleSelectorProps = {
  onUserChanged?: () => void;
};

function UserRoleSelector({ onUserChanged }: UserRoleSelectorProps) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [selectedUserId, setSelectedUserId] = useState(getCurrentStoredUserId());
  const [error, setError] = useState('');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setError('');
        const [usuariosData, rolesData] = await Promise.all([
          obtenerUsuarios(),
          obtenerRoles(),
        ]);

        setUsuarios(usuariosData);
        setRoles(rolesData);
      } catch (err: any) {
        setError('No se pudieron cargar usuarios y roles: ' + (err.response?.data?.error || err.message));
      }
    };

    cargarDatos();
  }, []);

  const rolesPorId = useMemo(
    () => new Map(roles.map((rol) => [String(rol.ROL_ID), rol])),
    [roles]
  );

  const handleChange = (event: SelectChangeEvent) => {
    const userId = event.target.value;
    setSelectedUserId(userId);

    const user = usuarios.find((item) => String(item.id) === userId);
    if (!user) return;

    const role = rolesPorId.get(String(user.rol_id));
    saveSelectedUserToLocalStorage(
      {
        ...user,
        rol_nombre: role?.ROL_NOMBRE ?? '',
      },
      role?.ROL_NOMBRE ?? ''
    );
    onUserChanged?.();
  };

  const limpiarUsuario = () => {
    setSelectedUserId('');
    clearSelectedUserFromLocalStorage();
    onUserChanged?.();
  };

  return (
    <Box sx={{ display: 'grid', gap: 1.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
        Usuario activo
      </Typography>

      {error ? <Alert severity="warning">{error}</Alert> : null}

      <FormControl fullWidth size="small">
        <InputLabel id="active-user-label">Usuario</InputLabel>
        <Select
          labelId="active-user-label"
          label="Usuario"
          value={selectedUserId}
          onChange={handleChange}
        >
          {usuarios.map((usuario) => {
            const role = rolesPorId.get(String(usuario.rol_id));
            const label = `${usuario.nombre_completo || usuario.username} - ${role?.ROL_NOMBRE ?? 'Sin rol'}`;

            return (
              <MenuItem key={usuario.id} value={String(usuario.id)}>
                {label}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      {selectedUserId ? (
        <Button size="small" variant="outlined" onClick={limpiarUsuario}>
          Quitar usuario activo
        </Button>
      ) : null}
    </Box>
  );
}

export default UserRoleSelector;
