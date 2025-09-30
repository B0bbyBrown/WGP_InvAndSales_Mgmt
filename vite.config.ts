import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer()
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner()
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "client",
        "src"
      ),
      "@shared": path.resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "shared"
      ),
      "@assets": path.resolve(
        fileURLToPath(new URL(".", import.meta.url)),
        "attached_assets"
      ),
    },
  },
  root: path.resolve(fileURLToPath(new URL(".", import.meta.url)), "client"),
  build: {
    outDir: path.resolve(
      fileURLToPath(new URL(".", import.meta.url)),
      "dist/public"
    ),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts")) {
              return "recharts";
            }
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5082",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, "/api"),
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
