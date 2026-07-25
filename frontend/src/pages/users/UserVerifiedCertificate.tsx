import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Link, NavLink } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import {
  BadgeCheck,
  Ban,
  BarChart3,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  ImagePlus,
  LayoutDashboard,
  Link2,
  Palette,
  QrCode,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
} from "lucide-react";
import { getSession } from "../../utils/authApi";
import {
  buildVerifyUrl,
  CERTIFICATE_TEMPLATES,
  displayVerifyHost,
  type CertificateTemplateId,
} from "../../utils/certificate";
import {
  createCertificate,
  deleteCertificate,
  listCertificatesByUser,
  revokeCertificate,
  type CertificateRow,
} from "../../utils/certificateApi";
import {
  getCertificateBrandingByUserId,
  readImageAsDataUrl,
  upsertCertificateBranding,
} from "../../utils/certificateBrandingApi";

type FormStatus = "idle" | "saving" | "error" | "success";

const fieldClass =
  "w-full min-h-12 rounded-full border border-white/10 bg-[var(--uw-elevated)] px-cozy text-body-md text-[var(--uw-text)] placeholder:text-[var(--uw-muted)] outline-none focus:border-[var(--uw-cyan)]/50 focus:ring-2 focus:ring-[var(--uw-cyan)]/20";

const labelClass =
  "block font-label-sm text-label-sm text-[var(--uw-muted)] mb-tight";

function formatIssuedDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function downloadQrPng(svgEl: SVGSVGElement | null, filename: string) {
  if (!svgEl) return;
  const serializer = new XMLSerializer();
  const svg = serializer.serializeToString(svgEl);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      return;
    }
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 512, 512);
    ctx.drawImage(img, 0, 0, 512, 512);
    const href = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = href;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

const UserVerifiedCertificate = () => {
  const session = getSession();
  const [certs, setCerts] = useState<CertificateRow[]>([]);
  const [loadStatus, setLoadStatus] = useState<"idle" | "loading" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formMessage, setFormMessage] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrFocusId, setQrFocusId] = useState<string | null>(null);
  const qrSvgRef = useRef<SVGSVGElement | null>(null);

  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");
  const [trainingEventName, setTrainingEventName] = useState("");
  const [issuingOrganization, setIssuingOrganization] = useState("");
  const [dateIssued, setDateIssued] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [template, setTemplate] =
    useState<CertificateTemplateId>("TRAINING");
  const [customNumber, setCustomNumber] = useState("");

  const [brandLogo, setBrandLogo] = useState<string | null>(null);
  const [brandTitle, setBrandTitle] = useState("");
  const [brandSubtitle, setBrandSubtitle] = useState("");
  const [brandAccent, setBrandAccent] = useState("#00d4c5");
  const [brandStatus, setBrandStatus] = useState<FormStatus>("idle");
  const [brandMessage, setBrandMessage] = useState("");
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const displayName = session?.name ?? "User";
  const handle = session?.email
    ? `@${session.email.split("@")[0]}`
    : "@guest";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const exampleVerifyUrl = buildVerifyUrl("ABC123XYZ");

  const totalVerifies = useMemo(
    () => certs.reduce((sum, row) => sum + (row.verify_count ?? 0), 0),
    [certs],
  );
  const validCount = useMemo(
    () => certs.filter((row) => row.status === "VALID").length,
    [certs],
  );
  const mostScanned = useMemo(() => {
    if (certs.length === 0) return null;
    return [...certs].sort((a, b) => b.verify_count - a.verify_count)[0] ?? null;
  }, [certs]);

  const qrFocus = useMemo(
    () => certs.find((row) => row.id === qrFocusId) ?? null,
    [certs, qrFocusId],
  );

  useEffect(() => {
    if (!session) {
      setCerts([]);
      return;
    }
    let cancelled = false;
    async function load() {
      setLoadStatus("loading");
      setErrorMessage("");
      try {
        const [rows, branding] = await Promise.all([
          listCertificatesByUser(session!.id),
          getCertificateBrandingByUserId(session!.id),
        ]);
        if (cancelled) return;
        setCerts(rows);
        if (branding) {
          setBrandLogo(branding.logo_data_url);
          setBrandTitle(branding.page_title ?? "");
          setBrandSubtitle(branding.page_subtitle ?? "");
          setBrandAccent(branding.accent_color ?? "#00d4c5");
        }
        setLoadStatus("idle");
      } catch (err) {
        if (cancelled) return;
        setLoadStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Could not load certificates.",
        );
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [session?.id]);

  useEffect(() => {
    if (!copiedId) return;
    const timer = window.setTimeout(() => setCopiedId(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      setFormStatus("error");
      setFormMessage("Sign in to issue certificates.");
      return;
    }
    setFormStatus("saving");
    setFormMessage("");
    try {
      const row = await createCertificate({
        userId: session.id,
        participantName,
        participantEmail: participantEmail || null,
        trainingEventName,
        dateIssued: new Date(dateIssued).toISOString(),
        issuingOrganization,
        template,
        certificateNumber: customNumber || null,
      });
      setCerts((prev) => [row, ...prev]);
      setParticipantName("");
      setParticipantEmail("");
      setCustomNumber("");
      setFormStatus("success");
      setFormMessage(`Issued ${row.certificate_number}.`);
      setQrFocusId(row.id);
    } catch (err) {
      setFormStatus("error");
      setFormMessage(
        err instanceof Error ? err.message : "Could not create certificate.",
      );
    }
  }

  async function handleCopy(row: CertificateRow) {
    try {
      await navigator.clipboard.writeText(buildVerifyUrl(row.certificate_number));
      setCopiedId(row.id);
    } catch {
      setErrorMessage("Copy failed.");
    }
  }

  async function handleRevoke(row: CertificateRow) {
    if (row.status === "REVOKED") return;
    const ok = window.confirm(
      `Revoke ${row.certificate_number}? Scanners will see REVOKED.`,
    );
    if (!ok) return;
    try {
      const updated = await revokeCertificate(row.id);
      setCerts((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not revoke certificate.",
      );
    }
  }

  async function handleDelete(row: CertificateRow) {
    const ok = window.confirm(
      `Delete ${row.certificate_number}? This removes it permanently. Verify links will stop working.`,
    );
    if (!ok) return;
    try {
      await deleteCertificate(row.id);
      setCerts((prev) => prev.filter((item) => item.id !== row.id));
      setQrFocusId((current) => (current === row.id ? null : current));
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Could not delete certificate.",
      );
    }
  }

  async function handleLogoPick(file: File | null) {
    if (!file) return;
    setBrandMessage("");
    try {
      const dataUrl = await readImageAsDataUrl(file);
      setBrandLogo(dataUrl);
    } catch (err) {
      setBrandStatus("error");
      setBrandMessage(
        err instanceof Error ? err.message : "Could not read logo.",
      );
    }
  }

  async function handleSaveBranding(event: FormEvent) {
    event.preventDefault();
    if (!session) {
      setBrandStatus("error");
      setBrandMessage("Sign in to save branding.");
      return;
    }
    setBrandStatus("saving");
    setBrandMessage("");
    try {
      await upsertCertificateBranding(session.id, {
        logoDataUrl: brandLogo,
        pageTitle: brandTitle,
        pageSubtitle: brandSubtitle,
        accentColor: brandAccent,
      });
      setBrandStatus("success");
      setBrandMessage("Verification page branding saved.");
    } catch (err) {
      setBrandStatus("error");
      setBrandMessage(
        err instanceof Error ? err.message : "Could not save branding.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-roomy">
      <div className="flex flex-col gap-cozy lg:flex-row lg:items-center lg:justify-between uw-rise">
        <div className="flex flex-wrap items-center gap-tight">
          <NavLink
            to="/user/dashboard"
            className={({ isActive }) =>
              [
                "inline-flex min-h-11 items-center gap-tight rounded-full px-cozy text-body-md font-bold transition-colors",
                isActive
                  ? "uw-gradient"
                  : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
              ].join(" ")
            }
          >
            <LayoutDashboard size={16} aria-hidden />
            Dashboard
          </NavLink>
          <NavLink
            to="/user/links-generated"
            className={({ isActive }) =>
              [
                "inline-flex min-h-11 items-center gap-tight rounded-full px-cozy text-body-md font-bold transition-colors",
                isActive
                  ? "uw-gradient"
                  : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
              ].join(" ")
            }
          >
            <Link2 size={16} aria-hidden />
            My Links
          </NavLink>
          <NavLink
            to="/user/verified-certificate"
            end
            className={({ isActive }) =>
              [
                "inline-flex min-h-11 items-center gap-tight rounded-full px-cozy text-body-md font-bold transition-colors",
                isActive
                  ? "uw-gradient"
                  : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
              ].join(" ")
            }
          >
            <BadgeCheck size={16} aria-hidden />
            Certificates
          </NavLink>
        </div>

        <div className="flex items-center gap-snug self-end lg:self-auto">
          <div className="text-right min-w-0">
            <p className="font-bold text-body-md text-[var(--uw-text)] truncate">
              {displayName}
            </p>
            <p className="font-label-sm text-label-sm text-[var(--uw-muted)] truncate">
              {handle}
            </p>
          </div>
          <div
            className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--uw-card)] text-[var(--uw-lime)] font-bold ring-2 ring-white/10"
            aria-hidden
          >
            {initials || "U"}
            <span className="absolute -top-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-[#ff3b30] text-[10px] text-white font-bold">
              {certs.length > 9 ? "9+" : certs.length}
            </span>
          </div>
        </div>
      </div>

      <div className="uw-rise-delay-1">
        <h1 className="text-[clamp(28px,5vw,42px)] font-bold tracking-tight uppercase leading-none uw-gradient-text">
          Verified Certificates
        </h1>
        <p className="mt-snug text-body-md text-[var(--uw-muted)] max-w-2xl">
          Issue certificates with unique IDs and QR codes that open a public
          verification page.
        </p>
      </div>

      <section className="rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)] p-cozy sm:p-roomy space-y-cozy uw-rise-delay-2">
        <div className="flex items-start gap-snug">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl uw-gradient">
            <Sparkles size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-body-md text-[var(--uw-text)]">
              Paano siya gumagana?
            </h2>
            <p className="mt-tight text-label-sm text-[var(--uw-muted)]">
              Gumagawa ka ng certificate. Bawat isa may unique Certificate ID.
              Magge-generate ng QR Code na naka-link sa verification page.
            </p>
          </div>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-snug">
          {[
            "Gumawa ng certificate (name, event, org).",
            "Makakakuha ng unique ID + QR sa verify URL.",
            "I-scan → Certificate No, Name, Event, Date, Org, Status.",
          ].map((step, index) => (
            <li
              key={step}
              className="rounded-2xl border border-white/5 bg-[var(--uw-elevated)] px-cozy py-snug"
            >
              <p className="font-bold text-label-sm text-[var(--uw-cyan)]">
                Step {index + 1}
              </p>
              <p className="mt-tight text-[13px] text-[var(--uw-muted)] leading-snug">
                {step}
              </p>
            </li>
          ))}
        </ol>

        <div className="rounded-2xl border border-dashed border-white/15 bg-[var(--uw-elevated)] px-cozy py-snug">
          <p className="font-label-sm text-label-sm text-[var(--uw-muted)]">
            Halimbawa
          </p>
          <p className="mt-tight font-mono-label text-label-sm text-[var(--uw-lime)] font-bold break-all">
            {displayVerifyHost(exampleVerifyUrl)}
          </p>
          <Link
            to="/cert"
            className="mt-snug inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-cozy font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
          >
            <Search size={16} aria-hidden />
            Open verification portal
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
        {[
          { label: "Issued", value: certs.length },
          { label: "Valid", value: validCount },
          { label: "Verifications", value: totalVerifies },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-[1.75rem] bg-[var(--uw-card)] p-cozy border border-white/5"
          >
            <p className="font-label-sm text-label-sm text-[var(--uw-muted)] uppercase tracking-wide">
              {stat.label}
            </p>
            <p className="mt-snug text-display-lg-mobile font-display-lg text-[var(--uw-text)]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-gutter items-start">
        <form
          onSubmit={(e) => void handleCreate(e)}
          className="rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)] p-cozy sm:p-roomy space-y-cozy"
        >
          <h2 className="font-bold text-[clamp(18px,2.5vw,22px)] text-[var(--uw-text)]">
            Issue certificate
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-cozy">
            <div className="md:col-span-2">
              <label htmlFor="cert-name" className={labelClass}>
                Name of participant
              </label>
              <input
                id="cert-name"
                required
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                maxLength={200}
                className={fieldClass}
                placeholder="Juan Dela Cruz"
              />
            </div>
            <div>
              <label htmlFor="cert-email" className={labelClass}>
                Email (optional)
              </label>
              <input
                id="cert-email"
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                maxLength={255}
                className={fieldClass}
                placeholder="juan@gmail.com"
              />
            </div>
            <div>
              <label htmlFor="cert-number" className={labelClass}>
                Certificate No (optional)
              </label>
              <input
                id="cert-number"
                value={customNumber}
                onChange={(e) => setCustomNumber(e.target.value)}
                maxLength={64}
                spellCheck={false}
                className={fieldClass}
                placeholder="Auto if blank"
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="cert-event" className={labelClass}>
                Training / Event name
              </label>
              <input
                id="cert-event"
                required
                value={trainingEventName}
                onChange={(e) => setTrainingEventName(e.target.value)}
                maxLength={240}
                className={fieldClass}
                placeholder="DICT Digital Literacy Training"
              />
            </div>
            <div>
              <label htmlFor="cert-org" className={labelClass}>
                Issuing organization
              </label>
              <input
                id="cert-org"
                required
                value={issuingOrganization}
                onChange={(e) => setIssuingOrganization(e.target.value)}
                maxLength={200}
                className={fieldClass}
                placeholder="PinaLink Academy"
              />
            </div>
            <div>
              <label htmlFor="cert-date" className={labelClass}>
                Date issued
              </label>
              <input
                id="cert-date"
                type="date"
                required
                value={dateIssued}
                onChange={(e) => setDateIssued(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="cert-template" className={labelClass}>
                Template
              </label>
              <select
                id="cert-template"
                value={template}
                onChange={(e) =>
                  setTemplate(e.target.value as CertificateTemplateId)
                }
                className={fieldClass}
              >
                {CERTIFICATE_TEMPLATES.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                    className="bg-[var(--uw-card)]"
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {formMessage ? (
            <p
              className={`text-body-md ${formStatus === "error" ? "text-[#ff6b6b]" : "text-[var(--uw-cyan)]"}`}
              role="status"
            >
              {formMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={formStatus === "saving" || !session}
            className="inline-flex min-h-12 w-full items-center justify-center gap-tight rounded-full uw-gradient px-cozy font-bold hover:brightness-110 disabled:opacity-60 transition-all"
          >
            <BadgeCheck size={18} aria-hidden />
            {formStatus === "saving" ? "Issuing…" : "Issue certificate"}
          </button>
        </form>

        <aside className="rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)] p-cozy sm:p-roomy space-y-cozy xl:sticky xl:top-cozy">
          <h2 className="font-bold text-body-md text-[var(--uw-text)]">
            QR preview
          </h2>
          {qrFocus ? (
            <>
              <p className="font-mono-label text-label-sm text-[var(--uw-lime)] font-bold break-all">
                {qrFocus.certificate_number}
              </p>
              <div className="mx-auto flex size-48 items-center justify-center rounded-2xl bg-white p-snug">
                <QRCodeSVG
                  ref={qrSvgRef}
                  value={buildVerifyUrl(qrFocus.certificate_number)}
                  size={176}
                  level="M"
                  includeMargin
                />
              </div>
              <p className="text-[12px] text-[var(--uw-muted)] break-all text-center">
                {displayVerifyHost(buildVerifyUrl(qrFocus.certificate_number))}
              </p>
              <button
                type="button"
                onClick={() =>
                  downloadQrPng(
                    qrSvgRef.current,
                    `cert-${qrFocus.certificate_number}.png`,
                  )
                }
                className="inline-flex min-h-11 w-full items-center justify-center gap-tight rounded-full bg-white/5 font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
              >
                <Download size={16} aria-hidden />
                Download QR PNG
              </button>
            </>
          ) : (
            <p className="text-body-md text-[var(--uw-muted)]">
              Issue or select a certificate to preview its QR.
            </p>
          )}
        </aside>
      </div>

      {errorMessage || loadStatus === "error" ? (
        <p className="text-[#ff6b6b] text-body-md" role="alert">
          {errorMessage || "Failed to load certificates."}
        </p>
      ) : null}

      <section className="space-y-snug">
        <h2 className="font-bold text-[clamp(18px,2.5vw,22px)] text-[var(--uw-text)]">
          My certificates
        </h2>
        {loadStatus === "loading" ? (
          <p className="text-[var(--uw-muted)] text-body-md">Loading…</p>
        ) : null}
        {loadStatus !== "loading" && certs.length === 0 ? (
          <p className="rounded-[1.75rem] border border-dashed border-white/15 bg-[var(--uw-card)] p-cozy text-body-md text-[var(--uw-muted)]">
            No certificates yet. Issue your first one above.
          </p>
        ) : null}
        <ul className="space-y-snug">
          {certs.map((row) => {
            const verifyUrl = buildVerifyUrl(row.certificate_number);
            const isCopied = copiedId === row.id;
            const revoked = row.status === "REVOKED";
            return (
              <li
                key={row.id}
                className="rounded-[1.5rem] border border-white/5 bg-[var(--uw-card)] p-cozy"
              >
                <div className="flex flex-col gap-snug sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-tight">
                      <p className="font-mono-label font-bold text-[var(--uw-lime)]">
                        {row.certificate_number}
                      </p>
                      <span
                        className={[
                          "inline-flex min-h-8 items-center rounded-full px-snug text-label-sm font-bold",
                          revoked
                            ? "bg-[#ff6b6b]/15 text-[#ff6b6b]"
                            : "bg-[var(--uw-lime)]/15 text-[var(--uw-lime)]",
                        ].join(" ")}
                      >
                        {row.status}
                      </span>
                    </div>
                    <p className="mt-tight font-bold text-body-md text-[var(--uw-text)]">
                      {row.participant_name}
                    </p>
                    <p className="text-label-sm text-[var(--uw-muted)]">
                      {row.training_event_name} · {formatIssuedDate(row.date_issued)}{" "}
                      · {row.verify_count} scans
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-tight">
                    <button
                      type="button"
                      onClick={() => void handleCopy(row)}
                      className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-snug font-bold text-[var(--uw-lime)] hover:bg-white/10 transition-colors"
                    >
                      {isCopied ? <Check size={16} /> : <Copy size={16} />}
                      {isCopied ? "Copied" : "Copy link"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrFocusId(row.id)}
                      className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-snug font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
                    >
                      <QrCode size={16} />
                      QR
                    </button>
                    <a
                      href={verifyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-snug font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
                    >
                      <ShieldCheck size={16} />
                      Verify
                    </a>
                    {!revoked ? (
                      <button
                        type="button"
                        onClick={() => void handleRevoke(row)}
                        className="inline-flex min-h-11 items-center gap-tight rounded-full border border-[#ff6b6b]/30 px-snug font-bold text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-colors"
                      >
                        <Ban size={16} />
                        Revoke
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void handleDelete(row)}
                      className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-snug font-bold text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-colors"
                      aria-label={`Delete ${row.certificate_number}`}
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)] p-cozy sm:p-roomy space-y-cozy">
        <div className="flex items-start gap-snug">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/5 text-[var(--uw-cyan)]">
            <Palette size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="font-bold text-body-md text-[var(--uw-text)]">
              Customize verification page
            </h2>
            <p className="mt-tight text-label-sm text-[var(--uw-muted)]">
              Iba-ibang org? Mag-upload ng logo, title, at accent color. Lumabas
              ito kapag na-scan ang QR ng certificates mo.
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => void handleSaveBranding(e)}
          className="grid grid-cols-1 md:grid-cols-2 gap-cozy"
        >
          <div className="md:col-span-2">
            <p className={labelClass}>Organization logo</p>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="sr-only"
              onChange={(e) => {
                void handleLogoPick(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
            <div className="flex flex-col sm:flex-row gap-snug items-start">
              <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[var(--uw-elevated)] overflow-hidden">
                {brandLogo ? (
                  <img
                    src={brandLogo}
                    alt="Org logo preview"
                    className="max-h-full max-w-full object-contain p-2"
                  />
                ) : (
                  <ImagePlus
                    size={24}
                    className="text-[var(--uw-muted)]"
                    aria-hidden
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-tight">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-cozy font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
                >
                  <ImagePlus size={16} aria-hidden />
                  {brandLogo ? "Replace logo" : "Upload logo"}
                </button>
                {brandLogo ? (
                  <button
                    type="button"
                    onClick={() => setBrandLogo(null)}
                    className="inline-flex min-h-11 items-center gap-tight rounded-full border border-[#ff6b6b]/30 px-cozy font-bold text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-colors"
                  >
                    <Trash2 size={16} aria-hidden />
                    Remove
                  </button>
                ) : null}
              </div>
            </div>
            <p className="mt-tight text-[12px] text-[var(--uw-muted)]">
              PNG, JPG, WebP, or SVG · max 400KB
            </p>
          </div>

          <div>
            <label htmlFor="brand-title" className={labelClass}>
              Page title
            </label>
            <input
              id="brand-title"
              value={brandTitle}
              onChange={(e) => setBrandTitle(e.target.value)}
              maxLength={120}
              className={fieldClass}
              placeholder="DICT Certificate Verification"
            />
          </div>
          <div>
            <label htmlFor="brand-accent" className={labelClass}>
              Accent color
            </label>
            <div className="flex items-center gap-tight">
              <input
                id="brand-accent"
                type="color"
                value={brandAccent}
                onChange={(e) => setBrandAccent(e.target.value)}
                className="size-12 shrink-0 cursor-pointer rounded-full border border-white/10 bg-transparent p-1"
                aria-label="Accent color picker"
              />
              <input
                value={brandAccent}
                onChange={(e) => setBrandAccent(e.target.value)}
                maxLength={7}
                spellCheck={false}
                className={fieldClass}
                placeholder="#00d4c5"
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="brand-subtitle" className={labelClass}>
              Subtitle
            </label>
            <input
              id="brand-subtitle"
              value={brandSubtitle}
              onChange={(e) => setBrandSubtitle(e.target.value)}
              maxLength={240}
              className={fieldClass}
              placeholder="Official verification portal for DICT trainees"
            />
          </div>

          {brandMessage ? (
            <p
              className={`md:col-span-2 text-body-md ${brandStatus === "error" ? "text-[#ff6b6b]" : "text-[var(--uw-cyan)]"}`}
              role="status"
            >
              {brandMessage}
            </p>
          ) : null}

          <div className="md:col-span-2 flex flex-col sm:flex-row gap-tight">
            <button
              type="submit"
              disabled={brandStatus === "saving" || !session}
              className="inline-flex min-h-12 flex-1 items-center justify-center gap-tight rounded-full uw-gradient px-cozy font-bold hover:brightness-110 disabled:opacity-60 transition-all"
            >
              <Palette size={16} aria-hidden />
              {brandStatus === "saving" ? "Saving…" : "Save branding"}
            </button>
            <Link
              to="/cert"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-tight rounded-full bg-white/5 px-cozy font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
            >
              <Search size={16} aria-hidden />
              Preview portal
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)] p-cozy sm:p-roomy space-y-cozy">
        <h2 className="font-bold text-body-md text-[var(--uw-text)]">
          Features
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-snug">
          <li className="rounded-2xl border border-white/5 bg-[var(--uw-elevated)] px-cozy py-snug">
            <p className="inline-flex items-center gap-tight font-bold text-label-sm text-[var(--uw-cyan)]">
              <FileSpreadsheet size={14} aria-hidden />
              Bulk generation
            </p>
            <p className="mt-tight text-[12px] text-[var(--uw-muted)]">
              Coming soon — Excel upload (Name, Email, Certificate No), auto QR +
              PDF, optional email.
            </p>
          </li>
          <li className="rounded-2xl border border-white/5 bg-[var(--uw-elevated)] px-cozy py-snug">
            <p className="inline-flex items-center gap-tight font-bold text-label-sm text-[var(--uw-cyan)]">
              <Search size={14} aria-hidden />
              Verification portal
            </p>
            <p className="mt-tight text-[12px] text-[var(--uw-muted)]">
              Live — search by certificate number or name at{" "}
              <Link to="/cert" className="text-[var(--uw-lime)] font-bold">
                /cert
              </Link>
              .
            </p>
          </li>
          <li className="rounded-2xl border border-white/5 bg-[var(--uw-elevated)] px-cozy py-snug">
            <p className="inline-flex items-center gap-tight font-bold text-label-sm text-[var(--uw-cyan)]">
              <Ban size={14} aria-hidden />
              Revocation
            </p>
            <p className="mt-tight text-[12px] text-[var(--uw-muted)]">
              Live — revoke any certificate; scanners see REVOKED immediately.
            </p>
          </li>
          <li className="rounded-2xl border border-white/5 bg-[var(--uw-elevated)] px-cozy py-snug">
            <p className="inline-flex items-center gap-tight font-bold text-label-sm text-[var(--uw-cyan)]">
              <BadgeCheck size={14} aria-hidden />
              Templates
            </p>
            <p className="mt-tight text-[12px] text-[var(--uw-muted)]">
              Live types: Seminar, Training, Webinar, Competition, Recognition.
              Designer UI coming soon.
            </p>
          </li>
          <li className="rounded-2xl border border-white/5 bg-[var(--uw-elevated)] px-cozy py-snug sm:col-span-2 lg:col-span-1">
            <p className="inline-flex items-center gap-tight font-bold text-label-sm text-[var(--uw-cyan)]">
              <BarChart3 size={14} aria-hidden />
              Analytics
            </p>
            <p className="mt-tight text-[12px] text-[var(--uw-muted)]">
              Live counts above. Most scanned:{" "}
              {mostScanned
                ? `${mostScanned.certificate_number} (${mostScanned.verify_count})`
                : "—"}
              . Scan locations coming soon.
            </p>
          </li>
        </ul>
      </section>
    </div>
  );
};

export default UserVerifiedCertificate;
