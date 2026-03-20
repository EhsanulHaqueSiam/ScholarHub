import { defineConfig, loadEnv } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import netlify from "@netlify/vite-plugin-tanstack-start";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  // Load env vars and expose to process.env for SSR access
  const env = loadEnv(mode, process.cwd(), "");
  if (env.VITE_CONVEX_URL) {
    process.env.VITE_CONVEX_URL = env.VITE_CONVEX_URL;
  }

  return {
    plugins: [
      tsConfigPaths(),
      tanstackStart(),
      react(),
      tailwindcss(),
      netlify(),
    ],
  };
});
