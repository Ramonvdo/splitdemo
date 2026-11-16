import "@fontsource-variable/schibsted-grotesk";
import "@fontsource-variable/jetbrains-mono";
// One typeface per kind of app, so no two monitors read as the same product. Each panel's skin.css names its own.
import "@fontsource-variable/inter";
import "@fontsource-variable/roboto";
import "@fontsource-variable/arimo";
import "@fontsource-variable/figtree";
import "@fontsource-variable/source-sans-3";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/ibm-plex-sans";
import "@fontsource/instrument-serif";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
