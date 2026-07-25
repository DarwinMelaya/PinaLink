import { useEffect, useMemo, useState, type FormEvent } from "react";
import { NavLink } from "react-router-dom";
import {
  Pencil,
  Trash2,
  UserPlus,
  Search,
  Shield,
  Users,
  X,
  Eye,
  EyeOff,
  ShieldCheck,
  UserRound,
  LayoutDashboard,
  LineChart,
  Settings,
} from "lucide-react";
import { getSession, type UserRole } from "../../utils/authApi";
import {
  createAdminUser,
  deleteAdminUser,
  listAdminUsers,
  updateAdminUser,
  updateAdminUserRole,
  type AdminUserRow,
} from "../../utils/adminUserApi";

type LoadStatus = "loading" | "success" | "error";
type ModalMode = "closed" | "create" | "edit" | "delete";

type FormState = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  password: "",
  role: "USER",
};

const fieldClass =
  "w-full min-h-12 rounded-full border border-white/10 bg-[var(--uw-elevated)] px-cozy text-body-md text-[var(--uw-text)] outline-none focus:border-[var(--uw-cyan)]/50 focus:ring-2 focus:ring-[var(--uw-cyan)]/20";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function RoleBadge({ role }: { role: UserRole }) {
  const isAdmin = role === "ADMIN";
  return (
    <span
      className={`inline-flex min-h-8 items-center gap-tight rounded-full border px-snug font-label-sm text-label-sm font-bold ${
        isAdmin
          ? "border-[var(--uw-cyan)]/40 bg-[var(--uw-cyan)]/10 text-[var(--uw-cyan)]"
          : "border-white/10 bg-white/5 text-[var(--uw-muted)]"
      }`}
    >
      {isAdmin ? (
        <ShieldCheck size={14} aria-hidden />
      ) : (
        <UserRound size={14} aria-hidden />
      )}
      {role}
    </span>
  );
}

const AdminUser = () => {
  const session = getSession();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | UserRole>("ALL");

  const [modal, setModal] = useState<ModalMode>("closed");
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  const displayName = session?.name ?? "Admin";
  const handle = session?.email
    ? `@${session.email.split("@")[0]}`
    : "@admin";
  const sessionInitials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function refresh() {
    setStatus("loading");
    setErrorMessage("");
    try {
      const rows = await listAdminUsers();
      setUsers(rows);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to load users.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === "ADMIN").length;
    return {
      total: users.length,
      admins,
      members: users.length - admins,
    };
  }, [users]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
      if (!q) return true;
      return (
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  function openCreate() {
    setSelected(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowPassword(false);
    setModal("create");
  }

  function openEdit(user: AdminUserRow) {
    setSelected(user);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setFormError("");
    setModal("edit");
  }

  function openDelete(user: AdminUserRow) {
    setSelected(user);
    setFormError("");
    setModal("delete");
  }

  function closeModal() {
    if (saving) return;
    setModal("closed");
    setSelected(null);
    setFormError("");
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      if (modal === "create") {
        const created = await createAdminUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        setUsers((prev) => [created, ...prev.filter((u) => u.id !== created.id)]);
        setToast("User created");
      } else if (modal === "edit" && selected) {
        const updated = await updateAdminUser(selected.id, {
          name: form.name,
          email: form.email,
          role: form.role,
        });
        setUsers((prev) =>
          prev.map((u) => (u.id === updated.id ? updated : u)),
        );
        setToast("User updated");
      }
      setModal("closed");
      setSelected(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    setFormError("");
    setSaving(true);
    try {
      await deleteAdminUser(selected.id);
      setUsers((prev) => prev.filter((u) => u.id !== selected.id));
      setToast("User deleted");
      setModal("closed");
      setSelected(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRoleChange(user: AdminUserRow, role: UserRole) {
    if (user.role === role) return;
    try {
      const updated = await updateAdminUserRole(user.id, role);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      setToast(`Role set to ${role}`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Role update failed.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-roomy">
      <div className="flex flex-col gap-cozy lg:flex-row lg:items-center lg:justify-between uw-rise">
        <div className="flex flex-wrap items-center gap-tight">
          <NavLink
            to="/admin/dashboard"
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
            to="/admin/user"
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
            <Users size={16} aria-hidden />
            Users
          </NavLink>
          <NavLink
            to="/admin/analytics"
            className={({ isActive }) =>
              [
                "inline-flex min-h-11 items-center gap-tight rounded-full px-cozy text-body-md font-bold transition-colors",
                isActive
                  ? "uw-gradient"
                  : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
              ].join(" ")
            }
          >
            <LineChart size={16} aria-hidden />
            Analytics
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              [
                "inline-flex min-h-11 items-center gap-tight rounded-full px-cozy text-body-md font-bold transition-colors",
                isActive
                  ? "uw-gradient"
                  : "bg-[var(--uw-card)] text-[var(--uw-muted)] hover:text-[var(--uw-text)]",
              ].join(" ")
            }
          >
            <Settings size={16} aria-hidden />
            Settings
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
            className="relative flex size-12 shrink-0 items-center justify-center rounded-full bg-[var(--uw-card)] text-[var(--uw-cyan)] font-bold ring-2 ring-white/10"
            aria-hidden
          >
            {sessionInitials || "A"}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-cozy lg:flex-row lg:items-end lg:justify-between uw-rise-delay-1">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-[var(--uw-cyan)] font-bold mb-tight">
            Access control
          </p>
          <h1 className="text-[clamp(28px,5vw,42px)] font-bold tracking-tight uppercase leading-none uw-gradient-text">
            Users
          </h1>
          <p className="mt-snug text-body-md text-[var(--uw-muted)] max-w-2xl">
            Create accounts, edit profiles, change roles, and remove access.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-12 items-center justify-center gap-tight rounded-full uw-gradient px-cozy font-bold hover:brightness-110 active:scale-[0.99] transition-all shadow-[0_0_20px_rgba(0,212,197,0.25)]"
        >
          <UserPlus size={18} aria-hidden />
          Add user
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter uw-rise-delay-2">
        <div className="rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)] p-cozy">
          <div className="flex items-center justify-between gap-snug">
            <p className="font-label-sm text-label-sm text-[var(--uw-muted)] uppercase tracking-wide">
              Total
            </p>
            <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-white/5 text-[var(--uw-cyan)]">
              <Users size={18} aria-hidden />
            </span>
          </div>
          <p className="mt-snug text-display-lg-mobile font-display-lg text-[var(--uw-text)]">
            {status === "loading" ? "—" : stats.total}
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)] p-cozy">
          <div className="flex items-center justify-between gap-snug">
            <p className="font-label-sm text-label-sm text-[var(--uw-muted)] uppercase tracking-wide">
              Admins
            </p>
            <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-white/5 text-[var(--uw-cyan)]">
              <Shield size={18} aria-hidden />
            </span>
          </div>
          <p className="mt-snug text-display-lg-mobile font-display-lg text-[var(--uw-text)]">
            {status === "loading" ? "—" : stats.admins}
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)] p-cozy">
          <div className="flex items-center justify-between gap-snug">
            <p className="font-label-sm text-label-sm text-[var(--uw-muted)] uppercase tracking-wide">
              Members
            </p>
            <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-white/5 text-white">
              <UserRound size={18} aria-hidden />
            </span>
          </div>
          <p className="mt-snug text-display-lg-mobile font-display-lg text-[var(--uw-text)]">
            {status === "loading" ? "—" : stats.members}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-snug sm:flex-row sm:items-center">
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Search users</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--uw-muted)]"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="w-full min-h-12 rounded-full border border-white/5 bg-[var(--uw-card)] pl-11 pr-cozy text-body-md text-[var(--uw-text)] placeholder:text-[var(--uw-muted)] outline-none focus:ring-2 focus:ring-[var(--uw-cyan)]/30"
          />
        </label>
        <div
          className="inline-flex rounded-full border border-white/5 bg-[var(--uw-card)] p-tight"
          role="group"
          aria-label="Filter by role"
        >
          {(["ALL", "USER", "ADMIN"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRoleFilter(value)}
              className={`min-h-10 rounded-full px-cozy font-label-sm text-label-sm font-bold transition-colors ${
                roleFilter === value
                  ? "uw-gradient"
                  : "text-[var(--uw-muted)] hover:text-[var(--uw-text)]"
              }`}
            >
              {value === "ALL" ? "All" : value}
            </button>
          ))}
        </div>
      </div>

      {status === "error" ? (
        <p className="text-[#ff6b6b] text-body-md" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {toast ? (
        <p
          className="rounded-full border border-[var(--uw-cyan)]/30 bg-[var(--uw-cyan)]/10 px-cozy py-snug text-[var(--uw-cyan)] font-bold text-body-md"
          role="status"
        >
          {toast}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-[1.75rem] border border-white/5 bg-[var(--uw-card)]">
        <table className="w-full min-w-[720px] text-left text-body-md">
          <thead className="bg-[var(--uw-elevated)] border-b border-white/5">
            <tr>
              <th className="px-cozy py-snug font-label-sm text-label-sm text-[var(--uw-muted)] uppercase tracking-wide">
                User
              </th>
              <th className="px-cozy py-snug font-label-sm text-label-sm text-[var(--uw-muted)] uppercase tracking-wide">
                Role
              </th>
              <th className="px-cozy py-snug font-label-sm text-label-sm text-[var(--uw-muted)] uppercase tracking-wide">
                Joined
              </th>
              <th className="px-cozy py-snug font-label-sm text-label-sm text-[var(--uw-muted)] uppercase tracking-wide text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-cozy py-roomy text-[var(--uw-muted)]"
                >
                  Loading users…
                </td>
              </tr>
            ) : null}

            {status === "success" && filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-cozy py-roomy text-[var(--uw-muted)]"
                >
                  {users.length === 0
                    ? "No users yet. Add the first account."
                    : "No users match your search."}
                </td>
              </tr>
            ) : null}

            {filtered.map((user) => {
              const isSelf = session?.id === user.id;
              return (
                <tr
                  key={user.id}
                  className="border-t border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-cozy py-snug">
                    <div className="flex items-center gap-snug min-w-0">
                      <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[var(--uw-cyan)]/15 text-[var(--uw-cyan)] font-bold text-label-sm"
                        aria-hidden
                      >
                        {initials(user.name) || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-[var(--uw-text)] truncate">
                          {user.name}
                          {isSelf ? (
                            <span className="ml-tight font-label-sm text-label-sm text-[var(--uw-cyan)] font-bold">
                              You
                            </span>
                          ) : null}
                        </p>
                        <p className="text-[var(--uw-muted)] truncate">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-cozy py-snug">
                    <label className="sr-only" htmlFor={`role-${user.id}`}>
                      Change role for {user.name}
                    </label>
                    <select
                      id={`role-${user.id}`}
                      value={user.role}
                      disabled={isSelf}
                      onChange={(e) =>
                        void handleRoleChange(
                          user,
                          e.target.value === "ADMIN" ? "ADMIN" : "USER",
                        )
                      }
                      className="min-h-11 rounded-full border border-white/10 bg-[var(--uw-elevated)] px-snug text-body-md text-[var(--uw-text)] outline-none focus:border-[var(--uw-cyan)]/50 focus:ring-2 focus:ring-[var(--uw-cyan)]/20 disabled:opacity-60"
                    >
                      <option value="USER" className="bg-[var(--uw-card)]">
                        USER
                      </option>
                      <option value="ADMIN" className="bg-[var(--uw-card)]">
                        ADMIN
                      </option>
                    </select>
                  </td>
                  <td className="px-cozy py-snug text-[var(--uw-muted)] whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-cozy py-snug">
                    <div className="flex items-center justify-end gap-tight">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-white/10 text-[var(--uw-text)] hover:bg-white/5 transition-colors"
                        aria-label={`Edit ${user.name}`}
                      >
                        <Pencil size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(user)}
                        disabled={isSelf}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-[#ff6b6b]/30 text-[#ff6b6b] hover:bg-[#ff6b6b]/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label={`Delete ${user.name}`}
                      >
                        <Trash2 size={16} aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal === "create" || modal === "edit" ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-gutter">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close dialog"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            className="relative z-10 w-full max-w-lg rounded-[1.75rem] border border-white/10 bg-[var(--uw-card)] p-roomy shadow-2xl"
          >
            <div className="flex items-start justify-between gap-snug mb-cozy">
              <div>
                <h2
                  id="user-modal-title"
                  className="font-headline-md text-headline-md text-[var(--uw-text)]"
                >
                  {modal === "create" ? "Add user" : "Edit user"}
                </h2>
                <p className="mt-tight text-body-md text-[var(--uw-muted)]">
                  {modal === "create"
                    ? "Creates a login account and profile."
                    : "Update name, email, or role."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[var(--uw-muted)] hover:bg-white/5"
                aria-label="Close"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-cozy">
              <div>
                <label
                  htmlFor="user-name"
                  className="block font-label-sm text-label-sm text-[var(--uw-muted)] mb-tight"
                >
                  Name
                </label>
                <input
                  id="user-name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  required
                  className={fieldClass}
                />
              </div>

              <div>
                <label
                  htmlFor="user-email"
                  className="block font-label-sm text-label-sm text-[var(--uw-muted)] mb-tight"
                >
                  Email
                </label>
                <input
                  id="user-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  required
                  className={fieldClass}
                />
              </div>

              {modal === "create" ? (
                <div>
                  <label
                    htmlFor="user-password"
                    className="block font-label-sm text-label-sm text-[var(--uw-muted)] mb-tight"
                  >
                    Temporary password
                  </label>
                  <div className="relative">
                    <input
                      id="user-password"
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      required
                      minLength={8}
                      className={`${fieldClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex min-h-11 min-w-11 items-center justify-center text-[var(--uw-muted)]"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <EyeOff size={18} aria-hidden />
                      ) : (
                        <Eye size={18} aria-hidden />
                      )}
                    </button>
                  </div>
                </div>
              ) : null}

              <div>
                <p className="font-label-sm text-label-sm text-[var(--uw-muted)] mb-tight">
                  Role
                </p>
                <div className="grid grid-cols-2 gap-snug">
                  {(["USER", "ADMIN"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, role }))}
                      disabled={
                        modal === "edit" &&
                        selected?.id === session?.id &&
                        role !== "ADMIN"
                      }
                      className={`min-h-12 rounded-full border px-cozy font-bold transition-colors disabled:opacity-50 ${
                        form.role === role
                          ? "border-[var(--uw-cyan)]/40 bg-[var(--uw-cyan)]/10 text-[var(--uw-cyan)]"
                          : "border-white/10 text-[var(--uw-muted)] hover:bg-white/5"
                      }`}
                    >
                      <span className="inline-flex items-center justify-center gap-tight">
                        {role === "ADMIN" ? (
                          <ShieldCheck size={16} aria-hidden />
                        ) : (
                          <UserRound size={16} aria-hidden />
                        )}
                        {role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {formError ? (
                <p className="text-[#ff6b6b] text-body-md" role="alert">
                  {formError}
                </p>
              ) : null}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-snug pt-tight">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="min-h-12 rounded-full border border-white/10 px-cozy font-bold text-[var(--uw-text)] hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-12 rounded-full uw-gradient px-cozy font-bold hover:brightness-110 disabled:opacity-60 transition-all"
                >
                  {saving
                    ? "Saving…"
                    : modal === "create"
                      ? "Create user"
                      : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {modal === "delete" && selected ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-gutter">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close dialog"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="relative z-10 w-full max-w-md rounded-[1.75rem] border border-white/10 bg-[var(--uw-card)] p-roomy shadow-2xl"
          >
            <h2
              id="delete-modal-title"
              className="font-headline-md text-headline-md text-[var(--uw-text)]"
            >
              Delete user?
            </h2>
            <p className="mt-cozy text-body-md text-[var(--uw-muted)]">
              Remove{" "}
              <span className="font-bold text-[var(--uw-text)]">
                {selected.name}
              </span>{" "}
              ({selected.email}). Their profile and linked ownership will be
              cleared. This cannot be undone.
            </p>
            <div className="mt-cozy">
              <RoleBadge role={selected.role} />
            </div>

            {formError ? (
              <p className="mt-cozy text-[#ff6b6b] text-body-md" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="mt-roomy flex flex-col-reverse sm:flex-row sm:justify-end gap-snug">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="min-h-12 rounded-full border border-white/10 px-cozy font-bold text-[var(--uw-text)] hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={saving}
                className="min-h-12 rounded-full bg-[#ff3b30] px-cozy font-bold text-white hover:brightness-95 disabled:opacity-60 transition-all"
              >
                {saving ? "Deleting…" : "Delete user"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminUser;
