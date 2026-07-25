import { useRef, useState, type FormEvent } from "react";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Mail,
  Upload,
} from "lucide-react";
import {
  CERTIFICATE_TEMPLATES,
  type CertificateTemplateId,
} from "../../utils/certificate";
import { createCertificate, type CertificateRow } from "../../utils/certificateApi";
import {
  downloadBulkTemplateCsv,
  downloadBulkTemplateExcel,
  downloadCertificatePdfZip,
  downloadEmailListCsv,
  openBulkMailto,
  parseBulkCertificateFile,
  type BulkImportRow,
} from "../../utils/bulkCertificate";

type BulkCertificatePanelProps = {
  userId: string;
  defaultOrganization?: string;
  onCreated: (rows: CertificateRow[]) => void;
};

const fieldClass =
  "w-full min-h-12 rounded-full border border-white/10 bg-[var(--uw-elevated)] px-cozy text-body-md text-[var(--uw-text)] placeholder:text-[var(--uw-muted)] outline-none focus:border-[var(--uw-cyan)]/50 focus:ring-2 focus:ring-[var(--uw-cyan)]/20";

const labelClass =
  "block font-label-sm text-label-sm text-[var(--uw-muted)] mb-tight";

type RunStatus = "idle" | "parsing" | "running" | "done" | "error";

const BulkCertificatePanel = ({
  userId,
  defaultOrganization = "",
  onCreated,
}: BulkCertificatePanelProps) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [rows, setRows] = useState<BulkImportRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [trainingEventName, setTrainingEventName] = useState("");
  const [issuingOrganization, setIssuingOrganization] =
    useState(defaultOrganization);
  const [dateIssued, setDateIssued] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [template, setTemplate] =
    useState<CertificateTemplateId>("TRAINING");
  const [makePdfZip, setMakePdfZip] = useState(true);
  const [prepareEmail, setPrepareEmail] = useState(false);
  const [status, setStatus] = useState<RunStatus>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const validRows = rows.filter((r) => !r.error);
  const invalidCount = rows.length - validRows.length;

  async function handleFile(file: File | null) {
    if (!file) return;
    setStatus("parsing");
    setMessage("");
    setRows([]);
    setFileName(file.name);
    try {
      const parsed = await parseBulkCertificateFile(file);
      setRows(parsed);
      setStatus("idle");
      setMessage(
        `${parsed.length} row(s) loaded · ${parsed.filter((r) => !r.error).length} valid`,
      );
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not parse file.");
      setFileName("");
    }
  }

  async function handleRun(event: FormEvent) {
    event.preventDefault();
    if (!trainingEventName.trim() || !issuingOrganization.trim()) {
      setStatus("error");
      setMessage("Event name and issuing organization are required.");
      return;
    }
    if (validRows.length === 0) {
      setStatus("error");
      setMessage("Upload a valid spreadsheet first.");
      return;
    }

    setStatus("running");
    setMessage("");
    setProgress({ done: 0, total: validRows.length });

    const created: CertificateRow[] = [];
    const failures: string[] = [];

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const cert = await createCertificate({
          userId,
          participantName: row.name,
          participantEmail: row.email,
          trainingEventName: trainingEventName.trim(),
          dateIssued: new Date(dateIssued).toISOString(),
          issuingOrganization: issuingOrganization.trim(),
          template,
          certificateNumber: row.certificateNo,
        });
        created.push(cert);
      } catch (err) {
        failures.push(
          `Row ${row.rowIndex} (${row.name}): ${err instanceof Error ? err.message : "failed"}`,
        );
      }
      setProgress({ done: i + 1, total: validRows.length });
    }

    if (created.length > 0) {
      onCreated(created);
    }

    try {
      if (makePdfZip && created.length > 0) {
        await downloadCertificatePdfZip(created);
      }
      if (prepareEmail && created.length > 0) {
        downloadEmailListCsv(created);
        openBulkMailto(created);
      }
    } catch (err) {
      failures.push(
        err instanceof Error ? err.message : "PDF/email export failed.",
      );
    }

    if (created.length === 0) {
      setStatus("error");
      setMessage(failures[0] ?? "No certificates created.");
      return;
    }

    setStatus("done");
    setMessage(
      [
        `Created ${created.length} certificate(s).`,
        makePdfZip ? "PDF ZIP downloaded." : null,
        prepareEmail ? "Email list CSV + mailto draft opened." : null,
        failures.length ? `${failures.length} row(s) failed.` : null,
      ]
        .filter(Boolean)
        .join(" "),
    );
    if (failures.length) {
      setMessage((prev) => `${prev}\n${failures.slice(0, 5).join("\n")}`);
    }
  }

  return (
    <section className="rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)] p-cozy sm:p-roomy space-y-cozy">
      <div className="flex items-start gap-snug">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-2xl uw-gradient">
          <FileSpreadsheet size={18} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold text-body-md text-[var(--uw-text)]">
            Bulk generation
          </h2>
          <p className="mt-tight text-label-sm text-[var(--uw-muted)]">
            Upload Excel/CSV (Name, Email, Certificate No). Creates certificates,
            QR verify links, PDF ZIP, optional email list.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--uw-cyan)]/25 bg-[var(--uw-elevated)] p-cozy space-y-snug">
        <p className="font-bold text-body-md text-[var(--uw-text)]">
          Step 1 — Download Excel template
        </p>
        <p className="text-label-sm text-[var(--uw-muted)]">
          Merong sample rows na. I-edit ang <span className="text-[var(--uw-cyan)] font-bold">Data</span> sheet
          (Name, Email, Certificate No), save, then upload.
        </p>
        <ol className="grid grid-cols-1 sm:grid-cols-3 gap-snug text-[12px] text-[var(--uw-muted)]">
          <li className="rounded-xl border border-white/5 bg-[var(--uw-card)] px-snug py-snug">
            <span className="font-bold text-[var(--uw-cyan)]">1.</span> Download
            template
          </li>
          <li className="rounded-xl border border-white/5 bg-[var(--uw-card)] px-snug py-snug">
            <span className="font-bold text-[var(--uw-cyan)]">2.</span> Fill
            attendees on Data sheet
          </li>
          <li className="rounded-xl border border-white/5 bg-[var(--uw-card)] px-snug py-snug">
            <span className="font-bold text-[var(--uw-cyan)]">3.</span> Upload
            file below
          </li>
        </ol>
        <div className="flex flex-wrap gap-tight">
          <button
            type="button"
            onClick={() => downloadBulkTemplateExcel()}
            className="inline-flex min-h-11 items-center gap-tight rounded-full uw-gradient px-cozy font-bold hover:brightness-110 transition-all"
          >
            <Download size={16} aria-hidden />
            Download Excel template (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => downloadBulkTemplateCsv()}
            className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-cozy font-bold text-[var(--uw-text)] hover:bg-white/10 transition-colors"
          >
            <Download size={16} aria-hidden />
            CSV template
          </button>
        </div>
      </div>

      <form onSubmit={(e) => void handleRun(e)} className="space-y-cozy">
        <p className="font-bold text-body-md text-[var(--uw-text)]">
          Step 2 — Event details + upload
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-cozy">
          <div className="md:col-span-2">
            <label htmlFor="bulk-event" className={labelClass}>
              Training / Event name (all rows)
            </label>
            <input
              id="bulk-event"
              required
              value={trainingEventName}
              onChange={(e) => setTrainingEventName(e.target.value)}
              maxLength={240}
              className={fieldClass}
              placeholder="DICT Digital Literacy Training"
            />
          </div>
          <div>
            <label htmlFor="bulk-org" className={labelClass}>
              Issuing organization
            </label>
            <input
              id="bulk-org"
              required
              value={issuingOrganization}
              onChange={(e) => setIssuingOrganization(e.target.value)}
              maxLength={200}
              className={fieldClass}
              placeholder="PinaLink Academy"
            />
          </div>
          <div>
            <label htmlFor="bulk-date" className={labelClass}>
              Date issued
            </label>
            <input
              id="bulk-date"
              type="date"
              required
              value={dateIssued}
              onChange={(e) => setDateIssued(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="bulk-template" className={labelClass}>
              Template
            </label>
            <select
              id="bulk-template"
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

        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
          className="sr-only"
          onChange={(e) => {
            void handleFile(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={status === "parsing" || status === "running"}
          className="flex w-full min-h-24 flex-col items-center justify-center gap-tight rounded-[1.25rem] border border-dashed border-white/15 bg-[var(--uw-elevated)] px-cozy py-roomy text-center hover:border-[var(--uw-cyan)]/40 transition-colors disabled:opacity-60"
        >
          <Upload size={22} className="text-[var(--uw-cyan)]" aria-hidden />
          <span className="font-bold text-[var(--uw-text)]">
            {fileName || "Upload Excel or CSV"}
          </span>
          <span className="text-[12px] text-[var(--uw-muted)]">
            Columns: Name · Email · Certificate No (optional)
          </span>
        </button>

        {rows.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="min-w-full text-left text-label-sm">
              <thead className="bg-[var(--uw-elevated)] text-[var(--uw-muted)]">
                <tr>
                  <th className="px-cozy py-snug font-bold">#</th>
                  <th className="px-cozy py-snug font-bold">Name</th>
                  <th className="px-cozy py-snug font-bold">Email</th>
                  <th className="px-cozy py-snug font-bold">Cert No</th>
                  <th className="px-cozy py-snug font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 20).map((row) => (
                  <tr
                    key={`${row.rowIndex}-${row.name}`}
                    className="border-t border-white/5"
                  >
                    <td className="px-cozy py-snug text-[var(--uw-muted)]">
                      {row.rowIndex}
                    </td>
                    <td className="px-cozy py-snug text-[var(--uw-text)]">
                      {row.name || "—"}
                    </td>
                    <td className="px-cozy py-snug text-[var(--uw-muted)]">
                      {row.email || "—"}
                    </td>
                    <td className="px-cozy py-snug font-mono-label text-[var(--uw-lime)]">
                      {row.certificateNo || "auto"}
                    </td>
                    <td
                      className={[
                        "px-cozy py-snug font-bold",
                        row.error ? "text-[#ff6b6b]" : "text-[var(--uw-cyan)]",
                      ].join(" ")}
                    >
                      {row.error ?? "OK"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 20 ? (
              <p className="px-cozy py-snug text-[12px] text-[var(--uw-muted)]">
                Showing first 20 of {rows.length}. {invalidCount} invalid row(s)
                skipped.
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-col gap-snug sm:flex-row sm:flex-wrap">
          <label className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-cozy cursor-pointer">
            <input
              type="checkbox"
              checked={makePdfZip}
              onChange={(e) => setMakePdfZip(e.target.checked)}
              className="size-4 accent-[var(--uw-cyan)]"
            />
            <span className="font-bold text-label-sm text-[var(--uw-text)]">
              Download PDF ZIP (QR on each)
            </span>
          </label>
          <label className="inline-flex min-h-11 items-center gap-tight rounded-full bg-white/5 px-cozy cursor-pointer">
            <input
              type="checkbox"
              checked={prepareEmail}
              onChange={(e) => setPrepareEmail(e.target.checked)}
              className="size-4 accent-[var(--uw-cyan)]"
            />
            <span className="inline-flex items-center gap-tight font-bold text-label-sm text-[var(--uw-text)]">
              <Mail size={14} aria-hidden />
              Optional email (CSV + mailto draft)
            </span>
          </label>
        </div>

        {status === "running" ? (
          <p className="text-body-md text-[var(--uw-muted)]" aria-live="polite">
            Creating {progress.done}/{progress.total}…
          </p>
        ) : null}

        {message ? (
          <p
            className={`text-body-md whitespace-pre-wrap ${status === "error" ? "text-[#ff6b6b]" : "text-[var(--uw-cyan)]"}`}
            role="status"
          >
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={
            status === "running" ||
            status === "parsing" ||
            validRows.length === 0
          }
          className="inline-flex min-h-12 w-full items-center justify-center gap-tight rounded-full uw-gradient px-cozy font-bold hover:brightness-110 disabled:opacity-60 transition-all"
        >
          {status === "running" ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <FileSpreadsheet size={18} aria-hidden />
          )}
          {status === "running"
            ? `Issuing ${progress.done}/${progress.total}…`
            : `Issue ${validRows.length || ""} certificate(s)`}
        </button>
      </form>
    </section>
  );
};

export default BulkCertificatePanel;
