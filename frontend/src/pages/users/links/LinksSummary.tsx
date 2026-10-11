type LinksSummaryProps = {
  total: number;
  live: number;
  clicks: number;
  expiringSoon: number;
};

const LinksSummary = ({ total, live, clicks, expiringSoon }: LinksSummaryProps) => {
  const items = [
    { label: "Links", value: total },
    { label: "Live", value: live },
    { label: "Total clicks", value: clicks },
    { label: "Expiring in 7 days", value: expiringSoon },
  ];

  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-2xl border border-white/[0.06] bg-[var(--uw-card)] sm:grid-cols-4">
      {items.map(({ label, value }, i) => (
        <div
          key={label}
          className={[
            "px-5 py-4",
            i % 2 === 1 ? "border-l border-white/[0.06]" : "",
            i >= 2 ? "border-t border-white/[0.06] sm:border-t-0" : "",
            i === 2 ? "sm:border-l" : "",
          ].join(" ")}
        >
          <dt className="text-sm text-[var(--uw-muted)]">{label}</dt>
          <dd className="mt-1 text-2xl font-semibold tabular-nums text-[var(--uw-text)]">
            {value.toLocaleString()}
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default LinksSummary;
