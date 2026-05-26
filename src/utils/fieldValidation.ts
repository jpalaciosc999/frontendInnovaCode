/**
 * Utilities for restricting characters in fields that do not need free-form
 * special characters. Passwords, emails, URLs, dates, numbers and addresses are
 * intentionally left unrestricted or handled by their native input type.
 */

export type FieldCharacterRule = 'name' | 'code' | 'description' | 'numeric' | 'free';

const LETTERS = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';

export const PATTERNS = {
  // Letras, numeros, espacios y acentos espanoles.
  NOMBRE: new RegExp(`^[${LETTERS}0-9\\s]*$`),

  // Codigos tecnicos: letras, numeros, guion y guion bajo.
  CODIGO: /^[a-zA-Z0-9_-]*$/,

  // Texto descriptivo con puntuacion basica de uso comun.
  DESCRIPCION: new RegExp(`^[${LETTERS}0-9\\s.,;:¿?¡!%°+\\-_/()[\\]'""]*$`),

  // Solo digitos.
  NUMERICO: /^[0-9]*$/,
};

export const REGEX_PATTERNS = {
  NOMBRE_SANITIZE: new RegExp(`[^${LETTERS}0-9\\s]`, 'g'),
  CODIGO_SANITIZE: /[^a-zA-Z0-9_-]/g,
  DESCRIPCION_SANITIZE: new RegExp(`[^${LETTERS}0-9\\s.,;:¿?¡!%°+\\-_/()[\\]'""]`, 'g'),
  NUMERICO_SANITIZE: /[^0-9]/g,
};

export const ERROR_MESSAGES = {
  NOMBRE: 'Solo se permiten letras, números, espacios y acentos',
  CODIGO: 'Solo se permiten letras, números, guion y guion bajo',
  DESCRIPCION: 'Contiene caracteres especiales no permitidos',
  NUMERICO: 'Solo se permiten números',
};

const normalizeHint = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const hasAnyHint = (source: string, hints: string[]) =>
  hints.some((hint) => source.includes(hint));

export interface FieldSanitizerOptions {
  inputType?: string;
  label?: string;
  placeholder?: string;
}

const FREE_TEXT_HINTS = [
  'password',
  'contrasena',
  'contraseña',
  'correo',
  'email',
  'mail',
  'direccion',
  'dirección',
  'url',
  'link',
  'archivo',
  'foto',
  'recibo',
];

const DESCRIPTION_HINTS = [
  'descripcion',
  'descripción',
  'observacion',
  'observación',
  'comentario',
  'comentarios',
  'detalle',
  'motivo',
  'razon',
  'razón',
  'causa',
  'justificacion',
  'justificación',
];

const NUMERIC_HINTS = [
  'cue_numero',
  'numero de cuenta',
  'número de cuenta',
  'usuario id',
  'empleado id',
  'id empleado',
  'id usuario',
];

const CODE_HINTS = [
  'codigo',
  'código',
  'username',
  'referencia',
  'certificado',
  'dpi',
  'nit',
  'igss',
  'pasaporte',
  'campo',
  'tabla',
  'modulo',
  'módulo',
  'zona',
];

const NAME_HINTS = [
  'nombre',
  'apellido',
  'departamento',
  'municipio',
  'puesto',
  'rol',
  'empleado',
  'banco',
  'sede',
];

const EXEMPT_INPUT_TYPES = new Set([
  'button',
  'checkbox',
  'color',
  'date',
  'datetime-local',
  'email',
  'file',
  'hidden',
  'month',
  'number',
  'password',
  'radio',
  'range',
  'reset',
  'submit',
  'tel',
  'time',
  'url',
  'week',
]);

export const shouldSkipInputSanitization = (inputType?: string) =>
  Boolean(inputType && EXEMPT_INPUT_TYPES.has(inputType.toLowerCase()));

export const getFieldCharacterRule = (
  fieldName = '',
  options: FieldSanitizerOptions = {},
): FieldCharacterRule => {
  if (shouldSkipInputSanitization(options.inputType)) return 'free';

  const source = normalizeHint(
    [fieldName, options.label, options.placeholder].filter(Boolean).join(' '),
  );

  if (hasAnyHint(source, FREE_TEXT_HINTS)) return 'free';
  if (hasAnyHint(source, DESCRIPTION_HINTS)) return 'description';
  if (hasAnyHint(source, NUMERIC_HINTS)) return 'numeric';
  if (hasAnyHint(source, CODE_HINTS)) return 'code';
  if (hasAnyHint(source, NAME_HINTS)) return 'name';

  return options.inputType === 'textarea' ? 'description' : 'name';
};

export const sanitizeByRule = (value: string, rule: FieldCharacterRule): string => {
  switch (rule) {
    case 'name':
      return sanitizarNombre(value);
    case 'code':
      return sanitizarCodigo(value);
    case 'description':
      return sanitizarDescripcion(value);
    case 'numeric':
      return sanitizarNumerico(value);
    case 'free':
    default:
      return value;
  }
};

export const sanitizeFieldValue = (
  fieldName: string | undefined,
  value: string,
  options: FieldSanitizerOptions = {},
) => sanitizeByRule(value, getFieldCharacterRule(fieldName, options));

export const validarNombre = (valor: string): boolean => {
  if (!valor) return true;
  return PATTERNS.NOMBRE.test(valor);
};

export const validarCodigo = (valor: string): boolean => {
  if (!valor) return true;
  return PATTERNS.CODIGO.test(valor);
};

export const validarDescripcion = (valor: string): boolean => {
  if (!valor) return true;
  return PATTERNS.DESCRIPCION.test(valor);
};

export const validarNumerico = (valor: string): boolean => {
  if (!valor) return true;
  return PATTERNS.NUMERICO.test(valor);
};

export const sanitizarNombre = (valor: string): string =>
  valor.replace(REGEX_PATTERNS.NOMBRE_SANITIZE, '');

export const sanitizarCodigo = (valor: string): string =>
  valor.replace(REGEX_PATTERNS.CODIGO_SANITIZE, '');

export const sanitizarDescripcion = (valor: string): string =>
  valor.replace(REGEX_PATTERNS.DESCRIPCION_SANITIZE, '');

export const sanitizarNumerico = (valor: string): string =>
  valor.replace(REGEX_PATTERNS.NUMERICO_SANITIZE, '');

export interface FieldValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validarCampos = (
  campos: Record<string, { valor: string; tipo: 'nombre' | 'codigo' | 'descripcion' | 'numerico' }>,
): FieldValidationResult => {
  const errors: Record<string, string> = {};

  for (const [fieldName, field] of Object.entries(campos)) {
    let isValid = true;
    let errorMsg = '';

    switch (field.tipo) {
      case 'nombre':
        isValid = validarNombre(field.valor);
        errorMsg = ERROR_MESSAGES.NOMBRE;
        break;
      case 'codigo':
        isValid = validarCodigo(field.valor);
        errorMsg = ERROR_MESSAGES.CODIGO;
        break;
      case 'descripcion':
        isValid = validarDescripcion(field.valor);
        errorMsg = ERROR_MESSAGES.DESCRIPCION;
        break;
      case 'numerico':
        isValid = validarNumerico(field.valor);
        errorMsg = ERROR_MESSAGES.NUMERICO;
        break;
    }

    if (!isValid) {
      errors[fieldName] = errorMsg;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
