import type { Vec2 } from '../core/types';

const MAX_OFFSET_PIXELS = 14;
const TRAUMA_DECAY_PER_SECOND = 1.8;

export class ScreenShake {
  private trauma = 0;

  addTrauma(amount: number): void {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  update(stepSeconds: number): void {
    this.trauma = Math.max(0, this.trauma - TRAUMA_DECAY_PER_SECOND * stepSeconds);
  }

  sampleOffset(): Vec2 {
    if (this.trauma <= 0) return { x: 0, y: 0 };
    const magnitude = MAX_OFFSET_PIXELS * this.trauma * this.trauma;
    return { x: (Math.random() * 2 - 1) * magnitude, y: (Math.random() * 2 - 1) * magnitude };
  }
}
