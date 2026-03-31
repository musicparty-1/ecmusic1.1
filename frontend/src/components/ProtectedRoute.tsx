import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

/**
 * Wraps DJ routes — redirects to /dj/login if there is no stored session.
 * The actual token validity is enforced by the API's 401 interceptor.
 */
const ProtectedRoute = ({ children }: Props) => {
  const djData = localStorage.getItem('dj_user');
  if (!djData) {
    return <Navigate to="/dj/login" replace />;
  }

  try {
    const parsed = JSON.parse(djData);
    if (!parsed?.access_token) {
      return <Navigate to="/dj/login" replace />;
    }
  } catch {
    localStorage.removeItem('dj_user');
    return <Navigate to="/dj/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
