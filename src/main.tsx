import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { initOptions } from "./options/store";
import { startRankedSync } from "./pp/rankedService";
import "./index.css";

// Global services, started once before the first render
initOptions();
startRankedSync();

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
