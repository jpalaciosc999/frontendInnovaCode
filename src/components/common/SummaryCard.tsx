import type { ReactNode } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

type SummaryCardProps = {
  title: string;
  value: ReactNode;
  helper?: string;
  icon?: ReactNode;
  tone?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
};

const toneStyles = {
  primary: { bg: 'primary.light', color: 'primary.dark' },
  success: { bg: '#dcfce7', color: '#166534' },
  warning: { bg: '#fef3c7', color: '#92400e' },
  error: { bg: '#fee2e2', color: '#991b1b' },
  neutral: { bg: '#eef3f8', color: '#2f3b4c' },
} as const;

export default function SummaryCard({ title, value, helper, icon, tone = 'primary' }: SummaryCardProps) {
  const colors = toneStyles[tone];

  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        {icon ? (
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              bgcolor: colors.bg,
              color: colors.color,
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        ) : null}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
            {value}
          </Typography>
          {helper ? (
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Paper>
  );
}
