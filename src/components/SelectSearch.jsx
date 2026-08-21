import { useEffect, useRef, useState } from "react";
import { FixedSizeList as List } from "react-window";
import { useFloating, flip, offset, autoUpdate } from "@floating-ui/react";
import { useLocalization } from "../i18n/localization";

function getSelectedLabel(options, selected) {
  const value = selected == null ? "" : String(selected);
  const normalizedValue = value.trim().toLowerCase();
  const matchingOption = options.find(
    (option) =>
      String(option.label ?? "").trim().toLowerCase() === normalizedValue ||
      String(option.value ?? "").trim() === value.trim(),
  );

  return matchingOption?.label ?? value;
}

function SelectSearch({
  options,
  selected,
  readOnly = false,
  onChange,
  style,
  defaultValue,
  compact = false,
  maxListHeight = 280,
}) {
  const { t } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const resolvedSelectedLabel = getSelectedLabel(options, selected);
  const [search, setSearch] = useState(
    resolvedSelectedLabel === defaultValue ? "" : resolvedSelectedLabel,
  );
  // Tracks whether the current `search` value came from the user typing in the
  // box, as opposed to `selected` changing programmatically (e.g. a Gem Forge
  // preset being applied). Only a genuine user-driven empty search should be
  // treated as "clear this slot" below.
  const userEditedRef = useRef(false);

  // 1. Initialize Floating UI
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    middleware: [
      offset(4), // Little gap between input and dropdown
      flip({ fallbackAxisSideDirection: "start" }), // Automatically opens up if bottom is blocked
    ],
    whileElementsMounted: autoUpdate, // Keeps positioning accurate if window resizes/scrolls
  });

  const dropdownRef = useRef();

  // Handle outside clicks safely
  useEffect(() => {
    function toggle(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", toggle);
    return () => document.removeEventListener("mousedown", toggle);
  }, []);

  useEffect(() => {
    // A prop-driven update (preset applied, gem reloaded, etc.) is not a user
    // edit, so it must not arm the auto-reset-to-"No Effect" logic below.
    userEditedRef.current = false;
    setSearch(resolvedSelectedLabel === defaultValue ? "" : resolvedSelectedLabel);
  }, [resolvedSelectedLabel, defaultValue]);

  useEffect(() => {
    if (
      userEditedRef.current &&
      !search.trim() &&
      !isOpen &&
      selected !== defaultValue
    ) {
      if (typeof onChange === "function") {
        onChange({
          label: t("forge.noEffect"),
          rating: 95,
          level: 0,
          name: "",
          value: "4294967295",
        });
      }
      userEditedRef.current = false;
    }
  }, [search, isOpen, selected, defaultValue, onChange, t]);

  const filteredOptions = options.filter((x) =>
    !readOnly ? x.label.toLowerCase().includes(search.toLowerCase()) : true,
  );

  function Row({ index, style: rowStyle }) {
    return (
      <div
        style={{
          ...rowStyle,
          background: "black",
          borderBottom: "1px solid #444",
          fontSize: compact ? "14px" : "16px",
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => {
          setSearch(filteredOptions[index].label);
          if (typeof onChange === "function") {
            onChange(filteredOptions[index]);
          }
          setIsOpen(false); // Close menu on select
        }}
      >
        {filteredOptions[index].label}
      </div>
    );
  }

  return (
    // Attach the outside click ref and base styles here
    <div className={`select-search${compact ? " select-search--compact" : ""}`} ref={dropdownRef} style={{ position: "relative", ...style }}>
      {/* 2. Attach reference ref to the trigger container */}
      <div ref={refs.setReference} style={{ width: "100%" }}>
        <input
          value={search}
          readOnly={readOnly}
          placeholder={defaultValue}
          aria-expanded={isOpen}
          onFocus={() => setIsOpen(true)}
          onChange={({ target: { value } }) => {
            userEditedRef.current = true;
            setSearch(value);
          }}
          style={{
            width: "100%",
            background: "none",
            minHeight: compact ? "2.1rem" : "2.35rem",
            fontSize: compact ? "15px" : "16px",
            textAlign: "inherit",
          }}
        />
      </div>

      {/* 3. Dropdown Menu */}
      {isOpen && (
        <div
          ref={refs.setFloating}
          style={{
            ...floatingStyles, // Floating UI injects left/top absolute coordinates dynamically
            width: dropdownRef.current
              ? dropdownRef.current.offsetWidth
              : "100%",
            zIndex: 9999,
            background: "black",
            border: "1px solid #444",
            boxShadow: "0px 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          <List
            height={Math.min(maxListHeight, filteredOptions.length * (compact ? 32 : 34))}
            itemCount={filteredOptions.length}
            itemSize={compact ? 32 : 34}
            width="100%"
            overscanCount={10}
          >
            {Row}
          </List>
        </div>
      )}
    </div>
  );
}

export default SelectSearch;
