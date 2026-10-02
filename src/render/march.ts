const MILLISECONDS_PER_SECOND = 1000;

export function marchOffset(pixelsPerSecond: number): number {
  return -(performance.now() / MILLISECONDS_PER_SECOND) * pixelsPerSecond;
}
