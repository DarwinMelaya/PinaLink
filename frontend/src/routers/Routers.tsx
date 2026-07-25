import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import {
  LandingPage,
  HomePage,
  Login,
  SignUp,
  AuthCallback,
  AdminDashboard,
  AdminUser,
} from "../pages";

const Routers = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        {/* Auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Admin routes */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/user" element={<AdminUser />} />
      </Routes>
    </Router>
  );
};

export default Routers;
