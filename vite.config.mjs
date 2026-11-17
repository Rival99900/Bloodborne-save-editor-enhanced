import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  build: {
    // Stylesheets are written with CSS nesting; the build flattens it so the
    // older WebKitGTK of some Linux distributions reads it too.
    cssTarget: ["chrome105", "safari15"],
  },
  server: {
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
