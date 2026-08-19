import "./App.css";

import { useEffect, useState } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import Nav from "./components/Nav";
import Main from "./pages/main/Main";
import { ImagesProvider } from "./context/imagesContext";
import { UpdateModal } from "./Update";

function App() {
  const [save, setSave] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const preventContextMenu = (event) => event.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);

    return () => document.removeEventListener("contextmenu", preventContextMenu);
  }, []);

  useEffect(() => {
    const handleZoomShortcut = (event) => {
      if (!event.ctrlKey || !["Equal", "Minus", "Digit0"].includes(event.code)) {
        return;
      }

      event.preventDefault();
      const currentZoom = Number.parseFloat(document.body.style.zoom) || 1;

      if (event.code === "Digit0") {
        document.body.style.zoom = "1";
        return;
      }

      const delta = event.code === "Equal" ? 0.1 : -0.1;
      document.body.style.zoom = String(
        Math.min(1.5, Math.max(0.8, Number((currentZoom + delta).toFixed(2)))),
      );
    };

    document.addEventListener("keydown", handleZoomShortcut);
    return () => document.removeEventListener("keydown", handleZoomShortcut);
  }, []);

  return (
    <div className="App">
      <UpdateModal />
      <Router>
        <Nav setLoading={setLoading} save={save} setSave={setSave} />
        <ImagesProvider>
          <Main save={save} setSave={setSave} loading={loading} />
        </ImagesProvider>
      </Router>
    </div>
  );
}

export default App;
