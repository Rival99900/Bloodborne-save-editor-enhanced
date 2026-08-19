function Nav({ save, name, status, onOpenSave, onSaveChanges }) {
  return (
    <nav className="nav" aria-label="Save file controls">
      <div className="brand-lockup">
        <img className="brand-mark" src="/assets/icon.png" alt="" />
        <div>
          <p className="brand-eyebrow">Bloodborne</p>
          <p className="brand-title">Save Editor</p>
        </div>
      </div>

      <div className="save-summary" aria-live="polite">
        <span className={`save-indicator ${save ? "is-loaded" : ""}`} aria-hidden="true" />
        <div>
          <p className="summary-label">{save ? "Active save" : "No save loaded"}</p>
          <p className="summary-value">{name || "Open a decrypted character file to begin"}</p>
          {status ? <p className="summary-status">{status}</p> : null}
        </div>
      </div>

      <div className="nav-actions">
        <button className="control-button control-button--quiet" id="openSave" onClick={onOpenSave}>
          Open save
        </button>
        <button
          className="control-button control-button--primary"
          disabled={!save}
          onClick={onSaveChanges}
        >
          Save changes
        </button>
      </div>
    </nav>
  );
}

export default Nav;
