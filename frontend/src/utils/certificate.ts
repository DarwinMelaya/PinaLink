const CERT_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CERT_LENGTH = 10;

export type CertificateTemplateId =
  | "SEMINAR"
  | "TRAINING"
  | "WEBINAR"
  | "COMPETITION"
  | "RECOGNITION";

export const CERTIFICATE_TEMPLATES: {
  id: CertificateTemplateId;
  label: string;
}[] = [
  { id: "SEMINAR", label: "Seminar" },
  { id: "TRAINING", label: "Training" },
  { id: "WEBINAR", label: "Webinar" },
  { id: "COMPETITION", label: "Competition" },
  { id: "RECOGNITION", label: "Recognition" },
];

export function generateCertificateNumber(length = CERT_LENGTH): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (byte) => CERT_ALPHABET[byte % CERT_ALPHABET.length]).join(
    "",
  );
}

/** Normalize user-entered cert numbers: trim + uppercase, allow A-Z 0-9 _ - */
export function normalizeCertificateNumber(raw: string): string | null {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (!cleaned) return null;
  if (!/^[A-Z0-9_-]{3,64}$/.test(cleaned)) return null;
  return cleaned;
}

export function buildVerifyUrl(certificateNumber: string): string {
  const base =
    import.meta.env.VITE_APP_URL?.replace(/\/$/, "") || window.location.origin;
  return `${base}/cert/${encodeURIComponent(certificateNumber)}`;
}

export function displayVerifyHost(verifyUrl: string): string {
  return verifyUrl.replace(/^https?:\/\//, "");
}
