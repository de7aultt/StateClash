import type { ArenaId } from '../core/types';

export interface Biome {
  backgroundCenter: string;
  backgroundEdge: string;
  contourRgb: string;
  oceanTop: string;
  oceanBottom: string;
  shelfRgb: string;
  landColor: string;
  coastColor: string;
}

export const BIOMES: Record<ArenaId, Biome> = {
  cyber: {
    backgroundCenter: '#0d1726',
    backgroundEdge: '#070b12',
    contourRgb: '70, 110, 160',
    oceanTop: 'rgba(4, 14, 30, 0.8)',
    oceanBottom: 'rgba(6, 30, 54, 0.7)',
    shelfRgb: '90, 170, 220',
    landColor: 'rgba(14, 26, 40, 0.96)',
    coastColor: '#5f8fb5',
  },
  volcanic: {
    backgroundCenter: '#1c0c0a',
    backgroundEdge: '#0b0504',
    contourRgb: '200, 90, 50',
    oceanTop: 'rgba(24, 6, 4, 0.82)',
    oceanBottom: 'rgba(58, 14, 6, 0.72)',
    shelfRgb: '255, 110, 40',
    landColor: 'rgba(32, 15, 12, 0.96)',
    coastColor: '#e0662f',
  },
  emerald: {
    backgroundCenter: '#0a1c10',
    backgroundEdge: '#040a06',
    contourRgb: '90, 200, 80',
    oceanTop: 'rgba(4, 24, 12, 0.82)',
    oceanBottom: 'rgba(10, 52, 22, 0.72)',
    shelfRgb: '120, 255, 90',
    landColor: 'rgba(12, 32, 18, 0.96)',
    coastColor: '#7be04a',
  },
  arctic: {
    backgroundCenter: '#10243a',
    backgroundEdge: '#08121f',
    contourRgb: '150, 200, 235',
    oceanTop: 'rgba(8, 28, 48, 0.8)',
    oceanBottom: 'rgba(16, 56, 90, 0.7)',
    shelfRgb: '190, 235, 255',
    landColor: 'rgba(44, 66, 88, 0.96)',
    coastColor: '#d6f0ff',
  },
};
