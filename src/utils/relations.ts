import type { Empleado } from '../interfaces/empleados';

export const obtenerNombreEmpleado = (empleado?: Pick<Empleado, 'EMP_NOMBRE' | 'EMP_APELLIDO'>) =>
  empleado ? `${empleado.EMP_NOMBRE ?? ''} ${empleado.EMP_APELLIDO ?? ''}`.trim() : '';

export const formatearMoneda = (valor: number | string | null | undefined) =>
  `Q${Number(valor || 0).toLocaleString('es-GT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatearFecha = (fecha: string | null | undefined) =>
  fecha ? String(fecha).slice(0, 10) : '';
