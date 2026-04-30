import { Alert, Box, Paper, Typography } from '@mui/material';

type PendingViewProps = {
  title: string;
  roleName?: string;
};

function PendingView({ title, roleName }: PendingViewProps) {
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        <Alert severity="info">
          Esta vista ya esta registrada en la navegacion
          {roleName ? ` para el rol ${roleName}` : ''}, pero aun falta conectar su componente funcional.
        </Alert>
      </Box>
    </Paper>
  );
}

export default PendingView;
