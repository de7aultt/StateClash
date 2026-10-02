export const FULL_TURN = Math.PI * 2;
export const TOP_ANGLE = -Math.PI / 2;

export function traceCircle(context: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
  context.beginPath();
  context.arc(x, y, radius, 0, FULL_TURN);
}

export function tracePolygon(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  sides: number,
  rotation: number = TOP_ANGLE,
): void {
  context.beginPath();
  for (let side = 0; side < sides; side++) {
    const angle = rotation + (side / sides) * FULL_TURN;
    const pointX = x + Math.cos(angle) * radius;
    const pointY = y + Math.sin(angle) * radius;
    if (side === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  }
  context.closePath();
}

export function traceStar(context: CanvasRenderingContext2D, x: number, y: number, outer: number, inner: number): void {
  const points = 10;
  context.beginPath();
  for (let point = 0; point < points; point++) {
    const radius = point % 2 === 0 ? outer : inner;
    const angle = TOP_ANGLE + (point / points) * FULL_TURN;
    const pointX = x + Math.cos(angle) * radius;
    const pointY = y + Math.sin(angle) * radius;
    if (point === 0) context.moveTo(pointX, pointY);
    else context.lineTo(pointX, pointY);
  }
  context.closePath();
}

export function traceGear(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  outer: number,
  inner: number,
  teeth: number,
  rotation: number,
): void {
  const step = FULL_TURN / teeth;
  const profile: ReadonlyArray<readonly [number, number]> = [
    [0.05, inner],
    [0.2, outer],
    [0.4, outer],
    [0.55, inner],
  ];
  context.beginPath();
  for (let tooth = 0; tooth < teeth; tooth++) {
    for (const [offset, radius] of profile) {
      const angle = rotation + (tooth + offset) * step;
      const pointX = x + Math.cos(angle) * radius;
      const pointY = y + Math.sin(angle) * radius;
      if (tooth === 0 && offset === profile[0][0]) context.moveTo(pointX, pointY);
      else context.lineTo(pointX, pointY);
    }
  }
  context.closePath();
}
