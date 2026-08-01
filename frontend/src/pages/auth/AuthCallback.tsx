import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  completeAuthCallback,
  homePathForRole,
} from "../../utils/authApi";

/** Handles Google OAuth + email-confirm redirects from Supabase Auth. */
const AuthCallback = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function finish() {
      try {
        const profile = await completeAuthCallback();
        if (cancelled) return;
        navigate(homePathForRole(profile.role), { replace: true });
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Could not complete sign-in.";
        // Friendly copy for the common double-exchange race
        if (/flow_state_already_used|already been used/i.test(message)) {
          setErrorMessage(
            "Google sign-in was interrupted. Close extra tabs and try again once.",
          );
        } else {
          setErrorMessage(message);
        }
      }
    }

    void finish();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const isProviderError =
    /provider|google|oauth|not enabled/i.test(errorMessage);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface text-on-surface px-gutter">
      {errorMessage ? (
        <div className="max-w-md text-center space-y-cozy">
          <p className="text-error text-body-md" role="alert">
            {errorMessage}
          </p>
          {isProviderError ? (
            <p className="text-on-surface-variant text-body-md text-left">
              Enable Google in Supabase Auth Providers. Add redirect URLs for
              both local and production, e.g.{" "}
              <code className="font-mono-label text-label-sm">
                {window.location.origin}/auth/callback
              </code>{" "}
              and{" "}
              <code className="font-mono-label text-label-sm">
                https://pina-link.vercel.app/auth/callback
              </code>
              . Set Site URL to your live domain in production.
            </p>
          ) : null}
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center font-bold text-primary hover:underline"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <p className="text-body-md text-on-surface-variant">
          Completing sign-in…
        </p>
      )}
    </div>
  );
};

export default AuthCallback;
