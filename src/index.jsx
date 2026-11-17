import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { LocalizationProvider } from "./i18n/localization";
import { invoke } from "@tauri-apps/api/core";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <LocalizationProvider>
      <App />
    </LocalizationProvider>
  </React.StrictMode>,
);

// The native window starts hidden: show it once the first screen is painted.
if (window.__TAURI_INTERNALS__) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      invoke("show_main_window").catch((error) =>
        console.error("Unable to show the window.", error),
      );
    });
  });
}
