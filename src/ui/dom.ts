export type IconName = 'coin' | 'sound-on' | 'sound-off' | 'pause' | 'shop' | 'double' | 'airdrop' | 'settings' | 'lock';

const LABEL_CLASS = 'icon-label';

export function createElement<Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  className: string,
  textContent = '',
): HTMLElementTagNameMap[Tag] {
  const element = document.createElement(tag);
  element.className = className;
  element.textContent = textContent;
  return element;
}

export function iconUrl(name: IconName): string {
  return `./art/${name}.png`;
}

export function createIcon(name: IconName, className = 'icon'): HTMLImageElement {
  const image = document.createElement('img');
  image.src = iconUrl(name);
  image.alt = '';
  image.className = className;
  image.draggable = false;
  return image;
}

export function createIconButton(className: string, icon: IconName, text = ''): HTMLButtonElement {
  const button = createElement('button', className);
  button.type = 'button';
  button.append(createIcon(icon), createElement('span', LABEL_CLASS, text));
  return button;
}

export function setButtonIcon(button: HTMLButtonElement, icon: IconName): void {
  const image = button.querySelector('img');
  if (image) image.src = iconUrl(icon);
}

export function setButtonLabel(button: HTMLButtonElement, text: string): void {
  const label = button.querySelector(`.${LABEL_CLASS}`);
  if (label) label.textContent = text;
}

export function createTextButton(className: string, text: string): HTMLButtonElement {
  const button = createElement('button', className, text);
  button.type = 'button';
  return button;
}
