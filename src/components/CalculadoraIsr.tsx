import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';

import { calcularISR } from '../utils/payroll';
import { formatearMoneda } from '../utils/relations';

function CalculadoraIsr() {
  const [salario, setSalario] = useState('8000');
  const calculo = useMemo(() => calcularISR(Math.max(0, Number(salario || 0))), [salario]);

  return (
    <Box sx={{ py: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
          <GavelIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h4">Calculadora ISR</Typography>
            <Typography color="text.secondary">
              Estima el ISR mensual usando la formula base aplicada en el detalle de nomina.
            </Typography>
          </Box>
        </Stack>

        <Alert severity="info" sx={{ mt: 2 }}>
          Referencia anual: renta imponible = salario anual - Q60,000 - Q48,000. Este calculo es orientativo.
        </Alert>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Salario mensual (Q)"
              type="number"
              value={salario}
              onChange={(event) => setSalario(event.target.value)}
            />
          </Grid>

          {[
            { label: 'Renta imponible anual', value: calculo.imponible, color: 'primary.main' },
            { label: 'ISR anual', value: calculo.isr_anual, color: 'warning.main' },
            { label: 'ISR mensual', value: calculo.isr_mensual, color: 'error.main' },
          ].map((item) => (
            <Grid key={item.label} size={{ xs: 12, md: 4 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                <Typography variant="h5" sx={{ color: item.color, fontWeight: 800 }}>
                  {formatearMoneda(item.value)}
                </Typography>
              </Paper>
            </Grid>
          ))}

          <Grid size={{ xs: 12 }}>
            <Alert severity={calculo.isr_mensual > 0 ? 'warning' : 'success'}>
              {calculo.detalle}
            </Alert>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

export default CalculadoraIsr;
