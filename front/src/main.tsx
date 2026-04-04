import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { ThemeProvider } from "./context/ThemeContext";
import { init, browserTracingIntegration, replayIntegration } from "@sentry/react";

if (import.meta.env.VITE_SENTRY_DSN) {
  init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      browserTracingIntegration(),
      replayIntegration(),
    ],
    tracesSampleRate: 0.1,
  });
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);
