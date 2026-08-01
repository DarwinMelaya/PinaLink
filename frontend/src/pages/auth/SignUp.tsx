import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from "lucide-react";
import { registerProfile, signInWithGoogle, homePathForRole } from "../../utils/authApi";

const LOGO_SRC = "/img/pinalink_logo.png";

const fieldClass =
  "w-full min-h-12 pl-11 pr-4 bg-[var(--uw-elevated)] rounded-full border border-white/10 text-body-md text-[var(--uw-text)] placeholder:text-[var(--uw-muted)] focus:border-[var(--uw-cyan)]/50 focus:ring-2 focus:ring-[var(--uw-cyan)]/20 outline-none transition-all";

type SubmitStatus = "idle" | "loading" | "error";

function oauthErrorFromSearch(): string | null {
  const params = new URLSearchParams(window.location.search);
  if (!params.get("error")) return null;
  const description = params.get("error_description");
  if (description) return description.replace(/\+/g, " ");
  return params.get("error");
}

const SignUp = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [oauthLoading, setOauthLoading] = useState(false);

  useEffect(() => {
    const oauthError = oauthErrorFromSearch();
    if (!oauthError) return;
    setStatus("error");
    setErrorMessage(oauthError);
    window.history.replaceState({}, document.title, window.location.pathname);
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setInfoMessage("");

    if (password !== confirmPassword) {
      setStatus("error");
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (!acceptTerms) {
      setStatus("error");
      setErrorMessage("Accept the terms to continue.");
      return;
    }

    setStatus("loading");
    try {
      await registerProfile({
        name,
        email,
        password,
        role: "USER",
      });
      navigate(homePathForRole("USER"), { replace: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed.";
      setStatus("error");
      setErrorMessage(message);
    }
  }

  async function handleGoogle() {
    setErrorMessage("");
    setInfoMessage("");
    setOauthLoading(true);
    try {
      await signInWithGoogle("USER");
    } catch (err) {
      setOauthLoading(false);
      setErrorMessage(err instanceof Error ? err.message : "Google sign-in failed.");
    }
  }

  return (
    <div className="user-workspace relative min-h-screen flex flex-col items-center justify-center font-body-md px-gutter py-roomy overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(0,212,197,0.12),_transparent_55%),radial-gradient(ellipse_at_bottom_left,_rgba(0,43,91,0.4),_transparent_50%)]"
        aria-hidden
      />

      <main className="w-full max-w-md mx-auto flex flex-col items-center gap-roomy uw-rise">
        <div className="flex flex-col items-center gap-cozy text-center">
          <Link
            to="/"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--uw-cyan)]/40"
          >
            <img
              src={LOGO_SRC}
              alt="Pinalink"
              className="h-14 w-auto max-w-[240px] object-contain"
            />
          </Link>

          <div className="space-y-tight">
            <h1 className="text-[clamp(24px,4vw,32px)] font-bold tracking-tight text-[var(--uw-text)]">
              Create your <span className="uw-gradient-text">account</span>
            </h1>
            <p className="font-body-md text-body-md text-[var(--uw-muted)] max-w-sm">
              Start shortening links, generating QR codes, and tracking every
              click — free forever tier included.
            </p>
          </div>
        </div>

        <div className="w-full bg-[var(--uw-card)] rounded-[1.75rem] border border-white/5 p-roomy uw-pop">
          <form className="space-y-cozy" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="signup-name"
                className="block mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]"
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--uw-muted)] pointer-events-none"
                  aria-hidden
                />
                <input
                  id="signup-name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-email"
                className="block mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--uw-muted)] pointer-events-none"
                  aria-hidden
                />
                <input
                  id="signup-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={fieldClass}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="block mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--uw-muted)] pointer-events-none"
                  aria-hidden
                />
                <input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`${fieldClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-11 min-w-11 inline-flex items-center justify-center text-[var(--uw-muted)] hover:text-[var(--uw-text)] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-confirm"
                className="block mb-tight font-label-sm text-label-sm text-[var(--uw-muted)]"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--uw-muted)] pointer-events-none"
                  aria-hidden
                />
                <input
                  id="signup-confirm"
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className={`${fieldClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-11 min-w-11 inline-flex items-center justify-center text-[var(--uw-muted)] hover:text-[var(--uw-text)] transition-colors"
                  aria-label={
                    showConfirm ? "Hide confirm password" : "Show confirm password"
                  }
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <label
              htmlFor="signup-terms"
              className="flex items-start gap-snug cursor-pointer select-none"
            >
              <input
                id="signup-terms"
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 size-4 rounded border-white/20 bg-[var(--uw-elevated)] text-[var(--uw-cyan)] focus:ring-[var(--uw-cyan)]/20 accent-[var(--uw-cyan)]"
              />
              <span className="text-body-md text-[var(--uw-muted)] text-left">
                I agree to the{" "}
                <a
                  href="#terms"
                  className="text-[var(--uw-cyan)] font-bold hover:underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#privacy"
                  className="text-[var(--uw-cyan)] font-bold hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            {errorMessage ? (
              <p className="text-[#ff6b6b] text-body-md" role="alert">
                {errorMessage}
              </p>
            ) : null}

            {infoMessage ? (
              <p className="text-[var(--uw-cyan)] text-body-md" role="status">
                {infoMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status === "loading" || oauthLoading}
              className="group w-full min-h-12 uw-gradient rounded-full font-bold text-body-md flex items-center justify-center gap-tight hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(0,212,197,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>
                {status === "loading" ? "Creating account..." : "Create Free Account"}
              </span>
              {status !== "loading" ? (
                <ArrowRight
                  size={18}
                  className="transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              ) : null}
            </button>
          </form>

          <div className="relative my-roomy">
            <div className="border-t border-white/10" />
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-[var(--uw-card)] px-snug font-label-sm text-label-sm text-[var(--uw-muted)]">
              Or continue with
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            disabled={oauthLoading || status === "loading"}
            className="w-full min-h-12 px-cozy border border-white/10 rounded-full bg-[var(--uw-elevated)] hover:bg-[var(--uw-card-hover)] active:scale-[0.98] transition-all inline-flex items-center justify-center gap-tight text-body-md font-medium text-[var(--uw-text)] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <GoogleIcon />
            {oauthLoading ? "Redirecting…" : "Continue with Google"}
          </button>
        </div>

        <p className="text-center text-body-md text-[var(--uw-muted)]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-[var(--uw-cyan)] hover:underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </main>

      <footer className="mt-wide text-center font-label-sm text-label-sm text-[var(--uw-muted)]">
        © 2024 Pinalink. Shorten. Share. Connect.
      </footer>
    </div>
  );
};

export default SignUp;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
