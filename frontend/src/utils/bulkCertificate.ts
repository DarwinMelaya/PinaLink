import * as XLSX from "xlsx";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { buildVerifyUrl, normalizeCertificateNumber } from "./certificate";
import type { CertificateRow } from "./certificateApi";

export const BULK_MAX_ROWS = 100;

export type BulkImportRow = {
  name: string;
  email: string | null;
  certificateNo: string | null;
  rowIndex: number;
  error: string | null;
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function pickColumn(
  headers: string[],
  aliases: string[],
): number {
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    if (aliases.includes(h)) return i;
  }
  return -1;
}

function cellString(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

/** Parse .xlsx / .xls / .csv into bulk rows. */
export async function parseBulkCertificateFile(
  file: File,
): Promise<BulkImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  // Prefer "Data" sheet from official template; else first sheet
  const sheetName =
    workbook.SheetNames.find((name) => name.toLowerCase() === "data") ??
    workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error("Spreadsheet has no sheets.");
  }
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (matrix.length < 2) {
    throw new Error("File needs a header row plus at least one data row.");
  }

  const headers = (matrix[0] ?? []).map(normalizeHeader);
  const nameIdx = pickColumn(headers, [
    "name",
    "participant",
    "participantname",
    "fullname",
  ]);
  const emailIdx = pickColumn(headers, ["email", "emailaddress"]);
  const certIdx = pickColumn(headers, [
    "certificateno",
    "certificatenumber",
    "certno",
    "certnumber",
    "certificate",
    "code",
  ]);

  if (nameIdx < 0) {
    throw new Error(
      'Missing Name column. Use headers: Name, Email, Certificate No',
    );
  }

  const rows: BulkImportRow[] = [];
  for (let i = 1; i < matrix.length; i++) {
    const line = matrix[i] ?? [];
    const name = cellString(line[nameIdx]);
    const emailRaw = emailIdx >= 0 ? cellString(line[emailIdx]) : "";
    const certRaw = certIdx >= 0 ? cellString(line[certIdx]) : "";

    if (!name && !emailRaw && !certRaw) continue;

    let error: string | null = null;
    if (!name) error = "Name is required.";
    else if (emailRaw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw)) {
      error = "Invalid email.";
    }

    let certificateNo: string | null = null;
    if (certRaw) {
      certificateNo = normalizeCertificateNumber(certRaw);
      if (!certificateNo) {
        error = error ?? "Invalid certificate number.";
      }
    }

    rows.push({
      name,
      email: emailRaw || null,
      certificateNo,
      rowIndex: i + 1,
      error,
    });
  }

  if (rows.length === 0) {
    throw new Error("No data rows found.");
  }
  if (rows.length > BULK_MAX_ROWS) {
    throw new Error(`Max ${BULK_MAX_ROWS} rows per upload.`);
  }

  return rows;
}

export function downloadBulkTemplateCsv(): void {
  const csv =
    "Name,Email,Certificate No\nJuan Dela Cruz,juan@gmail.com,CERT-001\nMaria Santos,maria@gmail.com,CERT-002\n";
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pinalink-bulk-certificates-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** Excel template with Instructions + Data sheets (sample rows). */
export function downloadBulkTemplateExcel(): void {
  const workbook = XLSX.utils.book_new();

  const instructions = XLSX.utils.aoa_to_sheet([
    ["PinaLink — Bulk Certificate Template"],
    [],
    ["Paano gamitin"],
    ["1. Open the Data sheet."],
    ["2. Keep the header row: Name | Email | Certificate No"],
    ["3. Replace sample rows with your attendees (max 100)."],
    ["4. Certificate No is optional — leave blank to auto-generate."],
    ["5. Save the file, then upload it in Bulk generation."],
    [],
    ["Required columns"],
    ["Name", "Full name of participant (required)"],
    ["Email", "Optional — used for email list / mailto"],
    ["Certificate No", "Optional — e.g. CERT-001 (letters, numbers, _ or -)"],
    [],
    ["Tips"],
    ["Do not rename the Data sheet headers."],
    ["Empty Name rows are skipped."],
    ["Upload .xlsx or .csv — both work."],
  ]);
  instructions["!cols"] = [{ wch: 22 }, { wch: 56 }];

  const data = XLSX.utils.aoa_to_sheet([
    ["Name", "Email", "Certificate No"],
    ["Juan Dela Cruz", "juan@gmail.com", "CERT-001"],
    ["Maria Santos", "maria@gmail.com", "CERT-002"],
    ["Pedro Reyes", "pedro@gmail.com", ""],
  ]);
  data["!cols"] = [{ wch: 22 }, { wch: 28 }, { wch: 18 }];

  XLSX.utils.book_append_sheet(workbook, instructions, "Instructions");
  XLSX.utils.book_append_sheet(workbook, data, "Data");

  XLSX.writeFile(workbook, "pinalink-bulk-certificates-template.xlsx");
}

export async function buildCertificatePdfBlob(
  cert: CertificateRow,
): Promise<Blob> {
  const verifyUrl = buildVerifyUrl(cert.certificate_number);
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 280,
    margin: 1,
    errorCorrectionLevel: "M",
  });

  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 48;

  pdf.setFillColor(0, 43, 91);
  pdf.rect(0, 0, pageW, 72, "F");
  pdf.setTextColor(255, 255, 255);
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("Verified Certificate", margin, 44);

  pdf.setTextColor(20, 20, 20);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  let y = 110;

  const lines: [string, string][] = [
    ["Certificate Number", cert.certificate_number],
    ["Name of Participant", cert.participant_name],
    ["Training / Event", cert.training_event_name],
    [
      "Date Issued",
      new Date(cert.date_issued).toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
    ],
    ["Issuing Organization", cert.issuing_organization],
    ["Status", cert.status],
    ["Verify URL", verifyUrl],
  ];

  for (const [label, value] of lines) {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 100, 100);
    pdf.text(label, margin, y);
    y += 16;
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(20, 20, 20);
    const wrapped = pdf.splitTextToSize(value, pageW - margin * 2);
    pdf.text(wrapped, margin, y);
    y += wrapped.length * 14 + 14;
  }

  const qrSize = 160;
  pdf.addImage(
    qrDataUrl,
    "PNG",
    pageW - margin - qrSize,
    100,
    qrSize,
    qrSize,
  );
  pdf.setFontSize(9);
  pdf.setTextColor(120, 120, 120);
  pdf.text("Scan to verify", pageW - margin - qrSize, 100 + qrSize + 14);

  return pdf.output("blob");
}

export async function downloadCertificatePdfZip(
  certs: CertificateRow[],
  zipName = "pinalink-certificates.zip",
): Promise<void> {
  const zip = new JSZip();
  for (const cert of certs) {
    const blob = await buildCertificatePdfBlob(cert);
    const safe = cert.certificate_number.replace(/[^A-Z0-9_-]/gi, "_");
    zip.file(`${safe}.pdf`, blob);
  }
  const out = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(out);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadEmailListCsv(certs: CertificateRow[]): void {
  const header = "Name,Email,Certificate No,Verify URL\n";
  const body = certs
    .filter((c) => c.participant_email)
    .map((c) => {
      const cols = [
        c.participant_name,
        c.participant_email ?? "",
        c.certificate_number,
        buildVerifyUrl(c.certificate_number),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      return cols.join(",");
    })
    .join("\n");

  const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pinalink-certificate-emails.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/** Opens a mailto draft with BCC list (browser length limits apply). */
export function openBulkMailto(certs: CertificateRow[]): void {
  const emails = certs
    .map((c) => c.participant_email?.trim())
    .filter((e): e is string => Boolean(e));
  if (emails.length === 0) return;

  const unique = [...new Set(emails)].slice(0, 40);
  const subject = encodeURIComponent("Your verified certificate");
  const body = encodeURIComponent(
    "Hello,\n\nYour certificate is ready. Use your personal verify link from the attached list, or reply if you need help.\n\n— Issued via PinaLink",
  );
  window.location.href = `mailto:?bcc=${unique.map(encodeURIComponent).join(",")}&subject=${subject}&body=${body}`;
}
