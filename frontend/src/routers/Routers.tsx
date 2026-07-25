import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { LandingPage, HomePage, RedirectPage, Login, SignUp } from "../pages";

const Routers = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/s/:code" element={<RedirectPage />} />
      </Routes>
    </Router>
  );
};

export default Routers;
