import type { EventBus } from '../core/events';
import type { GameEventMap, Vec2 } from '../core/types';
import { FACTION_PALETTES } from './palette';

const SPARK_POOL_SIZE = 320;
const BEAM_POOL_SIZE = 24;
const SPARKS_PER_CLASH = 9;
const SPARK_LIFE_SECONDS = 0.35;
const SPARK_MIN_SPEED = 40;
const SPARK_SPEED_RANGE = 110;
const BEAM_LIFE_SECONDS = 0.14;
const SPARK_COLOR = '#ffe7b0';
const BEAM_CORE_COLOR = '#ffffff';
const FULL_TURN = Math.PI * 2;

interface Spark {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  life: number;
}

interface Beam {
  from: Vec2;
  to: Vec2;
  color: string;
  life: number;
}

export class ParticleSystem {
  private readonly sparks: Spark[] = Array.from({ length: SPARK_POOL_SIZE }, () => ({
    x: 0,
    y: 0,
    velocityX: 0,
    velocityY: 0,
    life: 0,
  }));
  private readonly beams: Beam[] = Array.from({ length: BEAM_POOL_SIZE }, () => ({
    from: { x: 0, y: 0 },
    to: { x: 0, y: 0 },
    color: SPARK_COLOR,
    life: 0,
  }));
  private sparkCursor = 0;
  private beamCursor = 0;

  constructor(bus: EventBus<GameEventMap>) {
    bus.on('troop:clash', (position) => this.emitSparks(position));
    bus.on('tower:fired', ({ from, to, faction }) => this.emitBeam(from, to, FACTION_PALETTES[faction].stroke));
  }

  update(stepSeconds: number): void {
    for (const spark of this.sparks) {
      if (spark.life <= 0) continue;
      spark.life -= stepSeconds;
      spark.x += spark.velocityX * stepSeconds;
      spark.y += spark.velocityY * stepSeconds;
    }
    for (const beam of this.beams) beam.life -= stepSeconds;
  }

  render(context: CanvasRenderingContext2D): void {
    this.renderBeams(context);
    this.renderSparks(context);
  }

  private emitSparks(position: Vec2): void {
    for (let index = 0; index < SPARKS_PER_CLASH; index++) {
      const spark = this.sparks[this.sparkCursor];
      this.sparkCursor = (this.sparkCursor + 1) % this.sparks.length;
      const angle = Math.random() * FULL_TURN;
      const speed = SPARK_MIN_SPEED + Math.random() * SPARK_SPEED_RANGE;
      spark.x = position.x;
      spark.y = position.y;
      spark.velocityX = Math.cos(angle) * speed;
      spark.velocityY = Math.sin(angle) * speed;
      spark.life = SPARK_LIFE_SECONDS;
    }
  }

  private emitBeam(from: Vec2, to: Vec2, color: string): void {
    const beam = this.beams[this.beamCursor];
    this.beamCursor = (this.beamCursor + 1) % this.beams.length;
    beam.from = from;
    beam.to = to;
    beam.color = color;
    beam.life = BEAM_LIFE_SECONDS;
  }

  private renderSparks(context: CanvasRenderingContext2D): void {
    context.save();
    context.fillStyle = SPARK_COLOR;
    for (const spark of this.sparks) {
      if (spark.life <= 0) continue;
      context.globalAlpha = spark.life / SPARK_LIFE_SECONDS;
      context.fillRect(spark.x - 1.5, spark.y - 1.5, 3, 3);
    }
    context.restore();
  }

  private renderBeams(context: CanvasRenderingContext2D): void {
    context.save();
    context.lineCap = 'round';
    for (const beam of this.beams) {
      if (beam.life <= 0) continue;
      context.globalAlpha = beam.life / BEAM_LIFE_SECONDS;
      context.beginPath();
      context.moveTo(beam.from.x, beam.from.y);
      context.lineTo(beam.to.x, beam.to.y);
      context.strokeStyle = beam.color;
      context.lineWidth = 4;
      context.stroke();
      context.strokeStyle = BEAM_CORE_COLOR;
      context.lineWidth = 1.5;
      context.stroke();
    }
    context.restore();
  }
}
