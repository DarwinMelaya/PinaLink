import type { ShortLinkRow } from "../../../utils/shortLinkApi";
import { linkStatus } from "./linkUi";

type StatusBadgeProps = {
  row: ShortLinkRow;
};

const StatusBadge = ({ row }: StatusBadgeProps) => {
  const status = linkStatus(row);
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 text-xs font-medium ${status.className}`}
    >
      {status.label}
    </span>
  );
};

export default StatusBadge;
