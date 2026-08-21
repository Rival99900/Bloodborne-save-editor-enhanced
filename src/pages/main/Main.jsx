import { useContext } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import SideBar from "./SideBar";
import Inventory from "../inventory/Inventory";
import Stats from "../stats/Stats";
import Character from "../character/Character";
import { SaveContext } from "../../context/context";
import { ItemsProvider } from "../../context/itemsContext";
import { ImagesContext } from "../../context/imagesContext";
import { useLocalization } from "../../i18n/localization";
import EquippedGems from "./EquippedGems";
import Bosses from "../bosses/Bosses";
import Flags from "../flags/Flags";

const Main = ({ save, setSave, loading }) => {
  const { loading: loadingImages } = useContext(ImagesContext);
  const { t } = useLocalization();

  return (
    <>
      <div
        className={`startup-overlay ${loadingImages ? "" : "fade-out"}`}
        aria-hidden={!loadingImages}
      >
        <img src="/assets/icon.png" width="120" height="120" alt="" />
        <p>{t("operation.preparing")}</p>
        <div className="spinner" />
      </div>

      <main className="editor-shell">
        <SaveContext.Provider value={{ save, setSave }}>
          <SideBar />

          {loading ? (
            <div className="operation-state" role="status">
              <div className="spinner" />
              <div>
                <p className="operation-state__eyebrow">{t("operation.eyebrow")}</p>
                <p className="operation-state__title">{t("operation.title")}</p>
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
              <p className="empty-state__eyebrow">{t("home.eyebrow")}</p>
              <h1 id="welcome-title">{t("home.title")}</h1>
              <p className="empty-state__lead">{t("home.lead")}</p>

              <div className="empty-state__grid">
                <article>
                  <span className="step-number">01</span>
                  <h2>{t("home.stepOneTitle")}</h2>
                  <p>{t("home.stepOneDescription")}</p>
                </article>
                <article>
                  <span className="step-number">02</span>
                  <h2>{t("home.stepTwoTitle")}</h2>
                  <p>{t("home.stepTwoDescription")}</p>
                </article>
                <article>
                  <span className="step-number">03</span>
                  <h2>{t("home.stepThreeTitle")}</h2>
                  <p>{t("home.stepThreeDescription")}</p>
                </article>
              </div>

              <a
                className="help-link"
                href="https://github.com/Noxde/Bloodborne-save-editor/wiki/How-to-decrypt-a-save"
                target="_blank"
                rel="noreferrer"
              >
                {t("home.guide")}
              </a>
            </section>
          )}
        </SaveContext.Provider>
      </main>
    </>
  );
};

export default Main;
