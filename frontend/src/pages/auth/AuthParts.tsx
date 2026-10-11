import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const LOGO_SRC = "/img/pinalink_logo.png";

const INPUT_CLASS =
  "block w-full min-h-11 rounded-xl border border-white/10 bg-[var(--uw-elevated)] px-3.5 text-[15px] text-[var(--uw-text)] placeholder:text-[var(--uw-muted)]/70 outline-none transition-colors hover:border-white/20 focus:border-[var(--uw-cyan)]/60 focus:ring-2 focus:ring-[var(--uw-cyan)]/15";

const LABEL_CLASS = "mb-1.5 block text-sm font-medium text-[var(--uw-text)]";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export const AuthLayout = ({ title, description, children, footer }: AuthLayoutProps) => (
  <div className="user-workspace flex min-h-dvh flex-col px-gutter py-cozy font-body-md">
    <header className="mx-auto w-full max-w-[400px]">
      <Link
        to="/"
        className="inline-flex min-h-11 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--uw-cyan)]/40"
      >
        <img src={LOGO_SRC} alt="Pinalink home" className="h-9 w-auto object-contain" />
      </Link>
    </header>

    <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-roomy">
      <h1 className="text-[clamp(24px,4vw,28px)] font-semibold tracking-tight text-[var(--uw-text)]">
        {title}
      </h1>
      <p className="mt-2 text-[15px] leading-6 text-[var(--uw-muted)]">{description}</p>

      <div className="mt-8 rounded-2xl border border-white/[0.06] bg-[var(--uw-card)] p-6 sm:p-8">
        {children}
      </div>

      <p className="mt-6 text-center text-sm text-[var(--uw-muted)]">{footer}</p>
    </main>
  </div>
);

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
};

export const TextField = ({ id, label, className = "", ...inputProps }: TextFieldProps) => (
  <div>
    <label htmlFor={id} className={LABEL_CLASS}>
      {label}
    </label>
    <input id={id} className={`${INPUT_CLASS} ${className}`} {...inputProps} />
  </div>
);

type PasswordFieldProps = Omit<TextFieldProps, "type">;

export const PasswordField = ({ id, label, ...inputProps }: PasswordFieldProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`${INPUT_CLASS} pr-12`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((prev) => !prev)}
          className="absolute right-0.5 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--uw-muted)] transition-colors hover:text-[var(--uw-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--uw-cyan)]/40"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
        </button>
      </div>
    </div>
  );
};

type SubmitButtonProps = {
  loading: boolean;
  disabled: boolean;
  children: ReactNode;
};

export const SubmitButton = ({ loading, disabled, children }: SubmitButtonProps) => (
  <button
    type="submit"
    disabled={disabled}
    className="inline-flex min-h-11 w-full items-center justify-center gap-tight rounded-xl bg-[var(--uw-cyan)] px-4 text-[15px] font-semibold text-[var(--uw-on-accent)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--uw-cyan)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--uw-card)] disabled:cursor-not-allowed disabled:opacity-60"
  >
    {loading ? <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden /> : null}
    {children}
  </button>
);

type GoogleButtonProps = {
  onClick: () => void;
  loading: boolean;
  disabled: boolean;
};

export const GoogleButton = ({ onClick, loading, disabled }: GoogleButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="inline-flex min-h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-white/10 bg-transparent px-4 text-[15px] font-medium text-[var(--uw-text)] transition-colors hover:bg-[var(--uw-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--uw-cyan)]/40 disabled:cursor-not-allowed disabled:opacity-60"
  >
    <GoogleIcon />
    {loading ? "Redirecting…" : "Continue with Google"}
  </button>
);

export const OrDivider = () => (
  <div className="my-6 flex items-center gap-3 text-xs text-[var(--uw-muted)]" role="separator">
    <span className="h-px flex-1 bg-white/10" />
    or
    <span className="h-px flex-1 bg-white/10" />
  </div>
);

type FormErrorProps = {
  message: string;
};

export const FormError = ({ message }: FormErrorProps) =>
  message ? (
    <p
      className="rounded-xl border border-[#ff6b6b]/25 bg-[#ff6b6b]/10 px-3.5 py-2.5 text-sm text-[#ff9b9b]"
      role="alert"
    >
      {message}
    </p>
  ) : null;

type TextLinkProps = {
  to: string;
  children: ReactNode;
};

export const TextLink = ({ to, children }: TextLinkProps) => (
  <Link
    to={to}
    className="font-medium text-[var(--uw-cyan)] underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
  >
    {children}
  </Link>
);

const GoogleIcon = () => (
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
