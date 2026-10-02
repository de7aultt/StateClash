import type { ArenaId, NodeEntity, Vec2 } from '../core/types';
import { buildContinent } from '../game/continent';
import { computeVoronoi } from '../game/voronoi';
import { BIOMES, type Biome } from './biomes';
import { FACTION_PALETTES } from './palette';
import type { Viewport } from './viewport';

const CONTINENT_MARGIN = 70;
const SHELF_BANDS: ReadonlyArray<readonly [number, number]> = [
  [36, 0.04],
  [22, 0.07],
  [11, 0.11],
];
const BORDER_SHADOW = 'rgba(4, 8, 14, 0.9)';
const NEUTRAL_FILL_ALPHA = 0.12;
const OWNED_FILL_ALPHA = 0.3;

function toPath(points: readonly Vec2[]): Path2D {
  const path = new Path2D();
  points.forEach((point, index) => (index === 0 ? path.moveTo(point.x, point.y) : path.lineTo(point.x, point.y)));
  path.closePath();
  return path;
}

export class ProvinceRenderer {
  private geometryOwner: readonly NodeEntity[] | null = null;
  private coast: Path2D | null = null;
  private provinces = new Map<number, Path2D>();
  private layer: HTMLCanvasElement | null = null;
  private layerKey = '';

  render(viewport: Viewport, nodes: readonly NodeEntity[], arena: ArenaId): void {
    if (nodes !== this.geometryOwner) this.rebuildGeometry(nodes);
    const biome = BIOMES[arena];
    const key = `${arena}:${viewport.width}x${viewport.height}@${viewport.ratio}`;
    if (!this.layer || key !== this.layerKey) {
      this.layer = this.buildLayer(biome, viewport.width, viewport.height, viewport.ratio);
      this.layerKey = key;
    }
    const { context } = viewport;
    context.drawImage(this.layer, 0, 0, viewport.width, viewport.height);
    this.drawProvinces(context, nodes);
    if (this.coast) {
      context.strokeStyle = biome.coastColor;
      context.lineWidth = 2;
      context.stroke(this.coast);
    }
  }

  private rebuildGeometry(nodes: readonly NodeEntity[]): void {
    this.geometryOwner = nodes;
    this.layer = null;
    this.provinces = new Map();
    this.coast = null;
    if (nodes.length === 0) return;
    const outline = buildContinent(nodes, CONTINENT_MARGIN);
    this.coast = toPath(outline);
    for (const [nodeId, cell] of computeVoronoi(nodes, outline)) this.provinces.set(nodeId, toPath(cell));
  }

  private buildLayer(biome: Biome, width: number, height: number, ratio: number): HTMLCanvasElement {
    const layer = document.createElement('canvas');
    layer.width = Math.max(1, Math.ceil(width * ratio));
    layer.height = Math.max(1, Math.ceil(height * ratio));
    const context = layer.getContext('2d');
    if (!context) return layer;
    context.scale(ratio, ratio);
    const ocean = context.createLinearGradient(0, 0, 0, height);
    ocean.addColorStop(0, biome.oceanTop);
    ocean.addColorStop(1, biome.oceanBottom);
    context.fillStyle = ocean;
    context.fillRect(0, 0, width, height);
    if (!this.coast) return layer;
    context.lineJoin = 'round';
    for (const [lineWidth, alpha] of SHELF_BANDS) {
      context.strokeStyle = `rgba(${biome.shelfRgb}, ${alpha})`;
      context.lineWidth = lineWidth;
      context.stroke(this.coast);
    }
    context.fillStyle = biome.landColor;
    context.fill(this.coast);
    return layer;
  }

  private drawProvinces(context: CanvasRenderingContext2D, nodes: readonly NodeEntity[]): void {
    context.save();
    context.lineJoin = 'round';
    for (const node of nodes) {
      const path = this.provinces.get(node.id);
      if (!path) continue;
      const alpha = node.faction === 'neutral' ? NEUTRAL_FILL_ALPHA : OWNED_FILL_ALPHA;
      context.fillStyle = `rgba(${FACTION_PALETTES[node.faction].rgb}, ${alpha})`;
      context.fill(path);
    }
    for (const node of nodes) {
      const path = this.provinces.get(node.id);
      if (!path) continue;
      context.strokeStyle = BORDER_SHADOW;
      context.lineWidth = 3.5;
      context.stroke(path);
      context.strokeStyle = `rgba(${FACTION_PALETTES[node.faction].rgb}, 0.85)`;
      context.lineWidth = 1.3;
      context.stroke(path);
    }
    context.restore();
  }
}
