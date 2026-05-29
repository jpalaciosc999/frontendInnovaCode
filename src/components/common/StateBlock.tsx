import type { ReactNode } from 'react';
import { CircularProgress, Paper, Stack, Typography } from '@mui/material';

type StateBlockProps = {
  title: string;
  helper?: string;
  icon?: ReactNode;
  loading?: boolean;
};

export default function StateBlock({ title, helper, icon, loading = false }: StateBlockProps) {
  return (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        {loading ? <CircularProgress size={34} /> : icon}
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        {helper ? (
          <Typography color="text.secondary" sx={{ maxWidth: 520 }}>
            {helper}
          </Typography>
        ) : null}
      </Stack>
    </Paper>
  );
}
