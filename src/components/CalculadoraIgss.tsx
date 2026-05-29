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
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';

import { TASA_IGSS_LABORAL, TASA_IGSS_PATRONAL } from '../utils/payroll';
import { formatearMoneda } from '../utils/relations';

function CalculadoraIgss() {
  const [salario, setSalario] = useState('4000');

  const calculo = useMemo(() => {
    const salarioBase = Math.max(0, Number(salario || 0));
    return {
      salarioBase,
      laboral: salarioBase * TASA_IGSS_LABORAL,
      patronal: salarioBase * TASA_IGSS_PATRONAL,
      total: salarioBase * (TASA_IGSS_LABORAL + TASA_IGSS_PATRONAL),
    };
  }, [salario]);

  return (
    <Box sx={{ py: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ alignItems: { md: 'center' } }}>
          <HealthAndSafetyIcon color="primary" fontSize="large" />
          <Box>
            <Typography variant="h4">Calculadora IGSS</Typography>
            <Typography color="text.secondary">
              Estima la cuota laboral y patronal con las mismas tasas usadas por los reportes de nomina.
            </Typography>
          </Box>
        </Stack>

        <Alert severity="info" sx={{ mt: 2 }}>
          Tasa laboral: {(TASA_IGSS_LABORAL * 100).toFixed(2)}%. Tasa patronal: {(TASA_IGSS_PATRONAL * 100).toFixed(2)}%.
        </Alert>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Salario afecto (Q)"
              type="number"
              value={salario}
              onChange={(event) => setSalario(event.target.value)}
            />
          </Grid>

          {[
            { label: 'IGSS laboral', value: calculo.laboral, color: 'error.main' },
            { label: 'IGSS patronal', value: calculo.patronal, color: 'primary.main' },
            { label: 'Total IGSS', value: calculo.total, color: 'success.main' },
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
        </Grid>
      </Paper>
    </Box>
  );
}

export default CalculadoraIgss;
