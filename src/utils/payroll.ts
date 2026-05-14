import type { Empleado } from '../interfaces/empleados';
import type { Puesto } from '../interfaces/puestos';

export const SALARIO_MENSUAL_DEFAULT = 4000;
export const TASA_IGSS_LABORAL = 0.0483;
export const TASA_IGSS_PATRONAL = 0.1267;

export function obtenerSueldoMensual(
  empleado: Pick<Empleado, 'EMP_SUELDO'>,
  puesto?: Pick<Puesto, 'PUE_SALARIO_BASE'>
) {
  const valor = Number(String(empleado.EMP_SUELDO ?? '').replace(/,/g, ''));
  if (Number.isFinite(valor) && valor > 0) return valor;

  const salarioPuesto = Number(String(puesto?.PUE_SALARIO_BASE ?? '').replace(/,/g, ''));
  return Number.isFinite(salarioPuesto) && salarioPuesto > 0 ? salarioPuesto : SALARIO_MENSUAL_DEFAULT;
}

export function calcularISR(salarioMensual: number) {
  const anual = salarioMensual * 12;
  const imponible = Math.max(0, anual - 60_000 - 48_000);

  if (imponible <= 0) {
    return {
      isr_anual: 0,
      isr_mensual: 0,
      imponible,
      detalle: 'No aplica ISR',
    };
  }

  if (imponible <= 300_000) {
    const isr_anual = imponible * 0.05;
    return {
      isr_anual,
      isr_mensual: isr_anual / 12,
      imponible,
      detalle: `Q${imponible.toLocaleString('es-GT')} x 5%`,
    };
  }

  const excedente = imponible - 300_000;
  const isr_anual = 15_000 + excedente * 0.07;

  return {
    isr_anual,
    isr_mensual: isr_anual / 12,
    imponible,
    detalle: `Q15,000 + (Q${excedente.toLocaleString('es-GT')} x 7%)`,
  };
}
