import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { autoConfirmAuthPlugin } from "./vite-plugins/autoConfirmAuth.ts";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), autoConfirmAuthPlugin()],
});
