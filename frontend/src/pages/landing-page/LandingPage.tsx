import { Link } from "react-router-dom";
import { ArrowRight, Link2, QrCode, BarChart3, Terminal } from "lucide-react";
import Layout from "../../layout/Layout";

const LandingPage = () => {
  return (
    <Layout>
      <section className="relative pt-wide pb-roomy overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_rgba(0,212,197,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(0,43,91,0.45),_transparent_50%)]"
          aria-hidden
        />
        <div className="max-w-container-max mx-auto px-gutter text-center uw-rise">
          <img
            src="/img/pinalink_logo.png"
            alt="Pinalink"
            className="mx-auto mb-roomy h-36 w-auto max-w-full object-contain sm:h-48 md:h-56 lg:h-64"
          />
          <h1 className="text-[clamp(28px,5vw,48px)] font-bold tracking-tight text-[var(--uw-text)] mb-cozy max-w-3xl mx-auto leading-tight">
            Shorten Your Links,{" "}
            <span className="uw-gradient-text">Expand Your Reach.</span>
          </h1>
          <p className="font-body-lg text-body-lg text-[var(--uw-muted)] max-w-2xl mx-auto mb-wide">
            Experience precision link management with Pinalink. Create branded
            aliases, generate dynamic QR codes, and track every click with
            corporate-grade analytics.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-cozy mb-wide">
            <Link
              to="/signup"
              className="uw-gradient px-wide h-14 rounded-full font-bold text-body-md hover:brightness-110 active:scale-95 transition-all shadow-[0_0_24px_rgba(0,212,197,0.25)] inline-flex items-center justify-center gap-tight"
            >
              Get Started
              <ArrowRight size={18} aria-hidden />
            </Link>
            <Link
              to="/login"
              className="bg-[var(--uw-card)] text-[var(--uw-text)] px-wide h-14 rounded-full font-bold text-body-md border border-white/10 hover:bg-[var(--uw-card-hover)] active:scale-95 transition-all inline-flex items-center justify-center"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="py-wide border-t border-white/5">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="text-center mb-wide uw-rise-delay-1">
            <h2 className="text-[clamp(22px,3vw,32px)] font-bold text-[var(--uw-text)] mb-tight uppercase tracking-tight">
              Precision Built Features
            </h2>
            <p className="text-[var(--uw-muted)] max-w-xl mx-auto">
              Scaling your digital presence requires more than just short URLs.
              It requires clarity, speed, and intelligence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter uw-rise-delay-2">
            <div className="md:col-span-8 bg-[var(--uw-card)] p-roomy rounded-[1.75rem] border border-white/5 flex flex-col md:flex-row gap-roomy transition-standard hover:border-[var(--uw-cyan)]/20">
              <div className="flex-grow min-w-0">
                <div className="w-12 h-12 uw-gradient rounded-2xl flex items-center justify-center mb-cozy">
                  <BarChart3 size={22} aria-hidden />
                </div>
                <h3 className="font-headline-md text-headline-md text-[var(--uw-text)] mb-tight">
                  Precision Analytics
                </h3>
                <p className="text-[var(--uw-muted)] mb-cozy">
                  Track every click in real-time. Understand your audience with
                  geolocation, device types, and referral source tracking. Our
                  dashboard delivers actionable insights to optimize your
                  campaigns instantly.
                </p>
                <a
                  className="text-[var(--uw-cyan)] font-bold inline-flex items-center gap-tight hover:gap-cozy transition-all min-h-11"
                  href="#features"
                >
                  Learn about data points
                  <ArrowRight size={16} aria-hidden />
                </a>
              </div>
              <div className="md:w-64 flex-shrink-0 bg-[var(--uw-elevated)] rounded-[1.25rem] overflow-hidden relative border border-white/5 min-h-40">
                <div className="absolute inset-x-0 top-0 h-8 bg-white/5 border-b border-white/5 flex items-center px-snug gap-tight">
                  <div className="w-2 h-2 rounded-full bg-[#ff6b6b]/60" />
                  <div className="w-2 h-2 rounded-full bg-[var(--uw-cyan)]/80" />
                </div>
                <div className="mt-12 p-snug">
                  <div className="h-2 w-2/3 bg-white/10 rounded-full mb-tight" />
                  <div className="h-4 w-full rounded-full mb-cozy uw-gradient opacity-80" />
                  <div className="flex gap-tight items-end h-16">
                    <div className="flex-1 bg-[var(--uw-navy)] h-[30%] rounded-t-lg" />
                    <div className="flex-1 bg-[var(--uw-cyan)]/40 h-[60%] rounded-t-lg" />
                    <div className="flex-1 bg-[var(--uw-cyan)] h-[90%] rounded-t-lg" />
                    <div className="flex-1 bg-[var(--uw-navy)]/80 h-[45%] rounded-t-lg" />
                    <div className="flex-1 bg-[var(--uw-cyan)]/70 h-[75%] rounded-t-lg" />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 bg-[var(--uw-card)] p-roomy rounded-[1.75rem] border border-white/5 transition-standard hover:border-[var(--uw-cyan)]/20">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-cozy bg-[var(--uw-navy)] text-white">
                <Link2 size={22} aria-hidden />
              </div>
              <h3 className="font-headline-md text-headline-md text-[var(--uw-text)] mb-tight">
                Custom Aliases
              </h3>
              <p className="text-[var(--uw-muted)]">
                Ditch the random strings. Use branded keywords like{" "}
                <span className="font-mono-label text-[var(--uw-cyan)]">
                  /promo24
                </span>{" "}
                to build trust and increase CTR by up to 34%.
              </p>
            </div>

            <div className="md:col-span-5 bg-[var(--uw-card)] p-roomy rounded-[1.75rem] border border-white/5 transition-standard hover:border-[var(--uw-cyan)]/20">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-cozy bg-white/10 text-[var(--uw-cyan)]">
                <QrCode size={22} aria-hidden />
              </div>
              <h3 className="font-headline-md text-headline-md text-[var(--uw-text)] mb-tight">
                QR Code Generation
              </h3>
              <p className="text-[var(--uw-muted)]">
                Instant, high-resolution QR codes for every link. Perfect for
                print materials, retail displays, and seamless bridge from
                physical to digital.
              </p>
            </div>

            <div
              id="solutions"
              className="md:col-span-7 rounded-[1.75rem] p-roomy transition-standard flex items-center gap-roomy border border-white/5 uw-gradient"
            >
              <div className="flex-grow min-w-0">
                <h3 className="font-headline-md text-headline-md mb-tight text-[var(--uw-on-accent)]">
                  Developer First API
                </h3>
                <p className="mb-cozy text-[var(--uw-on-accent)]/80">
                  Integrate shortening directly into your stack. Scale from 10
                  to 10 million links per month with our robust REST API.
                </p>
                <code className="block bg-black/25 p-snug rounded-2xl font-mono-label text-label-sm text-[var(--uw-on-accent)] overflow-x-auto">
                  {'POST /v1/shorten { "url": "..." }'}
                </code>
              </div>
              <div className="hidden lg:block shrink-0 text-[var(--uw-on-accent)]/30">
                <Terminal size={80} aria-hidden />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-wide border-t border-white/5">
        <div className="max-w-3xl mx-auto px-gutter text-center">
          <div className="inline-flex items-center gap-snug bg-[var(--uw-card)] text-[var(--uw-cyan)] px-cozy py-tight rounded-full font-label-sm text-label-sm mb-cozy border border-white/5">
            <span className="size-2 rounded-full bg-[var(--uw-cyan)]" aria-hidden />
            Ready to scale?
          </div>
          <h2 className="text-[clamp(28px,5vw,48px)] font-bold tracking-tight text-[var(--uw-text)] mb-cozy">
            Start Shortening{" "}
            <span className="uw-gradient-text">for Free.</span>
          </h2>
          <p className="font-body-lg text-body-lg text-[var(--uw-muted)] mb-wide">
            Join over 15,000 businesses using Pinalink to drive smarter traffic
            and measure every conversion.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-cozy">
            <Link
              to="/signup"
              className="uw-gradient px-wide h-14 rounded-full font-bold text-body-md hover:brightness-110 active:scale-95 transition-all shadow-[0_0_24px_rgba(0,212,197,0.25)] inline-flex items-center justify-center"
            >
              Get Started Now
            </Link>
            <a
              href="#pricing"
              className="bg-[var(--uw-card)] text-[var(--uw-text)] px-wide h-14 rounded-full font-bold text-body-md border border-white/10 hover:bg-[var(--uw-card-hover)] active:scale-95 transition-all inline-flex items-center justify-center"
            >
              View All Plans
            </a>
          </div>
          <p className="mt-cozy text-[var(--uw-muted)] font-label-sm text-label-sm">
            No credit card required for our Free Forever tier.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default LandingPage;
