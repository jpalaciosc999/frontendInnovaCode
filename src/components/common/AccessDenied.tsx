import { Alert, Box, Button, Paper, Typography } from '@mui/material';
import { Link } from 'react-router-dom';

type AccessDeniedProps = {
  requiredRoles?: string[];
};

function AccessDenied({ requiredRoles = [] }: AccessDeniedProps) {
  const rolesText = requiredRoles.length > 0 ? requiredRoles.join(', ') : 'un rol autorizado';

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'grid', gap: 2, justifyItems: 'start' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Acceso restringido
        </Typography>
        <Alert severity="warning">
          Tu usuario necesita {rolesText} para abrir esta vista.
        </Alert>
        <Button component={Link} to="/" variant="contained">
          Volver al inicio
        </Button>
      </Box>
    </Paper>
  );
}

export default AccessDenied;
