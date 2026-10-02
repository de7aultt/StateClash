import type { EventBus } from '../core/events';
import type { DragState, GameEventMap, NodeEntity } from '../core/types';
import type { NodeSystem } from '../game/node-system';
import type { TroopSystem } from '../game/troop-system';

const TOWER_MIN_LAUNCH_TROOPS = 2;

interface MutableDragState extends DragState {
  chainIds: number[];
}

function canLaunchFrom(node: NodeEntity | undefined, target: NodeEntity): node is NodeEntity {
  if (node === undefined || node.faction !== 'player' || node.id === target.id) return false;
  return node.type !== 'tower' || node.troops >= TOWER_MIN_LAUNCH_TROOPS;
}

export class InputManager {
  private selectedNodeId: number | null = null;
  private dragState: MutableDragState | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly nodes: NodeSystem,
    private readonly troops: TroopSystem,
    private readonly bus: EventBus<GameEventMap>,
  ) {
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerCancel);
  }

  get drag(): DragState | null {
    return this.dragState;
  }

  clearSelection(): void {
    this.dragState = null;
    this.select(null);
  }

  dispose(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerUp);
    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);
  }

  private select(nodeId: number | null): void {
    if (this.selectedNodeId === nodeId) return;
    this.selectedNodeId = nodeId;
    this.bus.emit('node:selected', { nodeId });
  }

  private locate(event: PointerEvent): { x: number; y: number; node: NodeEntity | undefined } {
    const bounds = this.canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    return { x, y, node: this.nodes.findAt(x, y) };
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const { x, y, node } = this.locate(event);
    if (!node || node.faction !== 'player') {
      this.dragState = null;
      this.select(node?.id ?? null);
      return;
    }
    this.dragState = { chainIds: [node.id], pointerX: x, pointerY: y, targetId: null };
    this.canvas.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    const drag = this.dragState;
    if (!drag) return;
    const { x, y, node } = this.locate(event);
    drag.pointerX = x;
    drag.pointerY = y;
    if (node && node.faction === 'player' && node.type !== 'tower' && !drag.chainIds.includes(node.id)) {
      drag.chainIds.push(node.id);
    }
    drag.targetId = node && !drag.chainIds.includes(node.id) ? node.id : null;
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    const drag = this.dragState;
    if (!drag) return;
    this.dragState = null;
    if (this.canvas.hasPointerCapture(event.pointerId)) this.canvas.releasePointerCapture(event.pointerId);
    const { node: hovered } = this.locate(event);
    const node = hovered ?? (drag.targetId !== null ? this.nodes.getById(drag.targetId) : undefined);
    if (drag.chainIds.length === 1 && node?.id === drag.chainIds[0]) {
      this.handleTap(node);
      return;
    }
    if (node) this.launch(drag.chainIds, node);
  };

  private readonly handlePointerCancel = (): void => {
    this.dragState = null;
  };

  private handleTap(node: NodeEntity): void {
    if (node.id === this.selectedNodeId) {
      this.nodes.tryUpgrade(node.id);
      return;
    }
    this.select(node.id);
  }

  private launch(chainIds: readonly number[], released: NodeEntity): void {
    let sourceIds = chainIds;
    if (chainIds.includes(released.id)) {
      const isChainEnd = chainIds.length >= 2 && chainIds[chainIds.length - 1] === released.id;
      if (!isChainEnd) return;
      sourceIds = chainIds.slice(0, -1);
    }
    const sources = sourceIds.map((nodeId) => this.nodes.getById(nodeId)).filter((node): node is NodeEntity => canLaunchFrom(node, released));
    if (sources.length === 0) return;
    this.troops.dispatchWave(sources, released);
    this.select(null);
  }
}
