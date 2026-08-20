import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ isAuthenticated }: { isAuthenticated: boolean }) => {
  // If not logged in, redirect to the login page
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If logged in, render the child components
  return <Outlet />;
};

export default ProtectedRoute;
