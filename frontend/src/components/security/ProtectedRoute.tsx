import { Navigate, Outlet } from "react-router-dom";
import { getSession, homePathForRole, type UserRole } from "../../utils/authApi";
import AdminLayout from "../../layout/AdminLayout";
import UserLayout from "../../layout/UserLayout";

type ProtectedRouteProps = {
  role?: UserRole;
};

const ProtectedRoute = ({ role = "ADMIN" }: ProtectedRouteProps) => {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (session.role !== role) {
    return <Navigate to={homePathForRole(session.role)} replace />;
  }

  if (role === "ADMIN") {
    return (
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    );
  }

  return (
    <UserLayout>
      <Outlet />
    </UserLayout>
  );
};

export default ProtectedRoute;
