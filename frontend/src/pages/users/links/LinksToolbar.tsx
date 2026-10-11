import { Search } from "lucide-react";

export type SortMode = "newest" | "clicks" | "alpha";
export type FilterMode = "all" | "favorites" | "paused" | "expired";

const FILTERS: { value: FilterMode; label: string }[] = [
  { value: "all", label: "All" },
  { value: "favorites", label: "Favorites" },
  { value: "paused", label: "Paused" },
  { value: "expired", label: "Expired" },
];

const SORT_MODES: SortMode[] = ["newest", "clicks", "alpha"];

const SORT_LABELS: Record<SortMode, string> = {
  newest: "Newest first",
  clicks: "Most clicks",
  alpha: "Code A–Z",
};

function isSortMode(value: string): value is SortMode {
  return SORT_MODES.some((mode) => mode === value);
}

type LinksToolbarProps = {
  query: string;
  filter: FilterMode;
  sort: SortMode;
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: FilterMode) => void;
  onSortChange: (sort: SortMode) => void;
};

const LinksToolbar = ({
  query,
  filter,
  sort,
  onQueryChange,
  onFilterChange,
  onSortChange,
}: LinksToolbarProps) => (
  <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
    <label className="relative block flex-1">
      <span className="sr-only">Search links</span>
      <Search
        size={18}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--uw-muted)]"
        aria-hidden
      />
      <input
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search by title, code, or destination"
        className="block min-h-11 w-full rounded-xl border border-white/10 bg-[var(--uw-card)] pl-10 pr-3.5 text-[15px] text-[var(--uw-text)] outline-none transition-colors placeholder:text-[var(--uw-muted)]/80 hover:border-white/20 focus:border-[var(--uw-cyan)]/60 focus:ring-2 focus:ring-[var(--uw-cyan)]/15"
      />
    </label>

    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label="Filter links"
        className="flex rounded-xl border border-white/10 bg-[var(--uw-card)] p-1"
      >
        {FILTERS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onFilterChange(value)}
            aria-pressed={filter === value}
            className={[
              "min-h-9 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--uw-cyan)]/50",
              filter === value
                ? "bg-[var(--uw-card-hover)] text-[var(--uw-text)]"
                : "text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="sr-only" htmlFor="links-sort">
        Sort links
      </label>
      <select
        id="links-sort"
        value={sort}
        onChange={(e) => {
          if (isSortMode(e.target.value)) onSortChange(e.target.value);
        }}
        className="min-h-11 cursor-pointer rounded-xl border border-white/10 bg-[var(--uw-card)] px-3 text-sm font-medium text-[var(--uw-text)] outline-none hover:border-white/20 focus:border-[var(--uw-cyan)]/60"
      >
        {SORT_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {SORT_LABELS[mode]}
          </option>
        ))}
      </select>
    </div>
  </div>
);

export default LinksToolbar;
