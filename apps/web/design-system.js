const MODAL_SELECTOR = [
  "dialog[open]",
  '[role="dialog"]:not([hidden])',
  ".modal-overlay:not([hidden])",
  ".checkin-overlay",
  ".unlock-overlay",
  ".credit-offer-overlay"
].join(",");

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])'
].join(",");

let activeModal = null;
let restoreFocusTo = null;

function visibleFocusable(container) {
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)]
    .filter((node) => !node.hidden && node.getAttribute("aria-hidden") !== "true");
}

function closeModal(modal) {
  const close = modal.querySelector(
    ".modal-close, .checkin-close, [data-modal-close], [aria-label='关闭'], [aria-label='Close']"
  );
  if (close) close.click();
  else if (modal instanceof HTMLDialogElement) modal.close();
}

function activateModal(modal) {
  if (!modal || modal === activeModal) return;
  activeModal = modal;
  restoreFocusTo = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  modal.setAttribute("aria-modal", "true");
  if (!modal.getAttribute("role") && !(modal instanceof HTMLDialogElement)) modal.setAttribute("role", "dialog");
  if (!modal.hasAttribute("tabindex")) modal.tabIndex = -1;
  requestAnimationFrame(() => {
    const focusable = visibleFocusable(modal);
    (focusable[0] || modal).focus?.();
  });
}

function releaseModal(modal) {
  if (modal !== activeModal) return;
  activeModal = null;
  restoreFocusTo?.focus?.();
  restoreFocusTo = null;
}

function syncModalState() {
  const modal = document.querySelector(MODAL_SELECTOR);
  if (modal) activateModal(modal);
  else if (activeModal) releaseModal(activeModal);
}

function bindModalKeyboard() {
  document.addEventListener("keydown", (event) => {
    if (!activeModal) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal(activeModal);
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = visibleFocusable(activeModal);
    if (!focusable.length) {
      event.preventDefault();
      activeModal.focus?.();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

function ensureAccessibleControls(root = document) {
  root.querySelectorAll("button, a").forEach((control) => {
    if (control.getAttribute("aria-label") || control.textContent.trim()) return;
    const label = control.getAttribute("title") || control.dataset.tooltip;
    if (label) control.setAttribute("aria-label", label);
  });

  root.querySelectorAll("[data-field-error]").forEach((error, index) => {
    if (!error.id) error.id = `field-error-${index + 1}`;
    const field = error.closest("label, .field, .form-field")?.querySelector("input, textarea, select");
    if (!field) return;
    field.setAttribute("aria-describedby", error.id);
    field.setAttribute("aria-invalid", String(!error.hidden));
  });
}

export function setupVisualDesignSystem() {
  if (document.documentElement.dataset.visualDesignSystem === "ready") return;
  document.documentElement.dataset.visualDesignSystem = "ready";
  bindModalKeyboard();
  ensureAccessibleControls();
  syncModalState();
  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      record.addedNodes.forEach((node) => {
        if (node instanceof Element) ensureAccessibleControls(node);
      });
    });
    syncModalState();
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden", "open"] });
}
