import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  define: {
    // testing-library butuh React.act dari build development; tanpa ini
    // react-dom ter-resolve ke production dan render() throw "React.act is not a function".
    "process.env.NODE_ENV": JSON.stringify("test"),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    exclude: ["e2e/**", "e2e-laravel/**", "node_modules/**", ".next/**"],
  },
});
