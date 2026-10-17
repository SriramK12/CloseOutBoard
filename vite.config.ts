import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Relative base so the build works from any static host path (e.g. GitHub Pages).
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
