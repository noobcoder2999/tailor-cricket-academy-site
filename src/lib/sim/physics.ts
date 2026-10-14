import { add, addScaled, dot, length, normalize, scale, sub, vec, type Vec3 } from "./vec";

/**
 * Simplified rigid-ball physics in real-world units (metres, seconds, kg).
 * Coordinate frame: z runs down the pitch toward the striker (striker's stumps at z = 0,
 * bowler's stumps at z = -20.12), y is height, and +x is the right-handed striker's OFF side.
 * This is a teaching model (drag, a lumped swing force, impulsive bounce and an effective-mass
 * bat collision), not a validated aerodynamic or contact-mechanics solver.
 */
export const PITCH = {
  length: 20.12,
  poppingCrease: 1.22,
  returnCrease: 1.32,
  stumpHeight: 0.711,
  stumpHalfWidth: 0.1143,
  width: 3.05
} as const;
export const STRIKER_STUMPS_Z = 0;
export const BOWLER_STUMPS_Z = -PITCH.length;
export const STRIKER_CREASE_Z = -PITCH.poppingCrease;
export const BOWLER_CREASE_Z = BOWLER_STUMPS_Z + PITCH.poppingCrease;
export const GROUND_CENTER = vec(0, 0, BOWLER_STUMPS_Z / 2);
export const BOUNDARY_RADIUS = 65;
export const BALL_RADIUS = 0.036;
export const GRAVITY = 9.81;
/** 0.5·ρ·Cd·A / m for a 156 g ball, Cd ≈ 0.4. */
export const AIR_DRAG = 0.0062;
/** Ball mass over the bat's effective mass at the impact point. */
export const BAT_MASS_RATIO = 0.24;

export type BallSample = { t: number; p: Vec3; v: Vec3 };

export function flightAccel(v: Vec3, lateral: Vec3 = vec()): Vec3 {
  const speed = length(v);
  return vec(-AIR_DRAG * speed * v.x + lateral.x, -GRAVITY - AIR_DRAG * speed * v.y + lateral.y, -AIR_DRAG * speed * v.z + lateral.z);
}

/** One midpoint (RK2) step. */
export function stepFlight(p: Vec3, v: Vec3, dt: number, lateral: Vec3 = vec()): { p: Vec3; v: Vec3 } {
  const a1 = flightAccel(v, lateral);
  const vMid = addScaled(v, a1, dt / 2);
  const a2 = flightAccel(vMid, lateral);
  return { p: addScaled(p, vMid, dt), v: addScaled(v, a2, dt) };
}

export type BounceSurface = { restitution: number; friction: number; lateralImpulse?: number };
/** Impulsive bounce: vertical restitution, horizontal grip loss and seam/spin deviation (m/s across). */
export function bounce(v: Vec3, surface: BounceSurface): Vec3 {
  const keep = 1 - surface.friction;
  return vec(v.x * keep + (surface.lateralImpulse ?? 0), Math.abs(v.y) * surface.restitution, v.z * keep);
}

/**
 * Effective-mass collision between the ball and a moving flat bat face.
 * `normal` points out of the face toward the intended hit; `batSpeed` is the face's speed along it.
 */
export function batCollision(incoming: Vec3, normal: Vec3, batSpeed: number, restitution: number, tangentialRetention = 0.8): Vec3 {
  const n = normalize(normal);
  const vn = dot(incoming, n);
  const approach = Math.max(0, -vn);
  const tangential = sub(incoming, scale(n, vn));
  const outNormal = ((restitution - BAT_MASS_RATIO) * approach + (1 + restitution) * batSpeed) / (1 + BAT_MASS_RATIO);
  return add(scale(tangential, tangentialRetention), scale(n, Math.max(0.3, outNormal)));
}

/** Find the face normal that sends the ball along `desired`, so later face errors perturb a physical baseline. */
export function solveFaceNormal(incoming: Vec3, desired: Vec3, batSpeed: number, restitution: number, tangentialRetention = 0.8): Vec3 {
  const want = normalize(desired);
  let n = normalize(sub(want, normalize(incoming)));
  for (let i = 0; i < 24; i++) {
    const out = normalize(batCollision(incoming, n, batSpeed, restitution, tangentialRetention));
    n = normalize(addScaled(n, sub(want, out), 0.9));
  }
  return n;
}

/** Azimuth 0° = straight back past the bowler, +90° = square on the off side, ±180° = behind the keeper. */
export function directionFrom(azimuthDeg: number, elevationDeg = 0): Vec3 {
  const a = azimuthDeg * Math.PI / 180, e = elevationDeg * Math.PI / 180;
  return vec(Math.cos(e) * Math.sin(a), Math.sin(e), -Math.cos(e) * Math.cos(a));
}
export const azimuthOf = (v: Vec3) => Math.atan2(v.x, -v.z) * 180 / Math.PI;
export const elevationOf = (v: Vec3) => Math.atan2(v.y, Math.hypot(v.x, v.z)) * 180 / Math.PI;
export const kph = (v: Vec3) => length(v) * 3.6;

export type HitFlight = {
  samples: BallSample[];
  firstBounce: BallSample | null;
  boundary: { t: number; p: Vec3; aerial: boolean } | null;
  rest: Vec3;
  maxHeight: number;
  duration: number;
};

/** Post-contact flight over the outfield: drag, damped bounces, rolling resistance and the rope. */
export function integrateHit(start: Vec3, velocity: Vec3, maxTime = 7, dt = 1 / 240): HitFlight {
  let p = start, v = velocity, t = 0;
  const samples: BallSample[] = [{ t, p, v }];
  let firstBounce: BallSample | null = null;
  let boundary: HitFlight["boundary"] = null;
  let maxHeight = p.y;
  while (t < maxTime) {
    const next = stepFlight(p, v, dt);
    p = next.p; v = next.v; t += dt;
    if (p.y <= BALL_RADIUS) {
      p = vec(p.x, BALL_RADIUS, p.z);
      if (v.y < -1.2) {
        if (!firstBounce) firstBounce = { t, p, v };
        v = vec(v.x * 0.72, -v.y * 0.42, v.z * 0.72);
      } else {
        const horizontal = Math.hypot(v.x, v.z);
        const slowed = Math.max(0, horizontal - 1.8 * dt);
        const k = horizontal > 0 ? slowed / horizontal : 0;
        v = vec(v.x * k, 0, v.z * k);
      }
    }
    maxHeight = Math.max(maxHeight, p.y);
    samples.push({ t, p, v });
    const fromCenter = Math.hypot(p.x - GROUND_CENTER.x, p.z - GROUND_CENTER.z);
    if (!boundary && fromCenter >= BOUNDARY_RADIUS) boundary = { t, p, aerial: !firstBounce };
    if (boundary && fromCenter >= BOUNDARY_RADIUS + 9) break;
    if (length(v) < 0.25 && p.y <= BALL_RADIUS + 1e-6) break;
  }
  return { samples, firstBounce, boundary, rest: p, maxHeight, duration: t };
}

/** Linear interpolation inside an evenly or unevenly spaced, time-sorted sample list. */
export function sampleAt(samples: BallSample[], t: number): BallSample {
  if (t <= samples[0].t) return samples[0];
  const last = samples[samples.length - 1];
  if (t >= last.t) return last;
  let lo = 0, hi = samples.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (samples[mid].t <= t) lo = mid; else hi = mid; }
  const a = samples[lo], b = samples[hi], k = (t - a.t) / (b.t - a.t || 1);
  return { t, p: vec(a.p.x + (b.p.x - a.p.x) * k, a.p.y + (b.p.y - a.p.y) * k, a.p.z + (b.p.z - a.p.z) * k), v: vec(a.v.x + (b.v.x - a.v.x) * k, a.v.y + (b.v.y - a.v.y) * k, a.v.z + (b.v.z - a.v.z) * k) };
}
