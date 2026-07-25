import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getShortLinkByCode, incrementClickCount } from "../../utils/shortLinkApi";

type RedirectStatus = "loading" | "missing" | "error";

const RedirectPage = () => {
  const { code } = useParams<{ code: string }>();
  const [status, setStatus] = useState<RedirectStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!code) {
      setStatus("missing");
      return;
    }

    let cancelled = false;

    async function resolve() {
      try {
        const row = await getShortLinkByCode(code!);
        if (cancelled) return;

        if (!row) {
          setStatus("missing");
          return;
        }

        void incrementClickCount(row.id, row.click_count);
        window.location.replace(row.original_url);
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Lookup failed.");
      }
    }

    void resolve();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50 px-4">
        <p className="text-[15px] text-stone-600">Opening link…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 text-center">
      <h1 className="text-xl font-semibold text-stone-900">
        {status === "missing" ? "Link not found" : "Something went wrong"}
      </h1>
      <p className="mt-2 max-w-prose text-[15px] text-stone-600">
        {status === "missing"
          ? "This short code does not exist or was removed."
          : errorMessage}
      </p>
      <Link
        to="/home"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-teal-800 px-4 text-[15px] font-medium text-white hover:bg-teal-900"
      >
        Create a short link
      </Link>
    </main>
  );
};

export default RedirectPage;
