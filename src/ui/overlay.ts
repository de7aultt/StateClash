export function closeOnEscape(isOpen: () => boolean, close: () => void): void {
  window.addEventListener(
    'keydown',
    (event) => {
      if (!isOpen() || event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      close();
    },
    true,
  );
}
