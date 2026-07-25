import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  LandingPage,
  Login,
  SignUp,
  AuthCallback,
  AdminDashboard,
  AdminUser,
  RedirectPage,
} from "../pages";
import ProtectedRoute from "../components/security/ProtectedRoute";
import AdminPlaceholder from "../pages/admin/AdminPlaceholder";

const Routers = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/s/:code" element={<RedirectPage />} />
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Admin console — sidebar layout via ProtectedRoute */}
        <Route path="/admin" element={<ProtectedRoute role="ADMIN" />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="user" element={<AdminUser />} />
          <Route
            path="analytics"
            element={<AdminPlaceholder title="Analytics" />}
          />
          <Route
            path="settings"
            element={<AdminPlaceholder title="Settings" />}
          />
        </Route>
      </Routes>
    </Router>
  );
};

export default Routers;
