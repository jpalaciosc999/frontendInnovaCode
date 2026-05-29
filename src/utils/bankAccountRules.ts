export type AccountTypeCode = 'MON' | 'AHO' | 'COR' | string;

export type BankAccountRule = {
  min: number;
  max: number;
  exact?: number;
  startsWith?: string[];
  note: string;
};

const DEFAULT_RULE: BankAccountRule = {
  min: 6,
  max: 20,
  note: 'Formato generico: entre 6 y 20 digitos. Confirma el formato exacto con el banco.',
};

const exact = (digits: number, note: string, startsWith?: string[]): BankAccountRule => ({
  min: digits,
  max: digits,
  exact: digits,
  startsWith,
  note,
});

const range = (min: number, max: number, note: string, startsWith?: string[]): BankAccountRule => ({
  min,
  max,
  startsWith,
  note,
});

// Basado en formatos de cuenta del diccionario ACH para Guatemala.
const BANK_RULES: Record<string, Partial<Record<'MON' | 'AHO' | 'COR', BankAccountRule>>> = {
  'Banco Industrial (BI)': {
    MON: exact(10, 'BI monetaria: 10 digitos; incluye ceros iniciales si aplica.'),
    COR: exact(10, 'BI corriente/monetaria: 10 digitos; incluye ceros iniciales si aplica.'),
    AHO: exact(7, 'BI ahorros: usa los ultimos 7 digitos de la libreta.'),
  },
  'Banco de Desarrollo Rural (Banrural)': {
    MON: exact(10, 'Banrural monetaria GTQ: 10 digitos, normalmente inicia con 3.', ['3']),
    COR: exact(10, 'Banrural corriente/monetaria: 10 digitos.', ['3']),
    AHO: exact(10, 'Banrural ahorros GTQ: 10 digitos, normalmente inicia con 8.', ['8']),
  },
  'Banco Agromercantil (BAM)': {
    MON: exact(12, 'BAM monetaria: 12 digitos, incluye ceros no representativos.'),
    COR: exact(12, 'BAM corriente/monetaria: 12 digitos.'),
    AHO: exact(12, 'BAM ahorros: 12 digitos, incluye ceros no representativos.'),
  },
  'Banco G&T Continental': {
    MON: exact(11, 'G&T: 11 digitos sin guiones.'),
    COR: exact(11, 'G&T: 11 digitos sin guiones.'),
    AHO: exact(11, 'G&T: 11 digitos sin guiones.'),
  },
  'Banco de los Trabajadores (Bantrab)': {
    MON: exact(11, 'Bantrab monetaria: 11 digitos.'),
    COR: exact(11, 'Bantrab corriente/monetaria: 11 digitos.'),
    AHO: exact(11, 'Bantrab ahorros: 11 digitos.'),
  },
  'Banco Inmobiliario': {
    MON: exact(10, 'Banco Inmobiliario monetaria: 10 digitos.'),
    COR: exact(10, 'Banco Inmobiliario corriente/monetaria: 10 digitos.'),
    AHO: exact(10, 'Banco Inmobiliario ahorros: 10 digitos.'),
  },
  'Banco Promerica': {
    MON: exact(12, 'Promerica monetaria: 12 digitos.'),
    COR: exact(12, 'Promerica corriente/monetaria: 12 digitos.'),
    AHO: exact(12, 'Promerica ahorros: 12 digitos.'),
  },
  'Banco de America Central (BAC)': {
    MON: range(9, 10, 'BAC monetaria: 9 o 10 digitos segun producto.'),
    COR: range(9, 10, 'BAC corriente/monetaria: 9 o 10 digitos segun producto.'),
    AHO: range(9, 11, 'BAC ahorros: 9, 10 u 11 digitos segun producto.'),
  },
};

export const getBankAccountRule = (bankName: string, accountType: AccountTypeCode): BankAccountRule => {
  const bankRules = BANK_RULES[bankName];
  const normalizedType = accountType === 'COR' ? 'COR' : accountType === 'AHO' ? 'AHO' : 'MON';
  return bankRules?.[normalizedType] ?? DEFAULT_RULE;
};

export const getBankAccountHelperText = (bankName: string, accountType: AccountTypeCode) =>
  getBankAccountRule(bankName, accountType).note;

export const validateBankAccountNumber = (
  value: string,
  bankName: string,
  accountType: AccountTypeCode,
): string => {
  if (!value) return '';
  if (!/^\d+$/.test(value)) return 'El numero de cuenta debe contener solo digitos.';

  const rule = getBankAccountRule(bankName, accountType);
  if (value.length < rule.min || value.length > rule.max) {
    return rule.exact
      ? `Este banco requiere exactamente ${rule.exact} digitos.`
      : `Este banco permite entre ${rule.min} y ${rule.max} digitos.`;
  }

  if (rule.startsWith?.length && !rule.startsWith.some((prefix) => value.startsWith(prefix))) {
    return `Este formato normalmente inicia con ${rule.startsWith.join(' o ')}.`;
  }

  return '';
};

export const limitBankAccountNumber = (
  value: string,
  bankName: string,
  accountType: AccountTypeCode,
) => value.replace(/\D+/g, '').slice(0, getBankAccountRule(bankName, accountType).max);
