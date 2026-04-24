import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    ViteImageOptimizer({
      png: { quality: 75 },
      webp: { lossless: false, quality: 75 },
    }),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Split heavy export libraries into own chunk (only loaded by admin/generator)
          if (id.includes("html2canvas") || id.includes("jspdf") || id.includes("docx")) {
            return "chunk-docexport";
          }
          // Split charting library (only used by admin panel)
          if (id.includes("recharts")) {
            return "chunk-charts";
          }
          // Split animation library (used by multiple pages)
          if (id.includes("framer-motion")) {
            return "chunk-animation";
          }
          // Split page-flip library (only used by Library page)
          if (id.includes("react-pageflip")) {
            return "chunk-reader";
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
