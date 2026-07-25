import type { Connect, Plugin } from "vite";
import type { ServerResponse } from "node:http";
import { config as loadEnv } from "dotenv";
import pg from "pg";

loadEnv({ path: ".env.local" });
loadEnv();

type JsonBody = {
  userId?: string;
  email?: string;
  password?: string;
  name?: string;
  role?: string;
};

type CreatedUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  created_at: string;
};

function readJsonBody(req: Connect.IncomingMessage): Promise<JsonBody> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? (JSON.parse(raw) as JsonBody) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function getConnectionString(): string {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DIRECT_URL missing. Add it to frontend/.env.local for auth create without email.",
    );
  }
  return connectionString;
}

async function withDb<T>(fn: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({
    connectionString: getConnectionString(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

async function markEmailConfirmed(userId: string): Promise<void> {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      userId,
    )
  ) {
    throw new Error("Invalid user id.");
  }

  await withDb(async (client) => {
    const result = await client.query(
      `UPDATE auth.users
       SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
       WHERE id = $1::uuid
       RETURNING id`,
      [userId],
    );
    if (result.rowCount === 0) {
      throw new Error("Auth user not found.");
    }
  });
}

/**
 * Creates Auth user + identity + profile via Postgres.
 * Does NOT call /auth/v1/signup — avoids confirmation email + rate limits.
 */
async function createAuthUser(input: {
  email: string;
  password: string;
  name: string;
  role: "USER" | "ADMIN";
}): Promise<CreatedUser> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  const password = input.password;
  const role = input.role;

  if (!email.includes("@") || !name || password.length < 8) {
    throw new Error("Valid name, email, and password (8+) are required.");
  }

  return withDb(async (client) => {
    await client.query("BEGIN");
    try {
      const existing = await client.query(
        `SELECT id FROM auth.users WHERE lower(email) = lower($1) LIMIT 1`,
        [email],
      );
      if ((existing.rowCount ?? 0) > 0) {
        throw new Error("A user with this email already exists.");
      }

      const inserted = await client.query<{
        id: string;
        email: string;
        created_at: Date;
      }>(
        `INSERT INTO auth.users (
           instance_id,
           id,
           aud,
           role,
           email,
           encrypted_password,
           email_confirmed_at,
           raw_app_meta_data,
           raw_user_meta_data,
           created_at,
           updated_at,
           confirmation_token,
           recovery_token,
           email_change_token_new,
           email_change
         )
         VALUES (
           '00000000-0000-0000-0000-000000000000',
           gen_random_uuid(),
           'authenticated',
           'authenticated',
           $1,
           crypt($2, gen_salt('bf')),
           NOW(),
           '{"provider":"email","providers":["email"]}'::jsonb,
           jsonb_build_object('name', $3::text, 'role', $4::text),
           NOW(),
           NOW(),
           '',
           '',
           '',
           ''
         )
         RETURNING id, email, created_at`,
        [email, password, name, role],
      );

      const user = inserted.rows[0];
      if (!user) {
        throw new Error("Could not create auth user.");
      }

      await client.query(
        `INSERT INTO auth.identities (
           id,
           user_id,
           identity_data,
           provider,
           provider_id,
           last_sign_in_at,
           created_at,
           updated_at
         )
         VALUES (
           gen_random_uuid(),
           $1::uuid,
           jsonb_build_object(
             'sub', $1::text,
             'email', $2::text,
             'email_verified', true,
             'name', $3::text
           ),
           'email',
           $1::text,
           NOW(),
           NOW(),
           NOW()
         )`,
        [user.id, email, name],
      );

      const profile = await client.query<{
        id: string;
        email: string;
        name: string;
        role: string;
        created_at: Date;
      }>(
        `INSERT INTO public.profiles (id, email, name, password_hash, role, created_at)
         VALUES ($1::uuid, $2, $3, NULL, $4::"UserRole", NOW())
         ON CONFLICT (id) DO UPDATE
           SET email = EXCLUDED.email,
               name = EXCLUDED.name,
               role = EXCLUDED.role
         RETURNING id, email, name, role, created_at`,
        [user.id, email, name, role],
      );

      const row = profile.rows[0];
      if (!row) {
        throw new Error("Could not create profile.");
      }

      await client.query("COMMIT");

      return {
        id: row.id,
        email: row.email,
        name: row.name,
        role: row.role === "ADMIN" ? "ADMIN" : "USER",
        created_at:
          row.created_at instanceof Date
            ? row.created_at.toISOString()
            : String(row.created_at),
      };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  });
}

function sendJson(
  res: ServerResponse,
  status: number,
  payload: unknown,
): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function attachAuthRoutes(middlewares: Connect.Server): void {
  middlewares.use("/api/auth/auto-confirm", (req, res, next) => {
    if (req.method !== "POST") {
      next();
      return;
    }

    void (async () => {
      try {
        const body = await readJsonBody(req);
        const userId = body.userId?.trim();
        if (!userId) {
          sendJson(res, 400, { error: "userId is required." });
          return;
        }
        await markEmailConfirmed(userId);
        sendJson(res, 200, { ok: true });
      } catch (err) {
        sendJson(res, 500, {
          error:
            err instanceof Error
              ? err.message
              : "Could not auto-confirm email.",
        });
      }
    })();
  });

  middlewares.use("/api/auth/create-user", (req, res, next) => {
    if (req.method !== "POST") {
      next();
      return;
    }

    void (async () => {
      try {
        const body = await readJsonBody(req);
        const email = body.email?.trim() ?? "";
        const password = body.password ?? "";
        const name = body.name?.trim() ?? "";
        const role = body.role === "ADMIN" ? "ADMIN" : "USER";

        const user = await createAuthUser({ email, password, name, role });
        sendJson(res, 200, { user });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not create user.";
        const status = message.toLowerCase().includes("already exists")
          ? 409
          : 500;
        sendJson(res, status, { error: message });
      }
    })();
  });
}

/** Dev/preview: create/confirm Auth users via DB — no signup emails / rate limits. */
export function autoConfirmAuthPlugin(): Plugin {
  return {
    name: "pinalink-auto-confirm-auth",
    configureServer(server) {
      attachAuthRoutes(server.middlewares);
    },
    configurePreviewServer(server) {
      attachAuthRoutes(server.middlewares);
    },
  };
}
