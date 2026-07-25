import { useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import { buildShortUrl, normalizeUrl } from "../../utils/shortLink";
import { createShortLink } from "../../utils/shortLinkApi";

type ShortenStatus = "idle" | "loading" | "success" | "error";

type ShortenResult = {
  shortUrl: string;
  originalUrl: string;
  code: string;
};

const HomePage = () => {
  const [urlInput, setUrlInput] = useState("");
  const [status, setStatus] = useState<ShortenStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<ShortenResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleShorten(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCopied(false);
    setErrorMessage("");

    const normalized = normalizeUrl(urlInput);
    if (!normalized) {
      setStatus("error");
      setErrorMessage("Enter a valid http(s) URL.");
      setResult(null);
      return;
    }

    setStatus("loading");
    try {
      const row = await createShortLink(normalized);
      const shortUrl = buildShortUrl(row.code);
      setResult({
        shortUrl,
        originalUrl: row.original_url,
        code: row.code,
      });
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
    const svg = document.getElementById("pinalink-qr");
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
    <main className="min-h-screen bg-stone-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-xl">
        <header className="mb-8">
          <p className="text-sm font-medium tracking-wide text-teal-800 uppercase">PinaLink</p>
          <h1 className="mt-2 text-[clamp(1.5rem,4vw,2rem)] font-semibold text-stone-900">
            Shorten link + QR
          </h1>
          <p className="mt-2 max-w-prose text-[15px] text-stone-600">
            Paste long URL. Get short path like{" "}
            <span className="font-mono text-stone-800">/s/aB3xK9mQ</span> and QR code.
          </p>
        </header>

        <form onSubmit={handleShorten} className="flex flex-col gap-3">
          <label htmlFor="long-url" className="text-sm font-medium text-stone-700">
            Long URL
          </label>
          <input
            id="long-url"
            type="url"
            name="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/very/long/path"
            className="min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 text-[15px] text-stone-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/20"
            autoComplete="url"
            required
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="min-h-11 rounded-lg bg-teal-800 px-4 text-[15px] font-medium text-white hover:bg-teal-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === "loading" ? "Shortening…" : "Shorten"}
          </button>
        </form>

        {status === "error" && errorMessage ? (
          <p className="mt-4 text-[15px] text-red-700" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {result ? (
          <section className="mt-8 border-t border-stone-200 pt-8" aria-live="polite">
            <h2 className="text-lg font-semibold text-stone-900">Your short link</h2>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                readOnly
                value={result.shortUrl}
                className="min-h-11 w-full flex-1 rounded-lg border border-stone-300 bg-white px-3 font-mono text-sm text-stone-900"
                aria-label="Short URL"
              />
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-11 shrink-0 rounded-lg border border-stone-300 bg-white px-4 text-[15px] font-medium text-stone-800 hover:bg-stone-100"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="mt-2 break-all text-sm text-stone-500">
              Opens: {result.originalUrl}
            </p>

            <div className="mt-6 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <div className="rounded-lg border border-stone-200 bg-white p-4">
                <QRCodeSVG
                  id="pinalink-qr"
                  value={result.shortUrl}
                  size={180}
                  level="M"
                  includeMargin
                  title={`QR for ${result.shortUrl}`}
                />
              </div>
              <button
                type="button"
                onClick={handleDownloadQr}
                className="min-h-11 rounded-lg border border-stone-300 bg-white px-4 text-[15px] font-medium text-stone-800 hover:bg-stone-100"
              >
                Download QR (SVG)
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
};

export default HomePage;
