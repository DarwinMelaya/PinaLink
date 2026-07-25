import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  BadgeCheck,
  Ban,
  Search,
  ShieldCheck,
} from "lucide-react";
import {
  getCertificateByNumber,
  incrementVerifyCount,
  searchCertificatesByName,
  type CertificateRow,
} from "../../utils/certificateApi";
import { normalizeCertificateNumber } from "../../utils/certificate";
import {
  getCertificateBrandingByUserId,
  type CertificateBrandingRow,
} from "../../utils/certificateBrandingApi";

type LookupStatus = "idle" | "loading" | "found" | "missing" | "error";

function formatIssuedDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function ResultCard({
  cert,
  accent,
}: {
  cert: CertificateRow;
  accent: string | null;
}) {
  const revoked = cert.status === "REVOKED";
  const accentColor = accent || "var(--uw-lime)";
  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-[var(--uw-card)] p-cozy sm:p-roomy space-y-cozy">
      <div
        className={[
          "inline-flex min-h-11 items-center gap-tight rounded-full px-cozy font-bold",
          revoked ? "bg-[#ff6b6b]/15 text-[#ff6b6b]" : "",
        ].join(" ")}
        style={
          revoked
            ? undefined
            : {
                backgroundColor: `${accentColor}22`,
                color: accentColor,
              }
        }
      >
        {revoked ? <Ban size={18} aria-hidden /> : <ShieldCheck size={18} aria-hidden />}
        {revoked ? "REVOKED CERTIFICATE" : "VALID CERTIFICATE"}
      </div>

      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-cozy text-body-md">
        <div>
          <dt className="font-label-sm text-label-sm text-[var(--uw-muted)]">
            Certificate Number
          </dt>
          <dd
            className="mt-tight font-mono-label font-bold break-all"
            style={{ color: accentColor }}
          >
            {cert.certificate_number}
          </dd>
        </div>
        <div>
          <dt className="font-label-sm text-label-sm text-[var(--uw-muted)]">
            Verification Status
          </dt>
          <dd className="mt-tight font-bold text-[var(--uw-text)]">{cert.status}</dd>
        </div>
        <div>
          <dt className="font-label-sm text-label-sm text-[var(--uw-muted)]">
            Name of Participant
          </dt>
          <dd className="mt-tight font-bold text-[var(--uw-text)]">
            {cert.participant_name}
          </dd>
        </div>
        <div>
          <dt className="font-label-sm text-label-sm text-[var(--uw-muted)]">
            Training / Event Name
          </dt>
          <dd className="mt-tight text-[var(--uw-text)]">{cert.training_event_name}</dd>
        </div>
        <div>
          <dt className="font-label-sm text-label-sm text-[var(--uw-muted)]">
            Date Issued
          </dt>
          <dd className="mt-tight text-[var(--uw-text)]">
            {formatIssuedDate(cert.date_issued)}
          </dd>
        </div>
        <div>
          <dt className="font-label-sm text-label-sm text-[var(--uw-muted)]">
            Issuing Organization
          </dt>
          <dd className="mt-tight text-[var(--uw-text)]">
            {cert.issuing_organization}
          </dd>
        </div>
      </dl>

      {revoked && cert.revoke_reason ? (
        <p className="text-label-sm text-[#ff6b6b]">
          Reason: {cert.revoke_reason}
        </p>
      ) : null}
    </article>
  );
}

const VerifyCertificatePage = () => {
  const { certificateNumber: routeNumber } = useParams<{
    certificateNumber?: string;
  }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState(routeNumber ?? "");
  const [nameQuery, setNameQuery] = useState("");
  const [status, setStatus] = useState<LookupStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [cert, setCert] = useState<CertificateRow | null>(null);
  const [branding, setBranding] = useState<CertificateBrandingRow | null>(null);
  const [nameHits, setNameHits] = useState<CertificateRow[]>([]);
  const countedIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (routeNumber) setQuery(routeNumber);
  }, [routeNumber]);

  useEffect(() => {
    if (!routeNumber) {
      setStatus("idle");
      setCert(null);
      setBranding(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setStatus("loading");
      setErrorMessage("");
      setNameHits([]);
      try {
        const row = await getCertificateByNumber(routeNumber!);
        if (cancelled) return;
        if (!row) {
          setCert(null);
          setBranding(null);
          setStatus("missing");
          return;
        }
        setCert(row);
        setStatus("found");
        if (!countedIdsRef.current.has(row.id)) {
          countedIdsRef.current.add(row.id);
          void incrementVerifyCount(row.id, row.verify_count);
        }
        try {
          const brand = await getCertificateBrandingByUserId(row.user_id);
          if (!cancelled) setBranding(brand);
        } catch {
          if (!cancelled) setBranding(null);
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Verification lookup failed.",
        );
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [routeNumber]);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();
    setErrorMessage("");
    setNameHits([]);

    const number = normalizeCertificateNumber(query);
    if (number) {
      navigate(`/cert/${encodeURIComponent(number)}`);
      return;
    }

    const name = nameQuery.trim() || query.trim();
    if (!name) {
      setStatus("error");
      setErrorMessage("Enter a certificate number or participant name.");
      return;
    }

    setStatus("loading");
    try {
      const rows = await searchCertificatesByName(name);
      if (rows.length === 0) {
        setCert(null);
        setBranding(null);
        setStatus("missing");
        return;
      }
      if (rows.length === 1) {
        navigate(`/cert/${encodeURIComponent(rows[0].certificate_number)}`);
        return;
      }
      setCert(null);
      setBranding(null);
      setNameHits(rows);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Search failed.",
      );
    }
  }

  const pageTitle =
    branding?.page_title?.trim() || "Certificate Verification";
  const pageSubtitle =
    branding?.page_subtitle?.trim() ||
    "Search by certificate number or participant name. Scan a QR to land here automatically.";
  const accent = branding?.accent_color || "#00d4c5";
  const logoSrc = branding?.logo_data_url || "/img/pinalink_logo.png";
  const hasCustomLogo = Boolean(branding?.logo_data_url);

  return (
    <div className="user-workspace min-h-screen bg-[var(--uw-bg)] text-[var(--uw-text)]">
      <main className="mx-auto max-w-2xl px-cozy py-roomy space-y-roomy">
        <header className="space-y-snug text-center">
          <div
            className={[
              "mx-auto flex items-center justify-center overflow-hidden",
              hasCustomLogo
                ? "h-16 max-w-[220px] rounded-2xl bg-white/5 p-2 border border-white/10"
                : "size-12 rounded-full bg-black ring-1 ring-[var(--uw-cyan)]/40",
            ].join(" ")}
          >
            <img
              src={logoSrc}
              alt={hasCustomLogo ? pageTitle : "PinaLink"}
              className={
                hasCustomLogo
                  ? "max-h-14 max-w-full object-contain"
                  : "h-10 w-10 object-cover object-left scale-[1.85]"
              }
            />
          </div>
          <h1
            className="text-[clamp(24px,5vw,36px)] font-bold tracking-tight"
            style={
              branding?.page_title
                ? { color: accent }
                : undefined
            }
          >
            {branding?.page_title ? (
              pageTitle
            ) : (
              <span className="uw-gradient-text">{pageTitle}</span>
            )}
          </h1>
          <p className="text-body-md text-[var(--uw-muted)]">{pageSubtitle}</p>
        </header>

        <form
          onSubmit={(e) => void handleSearch(e)}
          className="rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)] p-cozy space-y-cozy"
        >
          <div>
            <label
              htmlFor="verify-number"
              className="block font-label-sm text-label-sm text-[var(--uw-muted)] mb-tight"
            >
              Certificate Number
            </label>
            <input
              id="verify-number"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="CERT-001 or ABC123XYZ"
              spellCheck={false}
              className="w-full min-h-12 rounded-full border border-white/10 bg-[var(--uw-elevated)] px-cozy text-body-md text-[var(--uw-text)] placeholder:text-[var(--uw-muted)] outline-none focus:ring-2"
              style={{ ["--tw-ring-color" as string]: `${accent}50` }}
            />
          </div>
          <div>
            <label
              htmlFor="verify-name"
              className="block font-label-sm text-label-sm text-[var(--uw-muted)] mb-tight"
            >
              Name (optional)
            </label>
            <input
              id="verify-name"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder="Juan Dela Cruz"
              className="w-full min-h-12 rounded-full border border-white/10 bg-[var(--uw-elevated)] px-cozy text-body-md text-[var(--uw-text)] placeholder:text-[var(--uw-muted)] outline-none focus:ring-2"
            />
          </div>
          <button
            type="submit"
            className="inline-flex min-h-12 w-full items-center justify-center gap-tight rounded-full px-cozy font-bold text-[var(--uw-on-accent)] hover:brightness-110 transition-all"
            style={{
              background: `linear-gradient(135deg, ${accent}, #002b5b)`,
            }}
          >
            <Search size={18} aria-hidden />
            Verify
          </button>
        </form>

        {status === "loading" ? (
          <p className="text-center text-[var(--uw-muted)]" aria-live="polite">
            Looking up certificate…
          </p>
        ) : null}

        {status === "error" || errorMessage ? (
          <p className="text-center text-[#ff6b6b]" role="alert">
            {errorMessage || "Lookup failed."}
          </p>
        ) : null}

        {status === "missing" ? (
          <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-[var(--uw-card)] p-cozy text-center space-y-snug">
            <BadgeCheck
              size={28}
              className="mx-auto text-[var(--uw-muted)]"
              aria-hidden
            />
            <p className="font-bold text-[var(--uw-text)]">Certificate not found</p>
            <p className="text-body-md text-[var(--uw-muted)]">
              Check the number and try again.
            </p>
          </div>
        ) : null}

        {status === "found" && cert ? (
          <ResultCard cert={cert} accent={branding?.accent_color ?? null} />
        ) : null}

        {nameHits.length > 1 ? (
          <div className="space-y-snug">
            <p className="font-bold text-body-md text-[var(--uw-text)]">
              Multiple matches
            </p>
            <ul className="space-y-snug">
              {nameHits.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/cert/${encodeURIComponent(row.certificate_number)}`,
                      )
                    }
                    className="w-full rounded-2xl border border-white/5 bg-[var(--uw-card)] px-cozy py-snug text-left hover:border-white/20 transition-colors min-h-14"
                  >
                    <span
                      className="font-mono-label font-bold"
                      style={{ color: accent }}
                    >
                      {row.certificate_number}
                    </span>
                    <span className="mt-tight block text-body-md text-[var(--uw-text)]">
                      {row.participant_name} · {row.training_event_name}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="text-center text-[12px] text-[var(--uw-muted)]">
          <Link to="/" className="hover:text-[var(--uw-text)] transition-colors">
            Powered by PinaLink
          </Link>
        </p>
      </main>
    </div>
  );
};

export default VerifyCertificatePage;
