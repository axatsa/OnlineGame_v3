import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { VitePWA } from "vite-plugin-pwa";

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
    VitePWA({
      registerType: "prompt",
      includeAssets: ["logo_sticker.webp", "pwa-192x192.png", "pwa-512x512.png", "pwa-maskable-512x512.png", "offline.html"],
      manifest: {
        name: "ClassPlay",
        short_name: "ClassPlay",
        description: "ИИ-платформа для учителей",
        theme_color: "#10b981",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png"
          },
          {
            src: "pwa-maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable"
          }
        ]
      },
      workbox: {
        navigateFallback: "/offline.html",
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.classplay\.uz\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
              }
            }
          }
        ]
      }
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
          // Heavy export libs — lazily imported in generatorExport.ts & ShareResource.tsx
          if (id.includes("html2canvas") || id.includes("jspdf") || id.includes("docx") || id.includes("file-saver")) {
            return "chunk-docexport";
          }
          // KaTeX math renderer — games + generator only
          if (id.includes("katex")) {
            return "chunk-katex";
          }
          // Animation — many pages but not critical for first paint
          if (id.includes("framer-motion") || (id.includes("/motion/") && !id.includes("framer"))) {
            return "chunk-animation";
          }
          // Page-flip reader — book library only
          if (id.includes("react-pageflip")) {
            return "chunk-reader";
          }
          // i18n translations — large but not blocking render
          if (id.includes("i18next") || id.includes("react-i18next")) {
            return "chunk-i18n";
          }
          // Radix UI — shared across pages but not React core
          if (id.includes("@radix-ui")) {
            return "chunk-ui";
          }
          // React core — always needed, cache separately
          if (
            id.includes("node_modules/react/") ||
            id.includes("node_modules/react-dom/") ||
            id.includes("node_modules/react-router") ||
            id.includes("node_modules/scheduler/")
          ) {
            return "chunk-react";
          }
          // Form validation — auth + generator forms
          if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("/zod/")) {
            return "chunk-forms";
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
}));
