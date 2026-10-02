export class LabelSet {
  private readonly renderers: Array<() => void> = [];

  add(render: () => void): void {
    render();
    this.renderers.push(render);
  }

  text(element: HTMLElement, resolve: () => string): void {
    this.add(() => {
      element.textContent = resolve();
    });
  }

  refresh(): void {
    for (const render of this.renderers) render();
  }
}
