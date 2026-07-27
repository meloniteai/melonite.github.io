import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SpaceGridDemo } from "./SpaceGridDemo";
import "./space-grid-demo.css";

const root = document.getElementById("space-grid-demo-root");

if (!root) {
  throw new Error("Space grid demo root was not found.");
}

createRoot(root).render(
  <StrictMode>
    <SpaceGridDemo />
  </StrictMode>,
);
