import { Navigate } from 'react-router-dom';
import { authStorage } from '../../app/auth/api';
import { GLOBAL_ROLES } from '../../constants/roles';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({ children }: Props) {
  const token = authStorage.getToken();
  const user = authStorage.getUser();

  if (!token || !user || user.role !== GLOBAL_ROLES.ADMIN) {
    return <Navigate to="/editor" replace />;
  }

  return <>{children}</>;
}
