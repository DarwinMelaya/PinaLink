import { useEffect, useState } from "react";
import supabase from "../../utils/supabaseClient";
import type { UserRole } from "../../utils/authApi";

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
};

type LoadStatus = "loading" | "success" | "error";

const AdminUser = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      setErrorMessage("");
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, name, role, created_at")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }

      setUsers((data as UserRow[]) ?? []);
      setStatus("success");
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-roomy max-w-6xl">
      <div>
        <h1 className="font-headline-md text-headline-md text-on-surface">
          Users
        </h1>
        <p className="mt-tight text-body-md text-on-surface-variant max-w-2xl">
          Accounts registered in Pinalink (User and Admin roles).
        </p>
      </div>

      {status === "error" ? (
        <p className="text-error text-body-md" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-lowest">
        <table className="w-full min-w-[640px] text-left text-body-md">
          <thead className="bg-surface-container-low border-b border-outline-variant">
            <tr>
              <th className="px-cozy py-snug font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                Name
              </th>
              <th className="px-cozy py-snug font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                Email
              </th>
              <th className="px-cozy py-snug font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                Role
              </th>
              <th className="px-cozy py-snug font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {status === "loading" ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-cozy py-roomy text-on-surface-variant"
                >
                  Loading users…
                </td>
              </tr>
            ) : null}
            {status === "success" && users.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-cozy py-roomy text-on-surface-variant"
                >
                  No users yet.
                </td>
              </tr>
            ) : null}
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-t border-outline-variant/70 hover:bg-surface-container-low/60"
              >
                <td className="px-cozy py-snug font-medium text-on-surface">
                  {user.name}
                </td>
                <td className="px-cozy py-snug text-on-surface-variant">
                  {user.email}
                </td>
                <td className="px-cozy py-snug">
                  <span
                    className={`inline-flex min-h-8 items-center rounded-full px-snug font-label-sm text-label-sm ${
                      user.role === "ADMIN"
                        ? "bg-primary/10 text-primary"
                        : "bg-surface-container-high text-on-surface-variant"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-cozy py-snug text-on-surface-variant">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUser;
