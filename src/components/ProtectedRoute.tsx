import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import AccessDenied from './common/AccessDenied';

const ProtectedRoute = () => {
  const location = useLocation();
  const { canAccessPath, isAuthenticated, loadingPermissions } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (loadingPermissions) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return canAccessPath(location.pathname) ? <Outlet /> : <AccessDenied />;
};

export default ProtectedRoute;
