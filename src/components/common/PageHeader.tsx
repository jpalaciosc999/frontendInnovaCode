import type { ReactNode } from 'react';
import { Box, Paper, Stack, Typography } from '@mui/material';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  meta?: ReactNode;
};

export default function PageHeader({ title, subtitle, icon, actions, meta }: PageHeaderProps) {
  return (
    <Paper
      sx={{
        p: { xs: 2, md: 2.75 },
        mb: 3,
        overflow: 'hidden',
        position: 'relative',
        '&:before': {
          content: '""',
          position: 'absolute',
          inset: '0 auto 0 0',
          width: 5,
          bgcolor: 'primary.main',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        sx={{ justifyContent: 'space-between', alignItems: { xs: 'stretch', md: 'center' } }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', minWidth: 0 }}>
          {icon ? (
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                bgcolor: 'primary.light',
                color: 'primary.dark',
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>
          ) : null}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" sx={{ fontWeight: 900 }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 860 }}>
                {subtitle}
              </Typography>
            ) : null}
            {meta ? (
              <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', rowGap: 1 }}>
                {meta}
              </Stack>
            ) : null}
          </Box>
        </Stack>

        {actions ? (
          <Box sx={{ flexShrink: 0, display: 'flex', justifyContent: { xs: 'stretch', md: 'flex-end' } }}>
            {actions}
          </Box>
        ) : null}
      </Stack>
    </Paper>
  );
}
