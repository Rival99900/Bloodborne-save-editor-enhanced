import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FloatingPortal, autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react";

function DarkSelect({
  options,
  value,
  onChange,
  ariaLabel,
  className = "",
  placeholder = "",
  disabled = false,
  renderValue,
  renderOption,
}) {
  const normalizedOptions = useMemo(
    () => options.map((option, index) => (
      typeof option === "object" ? option : { label: String(option), value: index }
    )),
    [options],
  );
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const optionRefs = useRef([]);
  const listboxId = useId();
  const selectedIndex = normalizedOptions.findIndex((option) => String(option.value) === String(value));
  const selectedOption = selectedIndex >= 0 ? normalizedOptions[selectedIndex] : null;
  const [activeIndex, setActiveIndex] = useState(Math.max(0, selectedIndex));
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
      const clickedTrigger = containerRef.current?.contains(event.target);
      const clickedMenu = refs.floating.current?.contains(event.target);
      if (!clickedTrigger && !clickedMenu) setIsOpen(false);
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

  function openPicker(index = Math.max(0, selectedIndex)) {
    setActiveIndex(Math.max(0, index));
    setIsOpen(true);
  }

  function moveActive(nextIndex) {
    const count = normalizedOptions.length;
    setActiveIndex((nextIndex + count) % count);
  }

  function choose(option) {
    onChange?.(option.value, option);
    closePicker(true);
  }

  function handleTriggerKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openPicker(selectedIndex < 0 ? 0 : Math.min(selectedIndex + 1, normalizedOptions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      openPicker(Math.max(selectedIndex - 1, 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      openPicker(0);
    } else if (event.key === "End") {
      event.preventDefault();
      openPicker(normalizedOptions.length - 1);
    }
  }

  return (
    <div className={`dark-select ${className}`.trim()} ref={containerRef}>
      <button
        ref={refs.setReference}
        className="dark-select__trigger"
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled || normalizedOptions.length === 0}
        onClick={() => (isOpen ? closePicker() : openPicker())}
        onKeyDown={handleTriggerKeyDown}
      >
        <span className={selectedOption ? "" : "dark-select__placeholder"}>
          {selectedOption ? (renderValue?.(selectedOption) ?? selectedOption.label) : placeholder}
        </span>
        <span className="dark-select__chevron" aria-hidden="true" />
      </button>
      {isOpen ? (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            className="dark-select__menu"
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            style={{ ...floatingStyles, width: refs.domReference.current?.offsetWidth }}
          >
            {normalizedOptions.map((option, index) => (
              <button
                ref={(element) => { optionRefs.current[index] = element; }}
                className="dark-select__option"
                key={`${option.value}-${index}`}
                type="button"
                role="option"
                aria-selected={String(option.value) === String(value)}
                tabIndex={index === activeIndex ? 0 : -1}
                onClick={() => choose(option)}
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
                    moveActive(normalizedOptions.length - 1);
                  } else if (event.key === "Escape") {
                    event.preventDefault();
                    closePicker(true);
                  }
                }}
              >
                {renderOption?.(option, String(option.value) === String(value)) ?? (
                  <>
                    <span>{option.label}</span>
                    {String(option.value) === String(value) ? <span className="dark-select__selected" aria-hidden="true">✓</span> : null}
                  </>
                )}
              </button>
            ))}
          </div>
        </FloatingPortal>
      ) : null}
    </div>
  );
}

export default DarkSelect;
