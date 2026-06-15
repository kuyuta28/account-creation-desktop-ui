import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    exclude: ["node_modules", "**/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/main.tsx", "src/vite-env.d.ts", "src/__tests__/**"],
      thresholds: { lines: 95, functions: 95, branches: 90, statements: 95 },
    },
  },
  clearScreen: false,
  server: {
    port: 1421,
    strictPort: true,
    envDir: "./",
  },
  envPrefix: ["VITE_"],
  build: {
    target: "chrome105",
    sourcemap: true,
  },
});
