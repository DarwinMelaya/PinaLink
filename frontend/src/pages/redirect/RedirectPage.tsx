import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Link2Off } from "lucide-react";
import { getShortLinkByCode, incrementClickCount } from "../../utils/shortLinkApi";
import RedirectLoader from "./RedirectLoader";

type RedirectStatus = "loading" | "missing" | "error";

function hostOf(url: string): string | null {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const RedirectPage = () => {
  const { code } = useParams<{ code: string }>();
  const [status, setStatus] = useState<RedirectStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [destinationHost, setDestinationHost] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    let cancelled = false;

    async function resolve(shortCode: string) {
      try {
        const row = await getShortLinkByCode(shortCode);
        if (cancelled) return;

        if (!row) {
          setStatus("missing");
          return;
        }

        if (row.is_active === false) {
          setStatus("missing");
          setErrorMessage("This link is paused by its owner.");
          return;
        }

        if (row.expires_at && new Date(row.expires_at).getTime() <= Date.now()) {
          setStatus("missing");
          setErrorMessage("This short link has expired.");
          return;
        }

        setDestinationHost(hostOf(row.original_url));
        void incrementClickCount(row.id, row.click_count);
        window.location.replace(row.original_url);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Lookup failed.");
      }
    }

    void resolve(code);

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (code && status === "loading") {
    return <RedirectLoader code={code} destinationHost={destinationHost} />;
  }

  const isMissing = !code || status === "missing";

  return (
    <main className="user-workspace flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full border border-white/10 bg-[var(--uw-card)] text-[var(--uw-muted)]">
        <Link2Off size={24} aria-hidden />
      </span>
      <h1 className="mt-6 text-xl font-semibold text-[var(--uw-text)]">
        {isMissing ? "Link not found" : "Something went wrong"}
      </h1>
      <p className="mt-2 max-w-prose text-[15px] text-[var(--uw-muted)]">
        {isMissing
          ? errorMessage || "This short code does not exist or was removed."
          : errorMessage}
      </p>
      <Link
        to="/"
        className="mt-8 inline-flex min-h-11 items-center rounded-full uw-gradient px-6 text-[15px] font-semibold hover:brightness-110"
      >
        Create a short link
      </Link>
    </main>
  );
};

export default RedirectPage;
