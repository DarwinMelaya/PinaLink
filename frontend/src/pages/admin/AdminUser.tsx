import { useEffect, useMemo, useState, type FormEvent } from "react";
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
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-outline-variant bg-surface-container text-on-surface-variant"
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
    <div className="space-y-roomy max-w-6xl">
      <div className="flex flex-col gap-cozy lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-[0.12em] text-primary font-bold mb-tight">
            Access control
          </p>
          <h1 className="font-headline-md text-headline-md text-on-surface">
            Users
          </h1>
          <p className="mt-tight text-body-md text-on-surface-variant max-w-2xl">
            Create accounts, edit profiles, change roles, and remove access.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex min-h-12 items-center justify-center gap-tight rounded-xl bg-primary px-cozy text-on-primary font-bold hover:bg-surface-tint active:scale-[0.99] transition-all shadow-lg shadow-primary/20"
        >
          <UserPlus size={18} aria-hidden />
          Add user
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-cozy">
          <div className="flex items-center justify-between gap-snug">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
              Total
            </p>
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users size={18} aria-hidden />
            </span>
          </div>
          <p className="mt-snug text-display-lg-mobile font-display-lg text-on-surface">
            {status === "loading" ? "—" : stats.total}
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-cozy">
          <div className="flex items-center justify-between gap-snug">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
              Admins
            </p>
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Shield size={18} aria-hidden />
            </span>
          </div>
          <p className="mt-snug text-display-lg-mobile font-display-lg text-on-surface">
            {status === "loading" ? "—" : stats.admins}
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-cozy">
          <div className="flex items-center justify-between gap-snug">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
              Members
            </p>
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
              <UserRound size={18} aria-hidden />
            </span>
          </div>
          <p className="mt-snug text-display-lg-mobile font-display-lg text-on-surface">
            {status === "loading" ? "—" : stats.members}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-snug sm:flex-row sm:items-center">
        <label className="relative flex-1 min-w-0">
          <span className="sr-only">Search users</span>
          <Search
            size={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            className="w-full min-h-12 rounded-xl border border-outline-variant bg-surface-container-lowest pl-11 pr-cozy text-body-md outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </label>
        <div
          className="inline-flex rounded-xl border border-outline-variant bg-surface-container-lowest p-tight"
          role="group"
          aria-label="Filter by role"
        >
          {(["ALL", "USER", "ADMIN"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRoleFilter(value)}
              className={`min-h-10 rounded-lg px-cozy font-label-sm text-label-sm font-bold transition-colors ${
                roleFilter === value
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              {value === "ALL" ? "All" : value}
            </button>
          ))}
        </div>
      </div>

      {status === "error" ? (
        <p className="text-error text-body-md" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {toast ? (
        <p
          className="rounded-xl border border-secondary/30 bg-secondary/10 px-cozy py-snug text-secondary font-bold text-body-md"
          role="status"
        >
          {toast}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <table className="w-full min-w-[720px] text-left text-body-md">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="px-cozy py-snug font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                User
              </th>
              <th className="px-cozy py-snug font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                Role
              </th>
              <th className="px-cozy py-snug font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                Joined
              </th>
              <th className="px-cozy py-snug font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide text-right">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" ? (
              <tr>
                <td colSpan={4} className="px-cozy py-roomy text-on-surface-variant">
                  Loading users…
                </td>
              </tr>
            ) : null}

            {status === "success" && filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-cozy py-roomy text-on-surface-variant">
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
                  className="border-t border-outline-variant/70 hover:bg-surface-container-low/50 transition-colors"
                >
                  <td className="px-cozy py-snug">
                    <div className="flex items-center gap-snug min-w-0">
                      <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary font-bold text-label-sm"
                        aria-hidden
                      >
                        {initials(user.name) || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-on-surface truncate">
                          {user.name}
                          {isSelf ? (
                            <span className="ml-tight font-label-sm text-label-sm text-primary font-bold">
                              You
                            </span>
                          ) : null}
                        </p>
                        <p className="text-on-surface-variant truncate">
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
                      className="min-h-11 rounded-lg border border-outline-variant bg-surface-container-lowest px-snug text-body-md outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-cozy py-snug text-on-surface-variant whitespace-nowrap">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-cozy py-snug">
                    <div className="flex items-center justify-end gap-tight">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-outline-variant text-on-surface hover:bg-surface-container transition-colors"
                        aria-label={`Edit ${user.name}`}
                      >
                        <Pencil size={16} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(user)}
                        disabled={isSelf}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-error/30 text-error hover:bg-error-container/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
            className="absolute inset-0 bg-on-surface/45"
            aria-label="Close dialog"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            className="relative z-10 w-full max-w-lg rounded-2xl border border-outline-variant bg-surface-container-lowest p-roomy shadow-2xl"
          >
            <div className="flex items-start justify-between gap-snug mb-cozy">
              <div>
                <h2
                  id="user-modal-title"
                  className="font-headline-md text-headline-md text-on-surface"
                >
                  {modal === "create" ? "Add user" : "Edit user"}
                </h2>
                <p className="mt-tight text-body-md text-on-surface-variant">
                  {modal === "create"
                    ? "Creates a login account and profile."
                    : "Update name, email, or role."}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container"
                aria-label="Close"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-cozy">
              <div>
                <label
                  htmlFor="user-name"
                  className="block font-label-sm text-label-sm text-on-surface-variant mb-tight"
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
                  className="w-full min-h-12 rounded-lg border border-outline-variant bg-surface-container px-cozy text-body-md outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label
                  htmlFor="user-email"
                  className="block font-label-sm text-label-sm text-on-surface-variant mb-tight"
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
                  className="w-full min-h-12 rounded-lg border border-outline-variant bg-surface-container px-cozy text-body-md outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              {modal === "create" ? (
                <div>
                  <label
                    htmlFor="user-password"
                    className="block font-label-sm text-label-sm text-on-surface-variant mb-tight"
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
                      className="w-full min-h-12 rounded-lg border border-outline-variant bg-surface-container pl-cozy pr-12 text-body-md outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex min-h-11 min-w-11 items-center justify-center text-on-surface-variant"
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
                <p className="font-label-sm text-label-sm text-on-surface-variant mb-tight">
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
                      className={`min-h-12 rounded-xl border px-cozy font-bold transition-colors disabled:opacity-50 ${
                        form.role === role
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-outline-variant text-on-surface-variant hover:bg-surface-container"
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
                <p className="text-error text-body-md" role="alert">
                  {formError}
                </p>
              ) : null}

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-snug pt-tight">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="min-h-12 rounded-xl border border-outline-variant px-cozy font-bold text-on-surface hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="min-h-12 rounded-xl bg-primary px-cozy font-bold text-on-primary hover:bg-surface-tint disabled:opacity-60 transition-colors"
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
            className="absolute inset-0 bg-on-surface/45"
            aria-label="Close dialog"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            className="relative z-10 w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-roomy shadow-2xl"
          >
            <h2
              id="delete-modal-title"
              className="font-headline-md text-headline-md text-on-surface"
            >
              Delete user?
            </h2>
            <p className="mt-cozy text-body-md text-on-surface-variant">
              Remove{" "}
              <span className="font-bold text-on-surface">{selected.name}</span> (
              {selected.email}). Their profile and linked ownership will be
              cleared. This cannot be undone.
            </p>
            <div className="mt-cozy">
              <RoleBadge role={selected.role} />
            </div>

            {formError ? (
              <p className="mt-cozy text-error text-body-md" role="alert">
                {formError}
              </p>
            ) : null}

            <div className="mt-roomy flex flex-col-reverse sm:flex-row sm:justify-end gap-snug">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="min-h-12 rounded-xl border border-outline-variant px-cozy font-bold text-on-surface hover:bg-surface-container transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={saving}
                className="min-h-12 rounded-xl bg-error px-cozy font-bold text-on-error hover:brightness-95 disabled:opacity-60 transition-all"
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
