import api from '../api/axios';
import type { Usuario, UsuarioForm } from '../interfaces/usuario';

const ENDPOINT = 'usuarios';

const pickUsuarios = (data: unknown): Usuario[] => {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== 'object') return [];

    const record = data as Record<string, unknown>;
    const candidates = [
        record.usuarios,
        record.USUARIOS,
        record.users,
        record.USERS,
        record.data,
        record.result,
        record.results,
        record.rows,
        record.payload,
    ];

    const direct = candidates.find(Array.isArray);
    if (direct) return direct as Usuario[];

    for (const candidate of candidates) {
        const nested = pickUsuarios(candidate);
        if (nested.length > 0) return nested;
    }

    return [];
};

const read = (item: unknown, keys: string[]) => {
    if (!item || typeof item !== 'object') return undefined;
    const record = item as Record<string, unknown>;

    for (const key of keys) {
        const value = record[key];
        if (value !== undefined && value !== null && String(value).trim() !== '') return value;
    }

    return undefined;
};

const toNumber = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};

export const normalizeUsuario = (usuario: Usuario): Usuario => ({
    ...usuario,
    id: toNumber(read(usuario, ['id', 'ID', 'USU_ID', 'usu_id', 'usuario_id', 'USUARIO_ID'])) ?? 0,
    username: String(read(usuario, ['username', 'USERNAME', 'USU_USERNAME', 'usu_username']) ?? ''),
    nombre_completo: String(
        read(usuario, ['nombre_completo', 'NOMBRE_COMPLETO', 'USU_NOMBRE_COMPLETO', 'usu_nombre_completo']) ?? ''
    ),
    correo: String(read(usuario, ['correo', 'CORREO', 'USU_CORREO', 'usu_correo', 'email', 'EMAIL']) ?? ''),
    estado: String(read(usuario, ['estado', 'ESTADO', 'USU_ESTADO', 'usu_estado']) ?? 'A'),
    fecha_creacion: String(read(usuario, ['fecha_creacion', 'FECHA_CREACION', 'USU_FECHA_CREACION']) ?? ''),
    rol_id: toNumber(read(usuario, ['rol_id', 'ROL_ID'])) ?? 0,
    emp_id: toNumber(read(usuario, ['emp_id', 'EMP_ID'])) ?? 0,
});

export const obtenerUsuarios = async (): Promise<Usuario[]> => {
    const response = await api.get<unknown>(`${ENDPOINT}/`);
    return pickUsuarios(response.data).map(normalizeUsuario);
};

export const crearUsuario = async (data: UsuarioForm): Promise<void> => {
    await api.post(`${ENDPOINT}/`, data);
};

export const actualizarUsuario = async (id: number, data: Partial<UsuarioForm>): Promise<void> => {
    if (!Number.isFinite(id)) {
        throw new Error('El id del usuario debe ser numérico');
    }

    await api.put(`${ENDPOINT}/${id}`, data);
};

export const eliminarUsuario = async (id: number): Promise<void> => {
    if (!Number.isFinite(id)) {
        throw new Error('El id del usuario debe ser numérico');
    }

    await api.delete(`${ENDPOINT}/${id}`);
};
