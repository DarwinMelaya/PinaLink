import { useEffect, useRef, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Destructive-action confirmation built on the native modal <dialog>. */
const ConfirmDialog = ({
  open,
  title,
  description,
  confirmLabel,
  busy,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function requestCancel() {
    if (!busy) onCancel();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
      onCancel={(event) => {
        // Escape key: keep React state as the source of truth for `open`.
        event.preventDefault();
        requestCancel();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestCancel();
      }}
      className="m-auto w-[min(calc(100vw-2rem),26rem)] rounded-2xl border border-white/10 bg-[var(--uw-card)] p-0 text-[var(--uw-text)] shadow-2xl backdrop:bg-black/70"
    >
      <div className="p-6">
        <div className="flex items-start gap-4">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#ff6b6b]/15 text-[#ff8a8a]">
            <AlertTriangle size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 id="confirm-dialog-title" className="text-lg font-semibold">
              {title}
            </h2>
            <div
              id="confirm-dialog-description"
              className="mt-1.5 text-sm text-[var(--uw-muted)]"
            >
              {description}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            autoFocus
            onClick={requestCancel}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-medium transition-colors hover:bg-[var(--uw-card-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--uw-cyan)]/50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#e5484d] px-4 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a8a]/60 disabled:opacity-60"
          >
            {busy ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default ConfirmDialog;
