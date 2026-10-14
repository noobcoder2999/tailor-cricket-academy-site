// Minimal immutable vector helpers for the batting simulator (metres / seconds).
export type Vec3 = { x: number; y: number; z: number };

export const vec = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });
export const add = (a: Vec3, b: Vec3): Vec3 => vec(a.x + b.x, a.y + b.y, a.z + b.z);
export const sub = (a: Vec3, b: Vec3): Vec3 => vec(a.x - b.x, a.y - b.y, a.z - b.z);
export const scale = (a: Vec3, s: number): Vec3 => vec(a.x * s, a.y * s, a.z * s);
export const addScaled = (a: Vec3, b: Vec3, s: number): Vec3 => vec(a.x + b.x * s, a.y + b.y * s, a.z + b.z * s);
export const dot = (a: Vec3, b: Vec3) => a.x * b.x + a.y * b.y + a.z * b.z;
export const cross = (a: Vec3, b: Vec3): Vec3 => vec(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
export const length = (a: Vec3) => Math.hypot(a.x, a.y, a.z);
export const distance = (a: Vec3, b: Vec3) => length(sub(a, b));
export const normalize = (a: Vec3): Vec3 => { const l = length(a) || 1; return scale(a, 1 / l); };
export const lerpVec = (a: Vec3, b: Vec3, t: number): Vec3 => vec(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
/** Rotation about +Y, matching three.js: +X rotated by +θ becomes (cos θ, 0, -sin θ). */
export const rotateY = (a: Vec3, angle: number): Vec3 => {
  const c = Math.cos(angle), s = Math.sin(angle);
  return vec(a.x * c + a.z * s, a.y, -a.x * s + a.z * c);
};
/** Rotate `a` about a unit `axis` by `angle` (Rodrigues). */
export const rotateAxis = (a: Vec3, axis: Vec3, angle: number): Vec3 => {
  const c = Math.cos(angle), s = Math.sin(angle);
  return add(add(scale(a, c), scale(cross(axis, a), s)), scale(axis, dot(axis, a) * (1 - c)));
};

export const clamp = (n: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (t: number) => { const p = clamp(t); return p * p * (3 - 2 * p); };
export const DEG = Math.PI / 180;
export const isFiniteVec = (a: Vec3) => Number.isFinite(a.x) && Number.isFinite(a.y) && Number.isFinite(a.z);
