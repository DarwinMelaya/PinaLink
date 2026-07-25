import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getSession } from "../../utils/authApi";
import { buildShortUrl } from "../../utils/shortLink";
import {
  listShortLinksByUser,
  type ShortLinkRow,
} from "../../utils/shortLinkApi";

type ShortenResult = {
  shortUrl: string;
  code: string;
  originalUrl: string;
};

function rowToResult(row: ShortLinkRow): ShortenResult {
  return {
    shortUrl: buildShortUrl(row.code),
    code: row.code,
    originalUrl: row.original_url,
  };
}

const UserLinksGenerated = () => {
  const session = getSession();
  const [myLinks, setMyLinks] = useState<ShortLinkRow[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setMyLinks([]);
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      setStatus("loading");
      setErrorMessage("");
      try {
        const rows = await listShortLinksByUser(session!.id);
        if (cancelled) return;
        setMyLinks(rows);
        if (rows[0]) {
          setResult(rowToResult(rows[0]));
        }
        setStatus("idle");
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Could not load your links.",
        );
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [session?.id]);

  async function handleCopy(shortUrl: string, code: string) {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopiedCode(code);
    } catch {
      setErrorMessage("Copy failed. Select the link and copy manually.");
    }
  }

  function handleDownloadQr() {
    if (!result) return;
    const svg = document.getElementById("user-links-qr");
    if (!(svg instanceof SVGElement)) return;

    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `pinalink-${result.code}.svg`;
    anchor.click();
    URL.revokeObjectURL(href);
  }

  return (
    <div className="space-y-roomy max-w-3xl">
      <div>
        <h1 className="font-headline-md text-headline-md text-on-surface">
          My Links
        </h1>
        <p className="mt-tight text-body-md text-on-surface-variant max-w-2xl">
          Links you created stay here — tap one to view the QR again.
        </p>
      </div>

      {status === "loading" ? (
        <p className="text-on-surface-variant text-body-md">
          Loading your links…
        </p>
      ) : null}

      {status === "error" ? (
        <p className="text-error text-body-md" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {status !== "loading" && myLinks.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-roomy">
          <p className="text-on-surface-variant text-body-md mb-cozy">
            No links yet. Create your first short link from the dashboard.
          </p>
          <Link
            to="/user/dashboard"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-cozy text-on-primary font-bold hover:bg-surface-tint transition-colors"
          >
            Create New Link
          </Link>
        </div>
      ) : null}

      {result && myLinks.length > 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-roomy flex flex-col md:flex-row items-center gap-roomy">
          <div className="flex-grow space-y-cozy w-full min-w-0">
            <div className="bg-surface-container rounded-lg p-cozy flex items-center justify-between gap-snug">
              <span className="font-mono-label text-primary font-bold break-all text-left">
                {result.shortUrl.replace(/^https?:\/\//, "")}
              </span>
              <button
                type="button"
                onClick={() => void handleCopy(result.shortUrl, result.code)}
                className="flex items-center gap-tight text-primary font-bold hover:underline transition-all shrink-0 min-h-11"
              >
                <span className="material-symbols-outlined text-[20px]">
                  content_copy
                </span>
                <span>
                  {copiedCode === result.code ? "Copied" : "Copy"}
                </span>
              </button>
            </div>
            <p className="text-on-surface-variant font-label-sm text-label-sm break-all">
              Opens: {result.originalUrl}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="bg-white p-snug rounded-lg border border-outline-variant shadow-sm text-center">
              <div className="w-32 h-32 mx-auto flex items-center justify-center">
                <QRCodeSVG
                  id="user-links-qr"
                  value={result.shortUrl}
                  size={128}
                  level="M"
                  includeMargin
                  title={`QR for ${result.shortUrl}`}
                />
              </div>
              <button
                type="button"
                onClick={handleDownloadQr}
                className="mt-tight font-label-sm text-label-sm text-primary font-bold flex items-center justify-center gap-tight mx-auto min-h-11"
              >
                <span className="material-symbols-outlined text-[16px]">
                  download
                </span>
                SVG QR
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {myLinks.length > 0 ? (
        <ul className="space-y-snug">
          {myLinks.map((row) => {
            const shortUrl = buildShortUrl(row.code);
            const isSelected = result?.code === row.code;
            return (
              <li key={row.id}>
                <div
                  className={`w-full rounded-lg border p-cozy transition-all min-h-11 ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant bg-surface-container-lowest"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-tight">
                    <button
                      type="button"
                      onClick={() => {
                        setResult(rowToResult(row));
                        setCopiedCode(null);
                      }}
                      className="min-w-0 text-left flex-1 rounded-md hover:opacity-90 transition-opacity"
                    >
                      <p className="font-mono-label text-primary font-bold break-all">
                        {shortUrl.replace(/^https?:\/\//, "")}
                      </p>
                      <p className="mt-tight text-on-surface-variant font-label-sm text-label-sm break-all line-clamp-2">
                        {row.original_url}
                      </p>
                      <p className="mt-tight text-on-surface-variant font-label-sm text-label-sm">
                        {new Date(row.created_at).toLocaleString()} ·{" "}
                        {row.click_count} clicks
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCopy(shortUrl, row.code)}
                      className="shrink-0 inline-flex items-center gap-tight text-primary font-bold font-label-sm text-label-sm min-h-11"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        content_copy
                      </span>
                      {copiedCode === row.code ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};

export default UserLinksGenerated;
