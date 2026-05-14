import api from '../api/axios';
import type { Bitacora } from '../interfaces/bitacora';
import type { Permiso } from '../interfaces/permisos';
import type { Rol } from '../interfaces/roles';
import type { RolPermiso } from '../interfaces/rolPermisos';
import type { Usuario } from '../interfaces/usuario';
import type { UsuarioBitacora } from '../interfaces/usuarioBitacora';
import type { Pagination } from './paginated';
import { readPaginatedRows } from './paginated';

export type AdminCatalogo = {
  usuarios: Usuario[];
  roles: Rol[];
  permisos: Permiso[];
  rolPermisos: RolPermiso[];
};

export type AdminActividad = {
  bitacora: Bitacora[];
  usuarioBitacora: UsuarioBitacora[];
  pagination?: Pagination;
};

export type AdminResumen = Record<string, unknown>;

const pickArray = <T>(data: unknown, keys: string[]): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== 'object') return [];

  const record = data as Record<string, unknown>;
  const nestedData = record.data;

  if (nestedData && typeof nestedData === 'object' && !Array.isArray(nestedData)) {
    const nested = pickArray<T>(nestedData, keys);
    if (nested.length > 0) return nested;
  }

  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];
  }

  return [];
};

export const obtenerAdminResumen = async (): Promise<AdminResumen> => {
  const response = await api.get<AdminResumen>('admin/resumen');
  return response.data;
};

export const obtenerAdminCatalogo = async (): Promise<AdminCatalogo> => {
  const response = await api.get('admin/catalogo');
  const data = response.data;

  return {
    usuarios: pickArray<Usuario>(data, ['usuarios', 'USUARIOS', 'users']),
    roles: pickArray<Rol>(data, ['roles', 'ROLES']),
    permisos: pickArray<Permiso>(data, ['permisos', 'PERMISOS', 'permissions']),
    rolPermisos: pickArray<RolPermiso>(data, ['rolPermisos', 'rol_permisos', 'ROLPERMISOS', 'rolesPermisos']),
  };
};

export const obtenerAdminActividad = async (): Promise<AdminActividad> => {
  const response = await api.get('admin/actividad');
  const data = response.data;
  const paginated = readPaginatedRows<Bitacora>(data);

  return {
    bitacora: paginated.rows.length
      ? paginated.rows
      : pickArray<Bitacora>(data, ['bitacora', 'BITACORA', 'actividad', 'registros']),
    usuarioBitacora: pickArray<UsuarioBitacora>(data, ['usuarioBitacora', 'usuario_bitacora', 'USUARIO_BITACORA']),
    pagination: paginated.pagination,
  };
};
