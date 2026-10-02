import type { EventBus } from '../core/events';
import type { GameEventMap, MatchResult } from '../core/types';
import { BOT_FACTIONS } from './ai-profiles';
import type { NodeSystem } from './node-system';
import type { TroopSystem } from './troop-system';

export class MatchReferee {
  private currentLevel = 1;
  private elapsedSeconds = 0;
  private finished = true;

  constructor(
    private readonly bus: EventBus<GameEventMap>,
    private readonly nodes: NodeSystem,
    private readonly troops: TroopSystem,
    private readonly calculateReward: (victory: boolean, elapsedSeconds: number) => number,
  ) {}

  get level(): number {
    return this.currentLevel;
  }

  begin(level: number): void {
    this.currentLevel = level;
    this.elapsedSeconds = 0;
    this.finished = false;
  }

  update(stepSeconds: number): void {
    if (this.finished) return;
    this.elapsedSeconds += stepSeconds;
    if (this.playerEliminated()) this.finish('battle:defeat');
    else if (this.botsEliminated()) this.finish('battle:victory');
  }

  private playerEliminated(): boolean {
    const ownsNode = this.nodes.nodes.some((node) => node.faction === 'player');
    return !ownsNode && !this.troops.hasForces('player');
  }

  private botsEliminated(): boolean {
    const botOwnsNode = this.nodes.nodes.some((node) => node.faction !== 'player' && node.faction !== 'neutral');
    return !botOwnsNode && !BOT_FACTIONS.some((faction) => this.troops.hasForces(faction));
  }

  private finish(event: 'battle:victory' | 'battle:defeat'): void {
    this.finished = true;
    const seconds = Math.round(this.elapsedSeconds);
    const result: MatchResult = {
      level: this.currentLevel,
      seconds,
      coins: this.calculateReward(event === 'battle:victory', seconds),
    };
    this.bus.emit(event, result);
  }
}
