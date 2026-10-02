import type { EventBus } from './events';
import type { GameEventMap } from './types';

const FIXED_STEP_SECONDS = 1 / 60;
const MAX_FRAME_SECONDS = 0.1;
const MILLISECONDS_PER_SECOND = 1000;

export interface LoopCallbacks {
  update: (stepSeconds: number) => void;
  render: (alpha: number) => void;
}

export class GameLoop {
  private frameHandle = 0;
  private lastTimestamp = 0;
  private accumulator = 0;
  private running = false;

  constructor(
    private readonly callbacks: LoopCallbacks,
    private readonly bus: EventBus<GameEventMap>,
  ) {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  start(): void {
    if (this.running || document.hidden) return;
    this.running = true;
    this.lastTimestamp = performance.now();
    this.accumulator = 0;
    this.frameHandle = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameHandle);
  }

  dispose(): void {
    this.stop();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }

  private readonly tick = (timestamp: number): void => {
    if (!this.running) return;
    const elapsedSeconds = (timestamp - this.lastTimestamp) / MILLISECONDS_PER_SECOND;
    this.lastTimestamp = timestamp;
    this.accumulator += Math.min(elapsedSeconds, MAX_FRAME_SECONDS);

    while (this.accumulator >= FIXED_STEP_SECONDS) {
      this.callbacks.update(FIXED_STEP_SECONDS);
      this.accumulator -= FIXED_STEP_SECONDS;
    }

    this.callbacks.render(this.accumulator / FIXED_STEP_SECONDS);
    this.frameHandle = requestAnimationFrame(this.tick);
  };

  private readonly handleVisibilityChange = (): void => {
    this.bus.emit('visibility:changed', { hidden: document.hidden });
    if (document.hidden) {
      this.stop();
    } else {
      this.start();
    }
  };
}
