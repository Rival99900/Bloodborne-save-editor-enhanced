import { useEffect, useRef } from "react";

// Open dialogs, innermost last. Only the top dialog handles Escape and Tab, so
// a confirmation opened over the Gem editor closes alone.
const dialogStack = [];

// Keep keyboard navigation inside the active confirmation/status dialog.
export default function useDialogFocus(onClose) {
  const panelRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const buttons = () => Array.from(panelRef.current?.querySelectorAll(
      'summary, button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
    ) ?? []).filter((element) => element.getClientRects().length);
    const entry = {};
    dialogStack.push(entry);
    const frame = requestAnimationFrame(() => buttons()[0]?.focus());
    function handleKeyDown(event) {
      if (dialogStack.at(-1) !== entry) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeRef.current?.();
      } else if (event.key === "Tab") {
        const elements = buttons();
        const first = elements[0];
        const last = elements.at(-1);
        if (!first) { event.preventDefault(); return; }
        if (!panelRef.current?.contains(document.activeElement) ||
            (event.shiftKey && document.activeElement === first) ||
            (!event.shiftKey && document.activeElement === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown, true);
      const index = dialogStack.indexOf(entry);
      if (index !== -1) dialogStack.splice(index, 1);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return panelRef;
}
