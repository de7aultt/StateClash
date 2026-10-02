import type { EventBus } from '../core/events';
import type { GameEventMap, Size } from '../core/types';

export class Viewport {
  readonly context: CanvasRenderingContext2D;
  private size: Size = { width: 0, height: 0 };
  private pixelRatio = 1;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly bus: EventBus<GameEventMap>,
  ) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('2D canvas context is not available');
    this.context = context;
    window.addEventListener('resize', this.resize);
    window.addEventListener('orientationchange', this.resize);
    this.resize();
  }

  get width(): number {
    return this.size.width;
  }

  get ratio(): number {
    return this.pixelRatio;
  }

  get height(): number {
    return this.size.height;
  }

  beginFrame(offsetX = 0, offsetY = 0): void {
    this.context.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    this.context.clearRect(0, 0, this.size.width, this.size.height);
    this.context.translate(offsetX, offsetY);
  }

  dispose(): void {
    window.removeEventListener('resize', this.resize);
    window.removeEventListener('orientationchange', this.resize);
  }

  private readonly resize = (): void => {
    const bounds = this.canvas.getBoundingClientRect();
    this.pixelRatio = window.devicePixelRatio || 1;
    this.size = { width: bounds.width, height: bounds.height };
    this.canvas.width = Math.round(bounds.width * this.pixelRatio);
    this.canvas.height = Math.round(bounds.height * this.pixelRatio);
    this.bus.emit('viewport:resized', { ...this.size, pixelRatio: this.pixelRatio });
  };
}
