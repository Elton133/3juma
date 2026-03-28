import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import "./index.css";
import App from "./App";
import { initOneSignal } from "@/lib/onesignal";
import { setAppServiceWorkerRegistration } from "@/lib/serviceWorkerRegistration";

initOneSignal();

registerSW({
  immediate: true,
  onRegistered(registration) {
    setAppServiceWorkerRegistration(registration);
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
