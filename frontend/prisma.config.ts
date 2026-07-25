// Prisma 7: CLI reads url here (old directUrl). Runtime Prisma Client uses DATABASE_URL via adapter.
import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: ".env.local" });
config(); // fallback .env

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
