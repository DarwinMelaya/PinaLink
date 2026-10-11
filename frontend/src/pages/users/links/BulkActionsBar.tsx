import { Heart, PauseCircle, PlayCircle, Star, Trash2, X } from "lucide-react";
import { BTN_DANGER, BTN_ICON, BTN_SECONDARY } from "./linkUi";

export type BulkAction = "pause" | "resume" | "favorite" | "unfavorite" | "delete";

type BulkActionsBarProps = {
  count: number;
  disabled: boolean;
  onAction: (action: BulkAction) => void;
  onClear: () => void;
};

const BulkActionsBar = ({ count, disabled, onAction, onClear }: BulkActionsBarProps) => (
  <div className="sticky top-2 z-10 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--uw-cyan)]/30 bg-[var(--uw-card)] p-2 shadow-lg shadow-black/40">
    <button type="button" onClick={onClear} className={BTN_ICON} aria-label="Clear selection">
      <X size={18} aria-hidden />
    </button>
    <p className="mr-auto text-sm font-medium text-[var(--uw-text)]">{count} selected</p>
    <button type="button" disabled={disabled} onClick={() => onAction("pause")} className={BTN_SECONDARY}>
      <PauseCircle size={16} aria-hidden />
      Pause
    </button>
    <button type="button" disabled={disabled} onClick={() => onAction("resume")} className={BTN_SECONDARY}>
      <PlayCircle size={16} aria-hidden />
      Resume
    </button>
    <button type="button" disabled={disabled} onClick={() => onAction("favorite")} className={BTN_SECONDARY}>
      <Heart size={16} aria-hidden />
      Favorite
    </button>
    <button type="button" disabled={disabled} onClick={() => onAction("unfavorite")} className={BTN_SECONDARY}>
      <Star size={16} aria-hidden />
      Unfavorite
    </button>
    <button type="button" disabled={disabled} onClick={() => onAction("delete")} className={BTN_DANGER}>
      <Trash2 size={16} aria-hidden />
      Delete
    </button>
  </div>
);

export default BulkActionsBar;
