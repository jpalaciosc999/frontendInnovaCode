import { memo, useEffect, useState } from 'react';
import { TextField } from '@mui/material';

type DigitFieldProps = {
  label: string;
  name: string;
  value: string;
  maxLength: number;
  helperText?: string;
  required?: boolean;
  onValueChange: (name: string, value: string) => void;
};

const onlyDigits = (value: string, maxLength: number) =>
  value.replace(/\D+/g, '').slice(0, maxLength);

function DigitField({
  label,
  name,
  value,
  maxLength,
  helperText,
  required = false,
  onValueChange,
}: DigitFieldProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = (nextValue = draft) => {
    const sanitized = onlyDigits(nextValue, maxLength);
    if (sanitized !== value) onValueChange(name, sanitized);
  };

  return (
    <TextField
      fullWidth
      label={label}
      name={name}
      type="tel"
      value={draft}
      onChange={(event) => {
        setDraft(onlyDigits(event.target.value, maxLength));
      }}
      onBlur={() => commit()}
      required={required}
      helperText={helperText}
      slotProps={{
        htmlInput: {
          inputMode: 'numeric',
          pattern: '[0-9]*',
          maxLength,
        },
      }}
    />
  );
}

export default memo(DigitField);
