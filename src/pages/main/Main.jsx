import { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SideBar from "./SideBar";
import Inventory from "../inventory/Inventory";
import Stats from "../stats/Stats";
import Character from "../character/Character";
import { SaveContext } from "../../context/context";
import { ItemsProvider } from "../../context/itemsContext";
import { ImagesContext } from "../../context/imagesContext";
import EquippedGems from "./EquippedGems";
import Bosses from "../bosses/Bosses";
import Flags from "../flags/Flags";

const Main = ({ save, setSave, loading }) => {
  const { loading: loadingImages } = useContext(ImagesContext);

  return (
    <>
      <div
        className={`startup-overlay ${loadingImages ? "" : "fade-out"}`}
        aria-hidden={!loadingImages}
      >
        <img src="/assets/icon.png" width="120" height="120" alt="" />
        <p>Preparing editor</p>
        <div className="spinner" />
      </div>

      <main className="editor-shell">
        <SaveContext.Provider value={{ save, setSave }}>
          <SideBar />

          <section className="workspace" aria-live="polite">
            {loading ? (
              <div className="operation-state" role="status">
                <div className="spinner" />
                <div>
                  <p className="operation-state__eyebrow">Working with save data</p>
                  <p className="operation-state__title">Please keep this window open.</p>
                </div>
              </div>
            ) : null}

            {save ? (
              <Routes>
                <Route
                  path="/"
                  element={
                    <ItemsProvider>
                      <Inventory key="inventory" inv={save.inventory} isStorage={false} />
                    </ItemsProvider>
                  }
                />
                <Route
                  path="/storage"
                  element={
                    <ItemsProvider>
                      <Inventory key="storage" inv={save.storage} isStorage />
                    </ItemsProvider>
                  }
                />
                <Route path="/stats" element={<Stats />} />
                <Route path="/character" element={<Character />} />
                <Route
                  path="/equippedGems"
                  element={
                    <ItemsProvider>
                      <EquippedGems />
                    </ItemsProvider>
                  }
                />
                <Route path="/bosses" element={<Bosses />} />
                <Route path="/flags" element={<Flags />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            ) : (
              <section className="empty-state" aria-labelledby="welcome-title">
                <p className="empty-state__eyebrow">Offline character management</p>
                <h1 id="welcome-title">Edit deliberately. Preserve your hunt.</h1>
                <p className="empty-state__lead">
                  Open a decrypted Bloodborne character save to inspect inventory, attributes,
                  character settings, bosses and flags. The editor creates a backup when a file is
                  opened; always retain it until you have checked the result in-game.
                </p>

                <div className="empty-state__grid">
                  <article>
                    <span className="step-number">01</span>
                    <h2>Use a decrypted save</h2>
                    <p>
                      PlayStation exports must be decrypted before they can be read by the editor.
                    </p>
                  </article>
                  <article>
                    <span className="step-number">02</span>
                    <h2>Make focused edits</h2>
                    <p>
                      Review each change and avoid using modified saves in online play.
                    </p>
                  </article>
                  <article>
                    <span className="step-number">03</span>
                    <h2>Verify before replacing</h2>
                    <p>
                      Test the exported file before removing the automatic <code>.bak</code> copy.
                    </p>
                  </article>
                </div>

                <a
                  className="help-link"
                  href="https://github.com/Noxde/Bloodborne-save-editor/wiki/How-to-decrypt-a-save"
                  target="_blank"
                  rel="noreferrer"
                >
                  Read the decryption guide
                </a>
              </section>
            )}
          </section>
        </SaveContext.Provider>
      </main>
    </>
  );
};

export default Main;
