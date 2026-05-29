import type { Ingreso } from '../interfaces/tipoIngresos';
import type { Descuento } from '../interfaces/descuentos';

export type CategoriaIngreso =
  | 'salario'
  | 'bonificacion'
  | 'horas_extra'
  | 'comision'
  | 'otro_ingreso';

export type CategoriaDescuento =
  | 'anticipo'
  | 'igss'
  | 'isr'
  | 'prestamo'
  | 'judicial'
  | 'otro_descuento';

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();

const includesAny = (value: string, tokens: string[]) => tokens.some((token) => value.includes(token));

export const getIngresoCategoria = (ingreso?: Pick<Ingreso, 'TIS_CODIGO' | 'TIS_NOMBRE'>): CategoriaIngreso => {
  const code = normalize(ingreso?.TIS_CODIGO);
  const text = normalize(`${ingreso?.TIS_CODIGO ?? ''} ${ingreso?.TIS_NOMBRE ?? ''}`);

  if (['SALARIO', 'SUELDO', 'SALARIO_BASE', 'SUELDO_BASE'].includes(code) || includesAny(text, ['SALARIO', 'SUELDO'])) {
    return 'salario';
  }
  if (['BONIFICACION', 'BONIF', 'BONO_INCENTIVO', 'BONO14'].includes(code) || includesAny(text, ['BONIF', 'BONIFICACION', 'DECRETO', 'INCENTIVO'])) {
    return 'bonificacion';
  }
  if (['HORAS_EXTRA', 'HORA_EXTRA', 'EXTRA'].includes(code) || includesAny(text, ['HORA EXTRA', 'HORAS EXTRA', 'EXTRA'])) {
    return 'horas_extra';
  }
  if (['COMISION', 'COMISIONES', 'KPI'].includes(code) || includesAny(text, ['COMISION', 'KPI'])) {
    return 'comision';
  }

  return 'otro_ingreso';
};

export const getDescuentoCategoria = (descuento?: Pick<Descuento, 'TDS_CODIGO' | 'TDS_NOMBRE'>): CategoriaDescuento => {
  const code = normalize(descuento?.TDS_CODIGO);
  const text = normalize(`${descuento?.TDS_CODIGO ?? ''} ${descuento?.TDS_NOMBRE ?? ''}`);

  if (['ANTICIPO', 'ADELANTO'].includes(code) || includesAny(text, ['ANTICIPO', 'ADELANTO'])) return 'anticipo';
  if (['IGSS', 'IGSS-LAB', 'IGSS_LAB', 'IGSS LABORAL'].includes(code) || includesAny(text, ['IGSS'])) return 'igss';
  if (['ISR'].includes(code) || includesAny(text, ['ISR'])) return 'isr';
  if (['PRESTAMO', 'PRESTAMOS', 'CREDITO'].includes(code) || includesAny(text, ['PRESTAMO', 'CREDITO'])) return 'prestamo';
  if (['JUDICIAL', 'EMBARGO', 'PENSION'].includes(code) || includesAny(text, ['JUD', 'EMBARGO', 'PENSION'])) return 'judicial';

  return 'otro_descuento';
};

export const isConceptoBaseBoleta = (concepto: { codigo?: string; nombre?: string }) => {
  const text = normalize(`${concepto.codigo ?? ''} ${concepto.nombre ?? ''}`);
  return includesAny(text, [
    'SALARIO',
    'SUELDO',
    'EXTRA',
    'COMISION',
    'KPI',
    'BONIF',
    'BONIFICACION',
    'INCENTIVO',
    'IGSS',
    'ISR',
    'PRESTAMO',
    'ANTICIPO',
    'JUD',
    'EMBARGO',
    'PENSION',
  ]);
};
