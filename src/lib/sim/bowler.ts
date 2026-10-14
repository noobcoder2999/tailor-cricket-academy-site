import { bodyMetrics, pelvisHeightFor, shoulderPosition, type BodyPose, type FootPose, type Side } from "./body";
import type { DeliveryType } from "./delivery";
import { monotoneCubic } from "./batting";
import { BOWLER_CREASE_Z } from "./physics";
import { add, addScaled, clamp, mix, normalize, rotateY, smoothstep, vec, type Vec3, DEG } from "./vec";

/** Fictional bowler; generic proportions. The action is a simplified side-on model, not a copy of any bowler. */
export const BOWLER = bodyMetrics(1.86);

type Footfall = { side: Side; t: number; p: Vec3; yaw: number };
type Key = { t: number; z: number; x: number; yaw: number; lean: number; torsoYaw: number; torsoPitch: number; torsoRoll: number };

export type BowlerPlan = { footfalls: Footfall[]; keys: Key[]; arc: { t: number; angle: number }[]; mirror: boolean; spin: boolean; start: number };

/** Builds the run-up, bound, delivery stride and follow-through in a right-arm frame (mirrored for left-arm). */
export function planBowler(type: DeliveryType): BowlerPlan {
  const spin = type.style === "spin";
  const k = spin ? 1.3 : 1;
  const speed = spin ? 3.4 : 6.3, period = spin ? 0.4 : 0.32;
  const crease = BOWLER_CREASE_Z;
  const start = spin ? -2.2 : -2.6;
  const backPlant = { side: "R" as Side, t: -0.26 * k, p: vec(-0.42, 0, crease - 1.05), yaw: -Math.PI / 2 + 0.2 };
  const frontPlant = { side: "L" as Side, t: -0.1 * k, p: vec(-0.28, 0, crease + 0.05), yaw: -0.35 };
  const takeoff = { side: "L" as Side, t: -0.6 * k, p: vec(-0.52, 0, crease - (spin ? 2.4 : 3.2)), yaw: 0 };
  const footfalls: Footfall[] = [];
  for (let i = Math.ceil((takeoff.t - start + 0.6) / period); i >= 1; i--) {
    const side: Side = i % 2 ? "R" : "L";
    footfalls.push({ side, t: takeoff.t - i * period, p: vec(-0.52 + (side === "L" ? 0.1 : -0.1), 0, takeoff.p.z - i * speed * period), yaw: 0 });
  }
  footfalls.push(takeoff, backPlant, frontPlant,
    { side: "R", t: 0.17 * k, p: vec(-0.02, 0, crease + 1.0), yaw: 0.35 },
    { side: "L", t: 0.42 * k, p: vec(0.42, 0, crease + 1.85), yaw: 0.5 },
    { side: "R", t: 0.72 * k, p: vec(0.86, 0, crease + 2.45), yaw: 0.6 },
    { side: "L", t: 1.08 * k, p: vec(1.08, 0, crease + 2.75), yaw: 0.65 });

  const keys: Key[] = [];
  for (const f of footfalls.filter(f => f.t <= takeoff.t)) keys.push({ t: f.t, z: f.p.z - 0.18, x: -0.52, yaw: 0, lean: 0.16, torsoYaw: 0, torsoPitch: 0.08, torsoRoll: 0 });
  keys.unshift({ t: start - 0.3, z: keys[0].z - speed * 0.3, x: -0.52, yaw: 0, lean: 0.16, torsoYaw: 0, torsoPitch: 0.08, torsoRoll: 0 });
  keys.push(
    { t: -0.43 * k, z: crease - 2.2 + (spin ? 0.6 : 0), x: -0.48, yaw: -0.9, lean: 0.02, torsoYaw: -0.2, torsoPitch: 0, torsoRoll: -0.05 },
    { t: backPlant.t, z: crease - 0.95, x: -0.44, yaw: -Math.PI / 2 + 0.25, lean: -0.12, torsoYaw: -0.25, torsoPitch: -0.05, torsoRoll: -0.12 },
    { t: frontPlant.t, z: crease - 0.45, x: -0.4, yaw: -1.1, lean: 0, torsoYaw: -0.1, torsoPitch: 0.05, torsoRoll: 0.18 },
    { t: 0, z: crease - 0.28, x: -0.38, yaw: -0.55, lean: 0.12, torsoYaw: 0.15, torsoPitch: 0.2, torsoRoll: 0.38 },
    { t: 0.17 * k, z: crease + 0.4, x: -0.2, yaw: 0.15, lean: 0.4, torsoYaw: 0.35, torsoPitch: 0.6, torsoRoll: 0.1 },
    { t: 0.45 * k, z: crease + 1.5, x: 0.25, yaw: 0.45, lean: 0.3, torsoYaw: 0.15, torsoPitch: 0.35, torsoRoll: 0 },
    { t: 0.8 * k, z: crease + 2.3, x: 0.75, yaw: 0.6, lean: 0.15, torsoYaw: 0, torsoPitch: 0.15, torsoRoll: 0 },
    { t: 1.4 * k, z: crease + 2.6, x: 0.98, yaw: 0.65, lean: 0.08, torsoYaw: 0, torsoPitch: 0.08, torsoRoll: 0 },
    { t: 8, z: crease + 2.6, x: 0.98, yaw: 0.65, lean: 0.08, torsoYaw: 0, torsoPitch: 0.08, torsoRoll: 0 }
  );
  // Bowling-arm angle around the shoulder: 0 = vertical, negative = behind, positive = toward the batter.
  const arc = [
    { t: -0.3 * k, angle: -175 }, { t: -0.14 * k, angle: -105 }, { t: -0.05 * k, angle: -35 }, { t: 0, angle: 6 },
    { t: 0.08 * k, angle: 75 }, { t: 0.2 * k, angle: 150 }
  ];
  return { footfalls, keys, arc, mirror: type.arm === "left", spin, start };
}

function footAt(plan: BowlerPlan, side: Side, t: number): FootPose {
  const falls = plan.footfalls.filter(f => f.side === side);
  const contact = plan.spin ? 0.2 : 0.14;
  let i = falls.findIndex(f => f.t > t);
  if (i === -1) i = falls.length;
  const prev = falls[i - 1], next = falls[i];
  if (!prev) return { p: addScaled(next.p, vec(0, 0, -1), plan.spin ? 1.2 : 2.2), yaw: next.yaw, heel: 0 };
  if (!next || t < prev.t + contact) return { p: prev.p, yaw: prev.yaw, heel: next && t > prev.t + contact * 0.6 ? 0.5 : 0 };
  const u = smoothstep((t - prev.t - contact) / (next.t - prev.t - contact));
  const lift = Math.sin(Math.PI * u) * clamp((next.p.z - prev.p.z) * 0.12, 0.05, 0.28);
  return { p: vec(mix(prev.p.x, next.p.x, u), lift, mix(prev.p.z, next.p.z, u)), yaw: mix(prev.yaw, next.yaw, u), heel: 0.3 * (1 - u) };
}

export function bowlerPoseAt(plan: BowlerPlan, t: number): BodyPose {
  const times = plan.keys.map(k => k.t);
  const ch = (pick: (k: Key) => number) => monotoneCubic(times, plan.keys.map(pick), t);
  const feet = { L: footAt(plan, "L", t), R: footAt(plan, "R", t) };
  const base = {
    pelvis: vec(ch(k => k.x), 0, ch(k => k.z)), yaw: ch(k => k.yaw), lean: ch(k => k.lean),
    torsoYaw: ch(k => k.torsoYaw), torsoPitch: ch(k => k.torsoPitch), torsoRoll: ch(k => k.torsoRoll), feet
  };
  base.pelvis = vec(base.pelvis.x, pelvisHeightFor(BOWLER, base, 0.94), base.pelvis.z);

  const facing = (v: Vec3) => rotateY(v, base.yaw);
  const run = Math.sin(((t - plan.start) / (plan.spin ? 0.8 : 0.64)) * Math.PI * 2);
  const runHands = {
    R: add(base.pelvis, facing(vec(-0.24, 0.32 + 0.05 * run, 0.12 + 0.16 * run))),
    L: add(base.pelvis, facing(vec(0.24, 0.32 - 0.05 * run, 0.12 - 0.16 * run)))
  };
  const gather = { R: add(base.pelvis, vec(-0.15, 0.95, 0.12)), L: add(base.pelvis, vec(0.05, 1.12, 0.45)) };
  const shoulder = shoulderPosition(BOWLER, base, "R");
  const angle = monotoneCubic(plan.arc.map(a => a.t), plan.arc.map(a => a.angle), t) * DEG;
  const arcHand = add(shoulder, vec(-0.03, Math.cos(angle) * BOWLER.reach * 0.98, Math.sin(angle) * BOWLER.reach * 0.98));
  const k = plan.spin ? 1.3 : 1;
  const wGather = smoothstep((t + 0.62 * k) / (0.18 * k));
  const wArc = smoothstep((t + 0.34 * k) / (0.08 * k)) * (1 - smoothstep((t - 0.2 * k) / (0.25 * k)));
  const across = add(base.pelvis, facing(vec(0.28, 0.12, 0.22)));
  const after = smoothstep((t - 0.2 * k) / (0.25 * k));
  const lerp = (a: Vec3, b: Vec3, w: number) => vec(mix(a.x, b.x, w), mix(a.y, b.y, w), mix(a.z, b.z, w));
  let handR = lerp(runHands.R, gather.R, wGather);
  handR = lerp(handR, arcHand, wArc);
  handR = lerp(handR, across, after * (t > 0 ? 1 : 0));
  const frontArm = monotoneCubic([-0.3 * k, -0.12 * k, 0.05 * k, 0.3 * k], [0, 0, 1, 1], t);
  const handL = lerp(lerp(runHands.L, gather.L, wGather), add(base.pelvis, facing(vec(0.32, 0.2, -0.12))), frontArm);
  const pose: BodyPose = {
    ...base,
    hands: { R: handR, L: handL },
    elbows: { R: normalize(vec(-1, -0.2, -0.3)), L: normalize(vec(0.6, -0.4, -0.6)) }
  };
  return plan.mirror ? mirrorPose(pose) : pose;
}

export function mirrorPose(p: BodyPose): BodyPose {
  const m = (v: Vec3) => vec(-v.x, v.y, v.z);
  const f = (x: FootPose): FootPose => ({ p: m(x.p), yaw: -x.yaw, heel: x.heel });
  return {
    pelvis: m(p.pelvis), yaw: -p.yaw, lean: p.lean, torsoYaw: -p.torsoYaw, torsoPitch: p.torsoPitch, torsoRoll: -p.torsoRoll,
    feet: { L: f(p.feet.R), R: f(p.feet.L) }, hands: { L: m(p.hands.R), R: m(p.hands.L) }, elbows: { L: m(p.elbows.R), R: m(p.elbows.L) }
  };
}

/** Bowling hand position, used to carry the ball until release. */
export const bowlingHand = (plan: BowlerPlan, t: number) => { const pose = bowlerPoseAt(plan, t); return plan.mirror ? pose.hands.L : pose.hands.R; };
