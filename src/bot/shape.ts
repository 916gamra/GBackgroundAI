import { BotShape, BotSilhouette } from './types';

export const TAU = Math.PI * 2;
export const NUM_POINTS = 64;

export const ANGLES: number[] = Array.from(
  { length: NUM_POINTS },
  (_, i) => (i / NUM_POINTS) * TAU
);

export const COS: number[] = ANGLES.map(Math.cos);
export const SIN: number[] = ANGLES.map(Math.sin);

/**
 * Generates superellipse radial profile according to equation:
 * |cos(theta)/sx|^n + |sin(theta)/sy|^n = r^(-n)
 */
export function superellipseProfile(n: number, sx = 1, sy = 1): number[] {
  return ANGLES.map((_, i) => {
    const c = Math.abs((COS[i] ?? 0) / sx) ** n;
    const s = Math.abs((SIN[i] ?? 0) / sy) ** n;
    const sum = c + s;
    return sum <= 0 ? 1 : sum ** (-1 / n);
  });
}

/**
 * Normalizes radii profile so the maximum radius equals max
 */
export function normalize(radii: number[], max = 1): number[] {
  const peak = Math.max(...radii);
  if (peak <= 0) return radii;
  const k = max / peak;
  return radii.map((r) => r * k);
}

// Canonical Squircle superellipse shape (order 4.2 normalized to 1.15)
export const squircleShape: BotShape = {
  id: 'squircle',
  radii: normalize(superellipseProfile(4.2), 1.15)
};

/**
 * Creates a silhouette transform descriptor
 */
export function circle(
  scale = 1,
  opts: { cx?: number; cy?: number; sx?: number; sy?: number; rot?: number } = {}
): BotSilhouette {
  return {
    scale,
    cx: opts.cx ?? 0,
    cy: opts.cy ?? 0,
    sx: opts.sx ?? 1,
    sy: opts.sy ?? 1,
    rot: opts.rot ?? 0
  };
}

/**
 * Converts a silhouette & base radii into an SVG Path String.
 * Target bounding box centered at (0,0) scaled to ~96px baseline radius.
 */
export function silhouetteToSvgPath(
  sil: BotSilhouette = {},
  baseRadii: number[] = squircleShape.radii,
  baseRadius = 90
): string {
  const scale = (sil.scale ?? 1) * baseRadius;
  const sx = sil.sx ?? 1;
  const sy = sil.sy ?? 1;
  const cx = (sil.cx ?? 0) * baseRadius;
  const cy = (sil.cy ?? 0) * baseRadius;
  const rot = sil.rot ?? 0;
  const cosR = Math.cos(rot);
  const sinR = Math.sin(rot);

  const radii = sil.radii || baseRadii;
  const n = radii.length;
  const pts: [number, number][] = [];

  for (let i = 0; i < n; i++) {
    const r = (radii[i] || 1) * scale;
    const px = COS[i] * r * sx;
    const py = SIN[i] * r * sy;

    // Apply rotation and center offset
    const x = px * cosR - py * sinR + cx;
    const y = px * sinR + py * cosR + cy;
    pts.push([x, y]);
  }

  // Generate smooth closed cubic Bezier path using Catmull-Rom to Cubic Bezier conversion
  return pointsToSmoothClosedPath(pts);
}

/**
 * Converts array of polygon points into smooth closed SVG path
 */
export function pointsToSmoothClosedPath(points: [number, number][]): string {
  const len = points.length;
  if (len < 3) return '';

  let d = `M ${points[0][0].toFixed(2)} ${points[0][1].toFixed(2)}`;

  for (let i = 0; i < len; i++) {
    const p0 = points[(i - 1 + len) % len];
    const p1 = points[i];
    const p2 = points[(i + 1) % len];
    const p3 = points[(i + 2) % len];

    // Catmull-Rom control points calculation (tension = 0.5)
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }

  return d + ' Z';
}

/**
 * Generates eye cutout path & transform for SVG rendering
 */
export function generateEyePath(
  eye: { width: number; height: number; rot?: number; openness?: number; roundness?: number },
  eyeX: number,
  eyeY: number,
  baseScale = 90
): { d: string; transform: string } {
  const w = eye.width * baseScale * 0.95;
  const h = eye.height * baseScale * (eye.openness ?? 1) * 0.95;
  const rx = w / 2;
  const ry = h / 2;
  const rot = eye.rot ?? 0;

  // Eye capsule path centered at 0,0
  const d = `M ${-rx} 0 A ${rx} ${ry} 0 0 1 ${rx} 0 A ${rx} ${ry} 0 0 1 ${-rx} 0 Z`;
  const transform = `translate(${eyeX.toFixed(2)}, ${eyeY.toFixed(2)}) rotate(${rot.toFixed(2)})`;

  return { d, transform };
}
