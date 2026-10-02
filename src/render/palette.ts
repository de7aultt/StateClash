import type { FactionId } from '../core/types';

export interface FactionPalette {
  fill: string;
  stroke: string;
  glow: string;
  rgb: string;
}

export const FACTION_PALETTES: Record<FactionId, FactionPalette> = {
  player: { fill: '#0b2a44', stroke: '#3fc8ff', glow: 'rgba(63, 200, 255, 0.55)', rgb: '63, 200, 255' },
  crimson: { fill: '#3a0f16', stroke: '#ff4a5c', glow: 'rgba(255, 74, 92, 0.55)', rgb: '255, 74, 92' },
  amber: { fill: '#3a2308', stroke: '#ffa52e', glow: 'rgba(255, 165, 46, 0.55)', rgb: '255, 165, 46' },
  violet: { fill: '#2a1240', stroke: '#c77dff', glow: 'rgba(199, 125, 255, 0.55)', rgb: '199, 125, 255' },
  neutral: { fill: '#1a222e', stroke: '#6b7a90', glow: 'rgba(107, 122, 144, 0.3)', rgb: '107, 122, 144' },
};
