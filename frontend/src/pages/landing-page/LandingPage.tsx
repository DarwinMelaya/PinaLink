import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../layout/Layout";
import CtaSection from "./CtaSection";
import FeaturesSection from "./FeaturesSection";
import HeroSection from "./HeroSection";
import HowItWorksSection from "./HowItWorksSection";

const LandingPage = () => {
  const navigate = useNavigate();

  // Supabase Site URL errors land on `/` — send them to login with the message
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get("error")) return;
    navigate(`/login?${params.toString()}`, { replace: true });
  }, [navigate]);

  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CtaSection />
    </Layout>
  );
};

export default LandingPage;
