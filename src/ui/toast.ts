import { createElement, createIcon, type IconName } from './dom';

const TOAST_DURATION_MS = 1800;

export function showToast(root: HTMLElement, message: string, icon?: IconName): void {
  const toast = createElement('div', 'toast');
  if (icon) toast.append(createIcon(icon));
  toast.append(createElement('span', 'icon-label', message));
  root.append(toast);
  window.setTimeout(() => toast.remove(), TOAST_DURATION_MS);
}
