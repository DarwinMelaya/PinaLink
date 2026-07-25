import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { getSession } from "../../utils/authApi";
import { buildShortUrl, normalizeUrl } from "../../utils/shortLink";
import { createShortLink } from "../../utils/shortLinkApi";

type ShortenStatus = "idle" | "loading" | "success" | "error";

type ShortenResult = {
  shortUrl: string;
  code: string;
  originalUrl: string;
};

const UserDashboard = () => {
  const [urlInput, setUrlInput] = useState("");
  const [status, setStatus] = useState<ShortenStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleShorten(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopied(false);
    setErrorMessage("");

    const current = getSession();
    if (!current) {
      setStatus("error");
      setErrorMessage("Session expired. Please log in again.");
      setResult(null);
      return;
    }

    const normalized = normalizeUrl(urlInput);
    if (!normalized) {
      setStatus("error");
      setErrorMessage("Enter a valid http(s) URL.");
      setResult(null);
      return;
    }

    setStatus("loading");
    try {
      const row = await createShortLink(normalized, current.id);
      setResult({
        shortUrl: buildShortUrl(row.code),
        code: row.code,
        originalUrl: row.original_url,
      });
      setUrlInput("");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setResult(null);
      setErrorMessage(err instanceof Error ? err.message : "Shorten failed.");
    }
  }

  async function handleCopy() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shortUrl);
      setCopied(true);
    } catch {
      setErrorMessage("Copy failed. Select the link and copy manually.");
    }
  }

  function handleDownloadQr() {
    if (!result) return;
    const svg = document.getElementById("user-pinalink-qr");
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
          Dashboard
        </h1>
        <p className="mt-tight text-body-md text-on-surface-variant max-w-2xl">
          Paste a long URL to create a short link and QR code.
        </p>
      </div>

      <form
        onSubmit={handleShorten}
        className="bg-surface-container-lowest p-roomy rounded-xl border border-outline-variant"
      >
        <label
          className="block font-label-sm text-label-sm text-on-surface-variant mb-tight"
          htmlFor="user-url-input"
        >
          Paste your long URL
        </label>
        <div className="flex flex-col sm:flex-row gap-tight sm:gap-0 sm:bg-surface-container sm:rounded-lg sm:border sm:border-outline-variant sm:focus-within:border-primary sm:focus-within:ring-4 sm:focus-within:ring-primary/10 transition-all">
          <input
            className="w-full min-h-12 px-cozy bg-surface-container sm:bg-transparent rounded-lg sm:rounded-none border border-outline-variant sm:border-0 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:focus:ring-0 sm:focus:border-transparent transition-all text-body-md outline-none"
            id="user-url-input"
            placeholder="https://example.com/your/long/path"
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            autoComplete="url"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="shrink-0 min-h-12 bg-primary text-on-primary px-roomy rounded-lg font-bold hover:bg-surface-tint active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed sm:m-base"
          >
            {status === "loading" ? "Creating..." : "Shorten"}
          </button>
        </div>

        {status === "error" && errorMessage ? (
          <p className="mt-cozy text-error text-body-md" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {result ? (
          <div
            className="mt-roomy border-t border-outline-variant pt-roomy flex flex-col md:flex-row items-center gap-roomy"
            aria-live="polite"
          >
            <div className="flex-grow space-y-cozy w-full min-w-0">
              <div className="bg-surface-container rounded-lg p-cozy flex items-center justify-between gap-snug">
                <span className="font-mono-label text-primary font-bold break-all text-left">
                  {result.shortUrl.replace(/^https?:\/\//, "")}
                </span>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="flex items-center gap-tight text-primary font-bold hover:underline transition-all shrink-0 min-h-11"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    content_copy
                  </span>
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <p className="text-on-surface-variant font-label-sm text-label-sm break-all">
                Opens: {result.originalUrl}
              </p>
              <Link
                to="/user/links-generated"
                className="inline-flex min-h-11 items-center text-primary font-bold hover:underline"
              >
                View all your links
              </Link>
            </div>
            <div className="flex-shrink-0">
              <div className="bg-white p-snug rounded-lg border border-outline-variant shadow-sm text-center">
                <div className="w-32 h-32 mx-auto flex items-center justify-center">
                  <QRCodeSVG
                    id="user-pinalink-qr"
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
      </form>
    </div>
  );
};

export default UserDashboard;
