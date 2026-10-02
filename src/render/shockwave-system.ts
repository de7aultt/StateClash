import type { EventBus } from '../core/events';
import type { GameEventMap } from '../core/types';
import type { NodeSystem } from '../game/node-system';
import { FACTION_PALETTES } from './palette';

const POOL_SIZE = 16;
const LIFE_SECONDS = 0.35;
const EXPANSION_PIXELS = 45;
const FULL_TURN = Math.PI * 2;

interface Shockwave {
  x: number;
  y: number;
  startRadius: number;
  color: string;
  life: number;
}

export class ShockwaveSystem {
  private readonly rings: Shockwave[] = Array.from({ length: POOL_SIZE }, () => ({
    x: 0,
    y: 0,
    startRadius: 0,
    color: '#ffffff',
    life: 0,
  }));
  private cursor = 0;

  constructor(
    bus: EventBus<GameEventMap>,
    private readonly nodes: NodeSystem,
  ) {
    bus.on('node:captured', ({ nodeId }) => this.spawnAt(nodeId));
    bus.on('node:upgraded', ({ nodeId }) => this.spawnAt(nodeId));
  }

  update(stepSeconds: number): void {
    for (const ring of this.rings) ring.life -= stepSeconds;
  }

  render(context: CanvasRenderingContext2D): void {
    context.save();
    for (const ring of this.rings) {
      if (ring.life <= 0) continue;
      const remaining = ring.life / LIFE_SECONDS;
      context.globalAlpha = remaining;
      context.strokeStyle = ring.color;
      context.lineWidth = 1 + 3 * remaining;
      context.beginPath();
      context.arc(ring.x, ring.y, ring.startRadius + EXPANSION_PIXELS * (1 - remaining), 0, FULL_TURN);
      context.stroke();
    }
    context.restore();
  }

  private spawnAt(nodeId: number): void {
    const node = this.nodes.getById(nodeId);
    if (!node) return;
    const ring = this.rings[this.cursor];
    this.cursor = (this.cursor + 1) % this.rings.length;
    ring.x = node.x;
    ring.y = node.y;
    ring.startRadius = node.radius;
    ring.color = FACTION_PALETTES[node.faction].stroke;
    ring.life = LIFE_SECONDS;
  }
}
