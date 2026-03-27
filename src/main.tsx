import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { initFirebase } from "@/lib/firebase";

// Initialize Firebase (gracefully degrades if not configured)
initFirebase();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
