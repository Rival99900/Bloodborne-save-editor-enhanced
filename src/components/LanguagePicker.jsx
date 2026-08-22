import { useEffect, useId, useRef, useState } from "react";
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react";
import { SUPPORTED_LANGUAGES, useLocalization } from "../i18n/localization";

function LanguagePicker() {
  const { language, setLanguage, t } = useLocalization();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const optionRefs = useRef([]);
  const listboxId = useId();
  const selectedIndex = Math.max(0, SUPPORTED_LANGUAGES.findIndex(({ code }) => code === language));
  const [activeIndex, setActiveIndex] = useState(selectedIndex);
  const selectedLanguage = SUPPORTED_LANGUAGES[selectedIndex];
  const { refs, floatingStyles } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom-start",
    middleware: [offset(6), flip({ padding: 10 }), shift({ padding: 10 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => optionRefs.current[activeIndex]?.focus());
    return () => cancelAnimationFrame(frame);
  }, [activeIndex, isOpen]);

  useEffect(() => {
    function handlePointerDown(event) {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function closePicker(restoreFocus = false) {
    setIsOpen(false);
    if (restoreFocus) requestAnimationFrame(() => refs.domReference.current?.focus());
  }

  function moveActive(nextIndex) {
    const normalized = (nextIndex + SUPPORTED_LANGUAGES.length) % SUPPORTED_LANGUAGES.length;
    setActiveIndex(normalized);
  }

  function openPicker(index = selectedIndex) {
    setActiveIndex(index);
    setIsOpen(true);
  }

  function chooseLanguage(code) {
    setLanguage(code);
    closePicker(true);
  }

  return (
    <div className="language-picker" ref={containerRef}>
      <span className="language-picker__label" id={`${listboxId}-label`}>
        {t("language.label")}
      </span>
      <button
        ref={refs.setReference}
        className="language-picker__trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-labelledby={`${listboxId}-label`}
        onClick={() => {
          if (isOpen) closePicker();
          else openPicker();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            openPicker(Math.min(selectedIndex + 1, SUPPORTED_LANGUAGES.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            openPicker(Math.max(selectedIndex - 1, 0));
          } else if (event.key === "Home") {
            event.preventDefault();
            openPicker(0);
          } else if (event.key === "End") {
            event.preventDefault();
            openPicker(SUPPORTED_LANGUAGES.length - 1);
          }
        }}
      >
        <span>{selectedLanguage.label}</span>
        <span className="language-picker__chevron" aria-hidden="true" />
      </button>
      {isOpen ? (
        <div
          ref={refs.setFloating}
          className="language-picker__menu"
          id={listboxId}
          role="listbox"
          aria-labelledby={`${listboxId}-label`}
          style={{ ...floatingStyles, width: refs.domReference.current?.offsetWidth }}
        >
          {SUPPORTED_LANGUAGES.map(({ code, label }, index) => (
            <button
              ref={(element) => { optionRefs.current[index] = element; }}
              className="language-picker__option"
              key={code}
              type="button"
              role="option"
              aria-selected={code === language}
              tabIndex={index === activeIndex ? 0 : -1}
              onClick={() => chooseLanguage(code)}
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  moveActive(index + 1);
                } else if (event.key === "ArrowUp") {
                  event.preventDefault();
                  moveActive(index - 1);
                } else if (event.key === "Home") {
                  event.preventDefault();
                  moveActive(0);
                } else if (event.key === "End") {
                  event.preventDefault();
                  moveActive(SUPPORTED_LANGUAGES.length - 1);
                } else if (event.key === "Escape") {
                  event.preventDefault();
                  closePicker(true);
                }
              }}
            >
              <span>{label}</span>
              {code === language ? <span className="language-picker__selected" aria-hidden="true">✓</span> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default LanguagePicker;
