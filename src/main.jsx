/**
 * main.jsx — React entry point. Mounts <App /> into the #root div of
 * index.html and pulls in the global stylesheet. No logic lives here.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
