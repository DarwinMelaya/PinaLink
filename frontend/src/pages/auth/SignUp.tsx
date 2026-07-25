import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, User, ArrowRight } from "lucide-react";

const LOGO_SRC = "/img/pinalink_logo.png";

const fieldClass =
  "w-full min-h-12 pl-11 pr-4 bg-surface-container rounded-lg border border-outline-variant text-body-md text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all";

const SignUp = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }
    if (!acceptTerms) {
      setErrorMessage("Accept the terms to continue.");
      return;
    }
    // ASSUMPTION: auth backend not wired yet — form UI only.
  }

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-surface text-on-surface font-body-md px-gutter py-roomy overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-fixed/40 via-surface to-surface"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-primary/5 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-secondary/5 blur-3xl"
        aria-hidden
      />

      <main className="w-full max-w-md mx-auto flex flex-col items-center gap-roomy animate-login-rise">
        <div className="flex flex-col items-center gap-cozy text-center">
          <Link
            to="/"
            className="rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            <img
              src={LOGO_SRC}
              alt="Pinalink"
              className="h-14 w-auto max-w-[240px] object-contain rounded-lg shadow-sm"
            />
          </Link>

          <div className="space-y-tight">
            <h1 className="font-headline-md text-headline-md text-on-surface">
              Create your account
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-sm">
              Start shortening links, generating QR codes, and tracking every
              click — free forever tier included.
            </p>
          </div>
        </div>

        <div className="w-full bg-surface-container-lowest rounded-xl border border-outline-variant soft-float p-roomy transition-standard">
          <form className="space-y-cozy" onSubmit={handleSubmit} noValidate>
            <div>
              <label
                htmlFor="signup-name"
                className="block mb-tight font-label-sm text-label-sm text-on-surface-variant"
              >
                Full Name
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
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
                className="block mb-tight font-label-sm text-label-sm text-on-surface-variant"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
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
                className="block mb-tight font-label-sm text-label-sm text-on-surface-variant"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
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
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-11 min-w-11 inline-flex items-center justify-center text-outline hover:text-on-surface transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="signup-confirm"
                className="block mb-tight font-label-sm text-label-sm text-on-surface-variant"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none"
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
                  className="absolute right-1 top-1/2 -translate-y-1/2 min-h-11 min-w-11 inline-flex items-center justify-center text-outline hover:text-on-surface transition-colors"
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
                className="mt-1 size-4 rounded border-outline-variant text-primary focus:ring-primary/20 accent-primary"
              />
              <span className="text-body-md text-on-surface-variant text-left">
                I agree to the{" "}
                <a href="#terms" className="text-primary font-bold hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#privacy"
                  className="text-primary font-bold hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            {errorMessage ? (
              <p className="text-error text-body-md" role="alert">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              className="group w-full min-h-12 bg-primary text-on-primary rounded-lg font-bold text-body-md flex items-center justify-center gap-tight hover:bg-surface-tint active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              <span>Create Free Account</span>
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </button>
          </form>

          <div className="relative my-roomy">
            <div className="border-t border-outline-variant" />
            <span className="absolute left-1/2 -translate-x-1/2 -top-2.5 bg-surface-container-lowest px-snug font-label-sm text-label-sm text-on-surface-variant">
              Or continue with
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-snug">
            <button
              type="button"
              className="min-h-12 px-cozy border border-outline-variant rounded-lg bg-surface-container-lowest hover:bg-surface-container-low active:scale-[0.98] transition-all inline-flex items-center justify-center gap-tight text-body-md font-medium text-on-surface"
            >
              <GoogleIcon />
              Google
            </button>
            <button
              type="button"
              className="min-h-12 px-cozy border border-outline-variant rounded-lg bg-surface-container-lowest hover:bg-surface-container-low active:scale-[0.98] transition-all inline-flex items-center justify-center gap-tight text-body-md font-medium text-on-surface"
            >
              <GitHubIcon />
              GitHub
            </button>
          </div>
        </div>

        <p className="text-center text-body-md text-on-surface-variant">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-primary hover:underline underline-offset-2"
          >
            Sign in
          </Link>
        </p>
      </main>

      <footer className="mt-wide text-center font-label-sm text-label-sm text-on-surface-variant">
        © 2024 Pinalink. Precision shortening for modern scale.
      </footer>
    </div>
  );
};

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

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.71-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 7.5c.85 0 1.71.12 2.51.34 1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.58 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.48A10.05 10.05 0 0 0 22 12.26C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

export default SignUp;
