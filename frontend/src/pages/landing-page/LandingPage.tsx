import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import Layout from "../../layout/Layout";
import { buildShortUrl, normalizeUrl } from "../../utils/shortLink";
import { createShortLink } from "../../utils/shortLinkApi";

type ShortenStatus = "idle" | "loading" | "success" | "error";

type ShortenResult = {
  shortUrl: string;
  code: string;
};

const LandingPage = () => {
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
      setResult({
        shortUrl: buildShortUrl(row.code),
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
    const svg = document.getElementById("landing-pinalink-qr");
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
    <Layout>
      <section className="relative pt-wide pb-roomy overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-fixed/20 via-transparent to-transparent" />
        <div className="max-w-container-max mx-auto px-gutter text-center">
          <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-cozy max-w-3xl mx-auto">
            Shorten Your Links,{" "}
            <span className="text-primary">Expand Your Reach.</span>
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-wide">
            Experience precision link management with Pinalink. Create branded
            aliases, generate dynamic QR codes, and track every click with
            corporate-grade analytics.
          </p>

          <div className="max-w-3xl mx-auto mb-wide">
            <form
              onSubmit={handleShorten}
              className="bg-surface-container-lowest p-roomy rounded-xl soft-float border border-outline-variant transition-standard text-left"
            >
              <label
                className="block font-label-sm text-label-sm text-on-surface-variant mb-tight"
                htmlFor="url-input"
              >
                Paste your long URL
              </label>
              <div className="flex flex-col sm:flex-row gap-tight sm:gap-0 sm:bg-surface-container sm:rounded-lg sm:border sm:border-outline-variant sm:focus-within:border-primary sm:focus-within:ring-4 sm:focus-within:ring-primary/10 transition-all">
                <input
                  className="w-full min-h-12 px-cozy bg-surface-container sm:bg-transparent rounded-lg sm:rounded-none border border-outline-variant sm:border-0 focus:border-primary focus:ring-4 focus:ring-primary/10 sm:focus:ring-0 sm:focus:border-transparent transition-all text-body-md outline-none"
                  id="url-input"
                  placeholder="https://very-long-and-complex-corporate-url.com/data/analytics/reports/2024"
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
                  id="shorten-result"
                  aria-live="polite"
                >
                  <div className="flex-grow space-y-cozy w-full min-w-0">
                    <div className="bg-surface-container rounded-lg p-cozy flex items-center justify-between gap-snug group">
                      <span className="font-mono-label text-primary font-bold break-all text-left">
                        {result.shortUrl.replace(/^https?:\/\//, "")}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center gap-tight text-primary font-bold hover:underline transition-all shrink-0 min-h-11"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          content_copy
                        </span>
                        <span>{copied ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-snug flex-wrap">
                      <span className="bg-secondary/10 text-secondary px-snug py-tight rounded-full font-label-sm text-label-sm flex items-center gap-tight">
                        <span
                          className="material-symbols-outlined text-[16px]"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          check_circle
                        </span>
                        Link Ready
                      </span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm">
                        Short link created
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="bg-white p-snug rounded-lg border border-outline-variant shadow-sm text-center">
                      <div className="w-32 h-32 mx-auto flex items-center justify-center">
                        <QRCodeSVG
                          id="landing-pinalink-qr"
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
        </div>
      </section>

      <section id="features" className="py-wide bg-surface-container-low">
        <div className="max-w-container-max mx-auto px-gutter">
          <div className="text-center mb-wide">
            <h2 className="font-headline-md text-headline-md text-on-surface mb-tight">
              Precision Built Features
            </h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">
              Scaling your digital presence requires more than just short URLs.
              It requires clarity, speed, and intelligence.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            <div className="md:col-span-8 bg-surface-container-lowest p-roomy rounded-xl soft-float border border-outline-variant flex flex-col md:flex-row gap-roomy transition-standard">
              <div className="flex-grow min-w-0">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-cozy">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    analytics
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface mb-tight">
                  Precision Analytics
                </h3>
                <p className="text-on-surface-variant mb-cozy">
                  Track every click in real-time. Understand your audience with
                  geolocation, device types, and referral source tracking. Our
                  dashboard delivers actionable insights to optimize your
                  campaigns instantly.
                </p>
                <a
                  className="text-primary font-bold inline-flex items-center gap-tight hover:gap-cozy transition-all"
                  href="#features"
                >
                  Learn about data points{" "}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </a>
              </div>
              <div className="md:w-64 flex-shrink-0 bg-surface-container rounded-lg overflow-hidden relative border border-outline-variant min-h-40">
                <div className="absolute inset-x-0 top-0 h-8 bg-surface-container-high border-b border-outline-variant flex items-center px-snug gap-tight">
                  <div className="w-2 h-2 rounded-full bg-error/40" />
                  <div className="w-2 h-2 rounded-full bg-secondary-container/80" />
                </div>
                <div className="mt-12 p-snug">
                  <div className="h-2 w-2/3 bg-primary-container/20 rounded mb-tight" />
                  <div className="h-4 w-full bg-primary-container rounded mb-cozy" />
                  <div className="flex gap-tight items-end h-16">
                    <div className="flex-1 bg-primary/20 h-[30%]" />
                    <div className="flex-1 bg-primary/40 h-[60%]" />
                    <div className="flex-1 bg-primary h-[90%]" />
                    <div className="flex-1 bg-primary/60 h-[45%]" />
                    <div className="flex-1 bg-primary/80 h-[75%]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-4 bg-surface-container-lowest p-roomy rounded-xl soft-float border border-outline-variant transition-standard">
              <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-lg flex items-center justify-center mb-cozy">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  label_important
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-tight">
                Custom Aliases
              </h3>
              <p className="text-on-surface-variant">
                Ditch the random strings. Use branded keywords like{" "}
                <span className="font-mono-label text-primary">/promo24</span> to
                build trust and increase CTR by up to 34%.
              </p>
            </div>

            <div className="md:col-span-5 bg-surface-container-lowest p-roomy rounded-xl soft-float border border-outline-variant transition-standard">
              <div className="w-12 h-12 bg-tertiary/10 text-tertiary rounded-lg flex items-center justify-center mb-cozy">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  qr_code_2
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-tight">
                QR Code Generation
              </h3>
              <p className="text-on-surface-variant">
                Instant, high-resolution QR codes for every link. Perfect for
                print materials, retail displays, and seamless bridge from
                physical to digital.
              </p>
            </div>

            <div
              id="solutions"
              className="md:col-span-7 bg-inverse-surface text-inverse-on-surface p-roomy rounded-xl soft-float transition-standard flex items-center gap-roomy"
            >
              <div className="flex-grow min-w-0">
                <h3 className="font-headline-md text-headline-md mb-tight">
                  Developer First API
                </h3>
                <p className="opacity-80 mb-cozy">
                  Integrate shortening directly into your stack. Scale from 10
                  to 10 million links per month with our robust REST API.
                </p>
                <code className="block bg-on-surface/20 p-snug rounded font-mono-label text-label-sm text-primary-fixed-dim overflow-x-auto">
                  {'POST /v1/shorten { "url": "..." }'}
                </code>
              </div>
              <div className="hidden lg:block shrink-0">
                <span className="material-symbols-outlined text-[80px] text-primary-fixed/20">
                  terminal
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-wide">
        <div className="max-w-3xl mx-auto px-gutter text-center">
          <div className="inline-flex items-center gap-snug bg-primary/10 text-primary px-cozy py-tight rounded-full font-label-sm text-label-sm mb-cozy">
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            Ready to scale?
          </div>
          <h2 className="font-display-lg text-display-lg-mobile md:text-display-lg text-on-surface mb-cozy">
            Start Shortening for Free.
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant mb-wide">
            Join over 15,000 businesses using Pinalink to drive smarter traffic
            and measure every conversion.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-cozy">
            <Link
              to="/signup"
              className="bg-primary text-on-primary px-wide h-14 rounded-lg font-bold text-body-md hover:bg-surface-tint active:scale-95 transition-all shadow-lg inline-flex items-center justify-center"
            >
              Get Started Now
            </Link>
            <a
              href="#pricing"
              className="bg-surface-container-highest text-on-surface px-wide h-14 rounded-lg font-bold text-body-md hover:bg-surface-variant active:scale-95 transition-all inline-flex items-center justify-center"
            >
              View All Plans
            </a>
          </div>
          <p className="mt-cozy text-on-surface-variant font-label-sm text-label-sm">
            No credit card required for our Free Forever tier.
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default LandingPage;
