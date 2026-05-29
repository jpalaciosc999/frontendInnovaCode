import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

export type LookupOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type LookupSelectProps = {
  label: string;
  value: string;
  options: LookupOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  error?: boolean;
  sx?: SxProps<Theme>;
};

export default function LookupSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Buscar o seleccionar',
  required = false,
  disabled = false,
  helperText,
  error = false,
  sx,
}: LookupSelectProps) {
  const selectedOption = options.find((option) => option.value === value) ?? null;

  return (
    <Autocomplete
      fullWidth
      disablePortal
      disabled={disabled}
      options={options}
      value={selectedOption}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(option, current) => option.value === current.value}
      getOptionDisabled={(option) => Boolean(option.disabled)}
      onChange={(_, option) => onChange(option?.value ?? '')}
      noOptionsText="Sin resultados"
      clearText="Limpiar"
      openText="Abrir"
      closeText="Cerrar"
      sx={sx}
      slotProps={{
        paper: {
          sx: {
            mt: 0.5,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 18px 44px rgba(23, 32, 51, 0.14)',
          },
        },
        listbox: {
          sx: {
            py: 0.75,
            '& .MuiAutocomplete-option': {
              borderRadius: 1,
              mx: 0.75,
              my: 0.25,
              minHeight: 44,
            },
          },
        },
      }}
      renderOption={(props, option) => (
        <Box component="li" {...props} key={option.value}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {option.label}
            </Typography>
            {option.description ? (
              <Typography variant="caption" color="text.secondary">
                {option.description}
              </Typography>
            ) : null}
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          required={required}
          label={label}
          placeholder={placeholder}
          helperText={helperText}
          error={error}
        />
      )}
    />
  );
}
