import { Navigate, Outlet } from "react-router-dom";
import { getSession, type UserRole } from "../../utils/authApi";
import AdminLayout from "../../layout/AdminLayout";

type ProtectedRouteProps = {
  role?: UserRole;
};

const ProtectedRoute = ({ role = "ADMIN" }: ProtectedRouteProps) => {
  const session = getSession();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (role === "ADMIN" && session.role !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
};

export default ProtectedRoute;
