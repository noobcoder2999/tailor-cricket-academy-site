import { type DeliveryPlan, lengths, sampleAtZ, type LengthId } from "./delivery";
import { bodyMetrics, hipPosition, pelvisHeightFor, shoulderPosition, type BodyPose, type FootPose, type Side } from "./body";
import { BALL_RADIUS, PITCH, azimuthOf, batCollision, directionFrom, integrateHit, solveFaceNormal, type BallSample, type HitFlight } from "./physics";
import { shotById, type ShotDef, type ShotId } from "./shots";
import { add, addScaled, clamp, distance, dot, mix, normalize, scale, sub, vec, type Vec3 } from "./vec";

/** Original, fictional right-handed batter. Proportions only; no real player's identity, kit or mannerisms. */
export const BATTER = bodyMetrics(1.78);
/** Wrist-to-grip-centre allowance: IK solves to the wrist, the hand closes the remaining gap. */
export const HAND = 0.075;
export const ARM_REACH = BATTER.reach + HAND;
export const BAT = { length: 0.965, gripToToe: 0.83, sweet: 0.66, width: 0.108, thickness: 0.062 } as const;
const HALF_PI = Math.PI / 2;

export type BatPose = { grip: Vec3; dir: Vec3; face: Vec3 };
export type BatterPose = BodyPose & { bat: BatPose };
export type BattingControl = { timing: number; face: number };
export const defaultControl: BattingControl = { timing: 0, face: 0 };
export type ContactKind = "middled" | "mistimed" | "edge-outside" | "edge-inside" | "top-edge" | "defended" | "missed" | "left";
export type PhaseId = "setup" | "release" | "tracking" | "trigger" | "footwork" | "weight" | "rotation" | "swing" | "contact" | "follow" | "recovery";
export type Phase = { id: PhaseId; label: string; start: number; end: number; note: string };

export type BattingPlan = {
  shot: ShotDef; control: BattingControl; footwork: "front" | "back" | "kneel";
  /** Ball state at the contact plane (also used for a miss or leave as the moment the ball passes). */
  tc: number; ball: BallSample; reachable: boolean;
  /** Where the sweet spot is at tc: the ball itself, or the shot's intended zone for a genuine miss. */
  batPoint: Vec3;
  suitability: { length: number; line: number; height: number; timing: number };
  quality: number; kind: ContactKind;
  face: Vec3; batSpeed: number; outgoing: Vec3 | null; hit: HitFlight | null;
  keys: { t: number; pose: BatterPose }[];
  steps: { side: Side; t0: number; t1: number; height: number }[];
  phases: Phase[];
  notes: string[];
};

const foot = (x: number, z: number, yaw: number, heel = 0): FootPose => ({ p: vec(x, 0, z), yaw, heel });
const orthogonal = (v: Vec3, to: Vec3) => normalize(sub(v, scale(to, dot(v, to))));
const horizontal = (v: Vec3) => normalize(vec(v.x, 0, v.z));
const lerpPoint = (a: Vec3, b: Vec3, t: number) => vec(mix(a.x, b.x, t), mix(a.y, b.y, t), mix(a.z, b.z, t));

/** Hands and elbow hints follow from the bat so both hands always share one handle. */
function withHands(pose: Omit<BatterPose, "hands" | "elbows">, elbowL?: Vec3, elbowR?: Vec3): BatterPose {
  const { grip, dir, face } = pose.bat;
  const behind = scale(face, -0.035);
  return {
    ...pose,
    hands: { L: add(addScaled(grip, dir, -0.065), behind), R: add(addScaled(grip, dir, 0.065), behind) },
    elbows: { L: elbowL ?? normalize(vec(0.35, 0.25, -1)), R: elbowR ?? normalize(vec(0.25, -1, 0.35)) }
  };
}

const armExcess = (pose: BatterPose, side: Side) => distance(shoulderPosition(BATTER, pose, side), pose.hands[side]) - ARM_REACH * 0.96;

/** Pull the hands toward the shoulders (for preparatory poses) so the arms are never over-stretched. */
function fitBatToReach(pose: BatterPose): BatterPose {
  let current = pose;
  for (let i = 0; i < 8; i++) {
    const excess = Math.max(armExcess(current, "L"), armExcess(current, "R"));
    if (excess <= 0) break;
    const mid = scale(add(shoulderPosition(BATTER, current, "L"), shoulderPosition(BATTER, current, "R")), 0.5);
    const grip = addScaled(current.bat.grip, normalize(sub(mid, current.bat.grip)), excess + 0.01);
    current = withHands({ ...current, bat: { ...current.bat, grip } }, current.elbows.L, current.elbows.R);
  }
  return current;
}

/** Move and lower the body toward a fixed bat (contact poses): the bat must meet the real ball. */
function fitBodyToBat(pose: BatterPose, baseExtension: number, carry: Side | null, maxShift = 0.6): BatterPose {
  let extension = baseExtension;
  const drag = (p: BatterPose) => dragFeet(p, carry, extension);
  let current = drag(pose);
  current = { ...current, pelvis: vec(current.pelvis.x, pelvisHeightFor(BATTER, current, extension), current.pelvis.z) };
  let shifted = 0;
  for (let i = 0; i < 16; i++) {
    let excess = 0, toward = vec();
    for (const side of ["L", "R"] as const) {
      const shoulder = shoulderPosition(BATTER, current, side);
      const e = distance(shoulder, current.hands[side]) - ARM_REACH * 0.97;
      if (e > excess) { excess = e; toward = sub(current.hands[side], shoulder); }
    }
    if (excess <= 0.004) break;
    const rising = toward.y > 0.08 * Math.hypot(toward.x, toward.z) + 0.05;
    const move = Math.min(excess * 0.7 + 0.01, maxShift - shifted);
    const feet = { ...current.feet };
    let pelvis = current.pelvis;
    if (move > 0.002) {
      const h = horizontal(toward);
      if (carry) { const f = feet[carry]; const p = addScaled(f.p, h, move * 0.8); feet[carry] = { ...f, p: vec(clamp(p.x, -0.9, 0.7), 0, clamp(p.z, -2.6, 0)) }; }
      pelvis = addScaled(pelvis, h, move);
      shifted += move;
    }
    // High contact: stand taller and more upright; low contact: bend forward and sink.
    if (rising) extension = Math.min(0.99, extension + 0.03);
    else if (toward.y < -0.2 * Math.hypot(toward.x, toward.z)) extension = Math.max(0.72, extension - 0.02);
    current = drag({
      ...current, feet, pelvis,
      lean: rising ? Math.max(0, current.lean - 0.04) : Math.min(current.lean + 0.04, 0.5),
      torsoPitch: rising ? Math.max(0.02, current.torsoPitch - 0.08) : Math.min(current.torsoPitch + (toward.y < 0 ? 0.07 : 0.03), 1.05)
    });
    current.pelvis = vec(current.pelvis.x, pelvisHeightFor(BATTER, current, extension), current.pelvis.z);
  }
  return current;
}

/** A trailing foot that would over-stretch the leg slides after the body on its toes, as in a real lunge. */
function dragFeet<T extends Pick<BatterPose, "pelvis" | "yaw" | "lean" | "feet">>(pose: T, keep: Side | null, extension: number): T {
  const feet = { ...pose.feet };
  for (const side of ["L", "R"] as const) {
    if (side === keep) continue;
    const hip = hipPosition(BATTER, pose, side);
    const f = feet[side];
    const d = vec(f.p.x - hip.x, 0, f.p.z - hip.z);
    const spread = Math.hypot(d.x, d.z), max = BATTER.leg * extension * 0.72;
    if (spread > max) feet[side] = { ...f, p: vec(hip.x + d.x * max / spread, 0, hip.z + d.z * max / spread), heel: Math.max(f.heel, 0.55) };
  }
  return { ...pose, feet };
}

export function stancePose(): BatterPose {
  const dir = normalize(vec(0.16, -1, 0.2));
  const toe = vec(-0.05, 0.03, -0.95);
  const base = {
    pelvis: vec(-0.4, 0, -1.2), yaw: HALF_PI + 0.12, lean: 0.14, torsoYaw: -0.06, torsoPitch: 0.32, torsoRoll: 0.04,
    feet: { L: foot(-0.33, -1.5, HALF_PI + 0.22), R: foot(-0.35, -0.92, HALF_PI) },
    bat: { grip: addScaled(toe, dir, -BAT.gripToToe), dir, face: orthogonal(normalize(vec(0.45, 0, -1)), dir) }
  };
  base.pelvis = vec(base.pelvis.x, pelvisHeightFor(BATTER, base, 0.95), base.pelvis.z);
  return fitBatToReach(withHands(base));
}

function lerpPose(a: BatterPose, b: BatterPose, t: number): BatterPose {
  const f = (p: FootPose, q: FootPose): FootPose => ({ p: lerpPoint(p.p, q.p, t), yaw: mix(p.yaw, q.yaw, t), heel: mix(p.heel, q.heel, t) });
  const dir = normalize(lerpPoint(a.bat.dir, b.bat.dir, t));
  return withHands({
    pelvis: lerpPoint(a.pelvis, b.pelvis, t), yaw: mix(a.yaw, b.yaw, t), lean: mix(a.lean, b.lean, t), torsoYaw: mix(a.torsoYaw, b.torsoYaw, t), torsoPitch: mix(a.torsoPitch, b.torsoPitch, t), torsoRoll: mix(a.torsoRoll, b.torsoRoll, t),
    feet: { L: f(a.feet.L, b.feet.L), R: f(a.feet.R, b.feet.R) },
    bat: { grip: lerpPoint(a.bat.grip, b.bat.grip, t), dir, face: orthogonal(lerpPoint(a.bat.face, b.bat.face, t), dir) }
  }, normalize(lerpPoint(a.elbows.L, b.elbows.L, t)), normalize(lerpPoint(a.elbows.R, b.elbows.R, t)));
}

// ---- Pose channels and monotone (non-overshooting) cubic interpolation ----
function toChannels(p: BatterPose): number[] {
  const f = (x: FootPose) => [x.p.x, x.p.y, x.p.z, x.yaw, x.heel];
  const v = (x: Vec3) => [x.x, x.y, x.z];
  return [...v(p.pelvis), p.yaw, p.lean, p.torsoYaw, p.torsoPitch, p.torsoRoll, ...f(p.feet.L), ...f(p.feet.R), ...v(p.bat.grip), ...v(p.bat.dir), ...v(p.bat.face), ...v(p.elbows.L), ...v(p.elbows.R)];
}
function fromChannels(c: number[]): BatterPose {
  const v = (i: number) => vec(c[i], c[i + 1], c[i + 2]);
  const f = (i: number): FootPose => ({ p: v(i), yaw: c[i + 3], heel: c[i + 4] });
  const dir = normalize(v(21));
  return withHands({ pelvis: v(0), yaw: c[3], lean: c[4], torsoYaw: c[5], torsoPitch: c[6], torsoRoll: c[7], feet: { L: f(8), R: f(13) }, bat: { grip: v(18), dir, face: orthogonal(v(24), dir) } }, normalize(v(27)), normalize(v(30)));
}
/** Fritsch-Carlson monotone cubic: planted feet stay planted, swings keep velocity through keys. */
export function monotoneCubic(times: number[], values: number[], t: number): number {
  const n = times.length;
  if (t <= times[0]) return values[0];
  if (t >= times[n - 1]) return values[n - 1];
  let i = 0;
  while (i < n - 2 && t > times[i + 1]) i++;
  const slope = (k: number) => (values[k + 1] - values[k]) / (times[k + 1] - times[k]);
  const tangent = (k: number) => {
    if (k === 0) return slope(0);
    if (k === n - 1) return slope(n - 2);
    const a = slope(k - 1), b = slope(k);
    if (a * b <= 0) return 0;
    const h0 = times[k] - times[k - 1], h1 = times[k + 1] - times[k];
    const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
    return (w1 + w2) / (w1 / a + w2 / b);
  };
  const h = times[i + 1] - times[i], s = (t - times[i]) / h;
  const h00 = 2 * s ** 3 - 3 * s ** 2 + 1, h10 = s ** 3 - 2 * s ** 2 + s, h01 = -2 * s ** 3 + 3 * s ** 2, h11 = s ** 3 - s ** 2;
  return h00 * values[i] + h10 * h * tangent(i) + h01 * values[i + 1] + h11 * h * tangent(i + 1);
}

export function batterPoseAt(plan: Pick<BattingPlan, "keys" | "steps">, t: number): BatterPose {
  const times = plan.keys.map(k => k.t);
  const channels = plan.keys.map(k => toChannels(k.pose));
  const out = channels[0].map((_, c) => monotoneCubic(times, channels.map(row => row[c]), t));
  const pose = fromChannels(out);
  for (const step of plan.steps) {
    if (t > step.t0 && t < step.t1) {
      const u = (t - step.t0) / (step.t1 - step.t0);
      const f = pose.feet[step.side];
      pose.feet[step.side] = { ...f, p: vec(f.p.x, f.p.y + Math.sin(Math.PI * u) * step.height, f.p.z) };
    }
  }
  return pose;
}

// ---- Shot suitability and contact physics ----
const lengthIndex = (id: LengthId) => lengths.findIndex(l => l.id === id);
const rangeScore = (value: number, [lo, hi]: [number, number], softness: number) => Math.exp(-Math.max(0, lo - value, value - hi) / softness);

export function planBatting(delivery: DeliveryPlan, shotId: ShotId, control: BattingControl = defaultControl): BattingPlan {
  const shot = shotById(shotId);
  const timing = clamp(control.timing, -1, 1), faceError = clamp(control.face, -1, 1);
  const length = delivery.analysis.length;
  const footwork = shot.footwork === "adaptive" ? (lengthIndex(length) >= 3 ? "back" : "front") : shot.footwork;
  let contactZ = shot.contactZ + timing * 0.3;
  if ((footwork === "front" || footwork === "kneel") && delivery.pitch.p.z > contactZ - 0.1) contactZ = Math.max(contactZ, Math.min(delivery.pitch.p.z + 0.05, -1.45));
  const ball = sampleAtZ(delivery.samples, contactZ) ?? delivery.samples[delivery.samples.length - 1];
  const tc = ball.t;
  const C = ball.p;
  const leave = shot.plane === "leave";
  const reachable = C.x > -1.0 && C.x < 1.25 && C.y < 2.1;

  const suitability = {
    length: shot.ideal.lengths.includes(length) ? 1 : Math.min(...shot.ideal.lengths.map(id => Math.abs(lengthIndex(id) - lengthIndex(length)))) === 1 ? 0.6 : 0.25,
    line: rangeScore(C.x, shot.ideal.x, 0.18),
    height: rangeScore(C.y, shot.ideal.height, 0.2),
    timing: 1 - 0.55 * Math.abs(timing) ** 1.3
  };
  if (shot.plane === "defensive") suitability.length = Math.max(0.65, suitability.length);
  const quality = leave ? 1 : reachable ? clamp(suitability.length * suitability.line * suitability.height * suitability.timing * (1 - 0.15 * Math.abs(faceError))) : 0;

  let kind: ContactKind;
  if (leave) kind = "left";
  else if (quality < 0.2) kind = "missed";
  else if (quality < 0.42) kind = shot.plane === "horizontal" && C.y > shot.ideal.height[1] ? "top-edge" : C.x > (shot.ideal.x[0] + shot.ideal.x[1]) / 2 ? "edge-outside" : "edge-inside";
  else if (shot.plane === "defensive") kind = "defended";
  else kind = quality < 0.7 ? "mistimed" : "middled";

  // Face orientation: solve the physical face normal for the intended stroke, then apply the player's errors.
  const lateSign = shot.azimuth < -10 ? -1 : 1;
  const heightLoft = shot.plane === "vertical" ? clamp(((shot.ideal.height[0] + shot.ideal.height[1]) / 2 - C.y) * 10, -6, 4) : 0;
  let azimuth = shot.azimuth + timing * 14 * lateSign + faceError * 16;
  let loft = shot.loft + heightLoft;
  let batSpeed = shot.batSpeed, restitution = shot.restitution, retention = shot.retention;
  if (kind === "mistimed") { batSpeed *= 0.55 + 0.45 * quality; azimuth += (faceError + timing) * 8 * (1 - quality); loft += shot.loft > 15 ? -6 * (1 - quality) : 4 * (1 - quality); }
  if (kind === "edge-outside") { azimuth = 150 + faceError * 10; loft = 6; batSpeed = 2; restitution = 0.35; retention = 0.85; }
  if (kind === "edge-inside") { azimuth = -168; loft = -4; batSpeed = 2; restitution = 0.3; retention = 0.85; }
  if (kind === "top-edge") { azimuth = shot.azimuth < 0 ? -160 : 165; loft = 52; batSpeed = 6; restitution = 0.38; retention = 0.75; }
  const faceIdeal = solveFaceNormal(ball.v, directionFrom(shot.azimuth, shot.loft), shot.batSpeed || 1, shot.restitution || 0.3, shot.retention || 0.8);
  const contactFace = kind === "middled" || kind === "mistimed" || kind === "defended"
    ? solveFaceNormal(ball.v, directionFrom(azimuth, loft), batSpeed, restitution, retention)
    : faceIdeal;
  let outgoing: Vec3 | null = null;
  if (kind !== "missed" && kind !== "left") {
    const face = kind.includes("edge") ? solveFaceNormal(ball.v, directionFrom(azimuth, loft), batSpeed, restitution, retention) : contactFace;
    outgoing = batCollision(ball.v, face, batSpeed, restitution, retention);
  }
  const hit = outgoing ? integrateHit(C, outgoing) : null;

  // ---- Movement keyframes (times relative to release) ----
  const spin = delivery.type.style === "spin";
  const tDecide = Math.max(0.12, tc - (spin ? 0.46 : 0.36));
  const tLand = Math.max(tDecide + 0.1, tc - (spin ? 0.15 : 0.12));
  const tStart = -2.6, tEnd = Math.max(tc + 2.2, 4);
  const stance = stancePose();
  const steps: BattingPlan["steps"] = [{ side: "R", t0: -0.14, t1: 0.02, height: 0.025 }];

  // Trigger: small back-and-across press, hands begin a controlled pick-up toward second slip.
  const triggerBase = {
    ...stance,
    pelvis: add(stance.pelvis, vec(0.04, 0, 0.04)),
    feet: { L: { ...stance.feet.L, p: add(stance.feet.L.p, vec(0.02, 0, 0.02)) }, R: { ...stance.feet.R, p: add(stance.feet.R.p, vec(0.07, 0, 0.08)) } },
    torsoYaw: -0.12,
    bat: { grip: add(stance.bat.grip, vec(0.04, 0.14, 0.12)), dir: normalize(vec(0.3, -0.25, 0.92)), face: normalize(vec(0.75, 0, -0.2)) }
  };
  triggerBase.bat.face = orthogonal(triggerBase.bat.face, triggerBase.bat.dir);
  const trigger = fitBatToReach(withHands(triggerBase));

  // Contact pose built around the actual ball position.
  const face = contactFace;
  const outH = horizontal(directionFrom(azimuth, 0));
  let dir: Vec3;
  if (leave) dir = normalize(vec(0.2, 0.75, 0.6));
  else if (shot.batDir) dir = normalize(vec(...shot.batDir));
  else if (shot.plane === "defensive") dir = normalize(vec(0.05, -1, 0.42));
  else dir = normalize(addScaled(vec(0, -1, 0), outH, shot.loft > 15 ? 0.18 : -0.24));
  dir = orthogonal(dir, face);
  // A genuine miss swings through the shot's intended zone; if that zone still contains the ball, the bat passes over it.
  const zoneX = clamp(C.x, shot.ideal.x[0], shot.ideal.x[1]), zoneY = clamp(C.y, shot.ideal.height[0], shot.ideal.height[1]);
  const batPoint = kind !== "missed" ? C : vec(zoneX, Math.hypot(zoneX - C.x, zoneY - C.y) < 0.1 ? C.y + 0.16 : zoneY, C.z);
  const sweet = addScaled(batPoint, face, -(BALL_RADIUS + BAT.thickness / 2));
  const contactBat: BatPose = { grip: addScaled(sweet, dir, -BAT.sweet), dir, face };

  const ballX = clamp(batPoint.x, -0.7, 0.9);
  let feet: BatterPose["feet"];
  let weight: number;
  let extension: number;
  if (footwork === "front") {
    const stride = clamp(C.z + 0.06, -2.35, -1.55);
    const fx = leave ? stance.feet.L.p.x + 0.05 : clamp(ballX - (shot.azimuth < -10 ? 0.38 : 0.3), -0.75, 0.45);
    feet = { L: foot(fx, leave ? stance.feet.L.p.z - 0.3 : stride, HALF_PI + 0.45 + shot.hipOpen * 0.3), R: { ...trigger.feet.R } };
    weight = 0.68; extension = 0.9;
  } else if (footwork === "back") {
    const bx = clamp(ballX - 0.42, -0.42, 0.12);
    const back = foot(leave ? trigger.feet.R.p.x : bx, leave ? -0.62 : -0.48, HALF_PI + (shot.hipOpen > 1 ? 0.5 : 0.1));
    const openFront = shot.hipOpen > 1;
    feet = { L: foot(openFront ? back.p.x - 0.6 : back.p.x - 0.02, openFront ? -0.95 : -0.98, HALF_PI + (openFront ? 1.1 : 0.3)), R: back };
    weight = 0.3; extension = 0.95;
  } else {
    const stride = clamp(C.z + 0.15, -2.4, -1.65);
    feet = { L: foot(clamp(ballX - 0.35, -0.75, 0.3), stride, HALF_PI + 0.5), R: foot(trigger.feet.R.p.x - 0.05, -0.9, HALF_PI + 0.9, 1) };
    weight = 0.62; extension = 0.8;
  }
  const between = add(scale(feet.L.p, weight), scale(feet.R.p, 1 - weight));
  const contactBase = {
    pelvis: vec(between.x - 0.1, 0, between.z), yaw: HALF_PI + shot.hipOpen, lean: footwork === "back" ? 0.08 : 0.2,
    torsoYaw: shot.plane === "horizontal" ? 0.18 : 0, torsoPitch: shot.torsoPitch, torsoRoll: shot.torsoRoll,
    feet, bat: contactBat
  };
  const elbowFront = shot.plane === "horizontal" ? normalize(add(outH, vec(0, 0.3, 0))) : normalize(vec(0.3, 0.5, -1));
  const contact = leave
    ? fitBatToReach(withHands({ ...contactBase, bat: { grip: add(contactBase.pelvis, vec(0.05, 0.95, 0.12)), dir, face: orthogonal(vec(1, 0, 0), dir) } }, normalize(vec(0.2, 1, -0.4)), normalize(vec(0.2, 0.6, 1))))
    : fitBodyToBat(withHands(contactBase, elbowFront, normalize(vec(0.2, -1, 0.3))), extension, footwork === "back" ? null : "L");
  if (leave) contact.pelvis = vec(contact.pelvis.x, pelvisHeightFor(BATTER, contact, 0.93), contact.pelvis.z);

  // Backlift peak as the stride lands: shoulders coiled, hands by the back hip, toe pointing up toward slip.
  const backPelvis = lerpPoint(trigger.pelvis, contact.pelvis, footwork === "back" ? 0.75 : 0.5);
  const backBase = {
    ...contact, pelvis: backPelvis, yaw: HALF_PI + 0.05 + (footwork === "back" ? 0.08 : 0), lean: 0.12, torsoYaw: -0.22, torsoPitch: footwork === "back" ? 0.12 : 0.3, torsoRoll: 0.04,
    bat: {
      grip: add(backPelvis, vec(0.1, shot.plane === "horizontal" ? 0.48 : 0.38, 0.2)),
      dir: normalize(vec(0.25, 0.78, 0.55)), face: normalize(vec(0.8, 0, -0.1))
    }
  };
  backBase.bat.face = orthogonal(backBase.bat.face, backBase.bat.dir);
  backBase.pelvis = vec(backBase.pelvis.x, pelvisHeightFor(BATTER, backBase, 0.94), backBase.pelvis.z);
  backBase.bat.grip = add(backBase.pelvis, vec(0.1, shot.plane === "horizontal" ? 0.48 : 0.38, 0.2));
  const backlift = fitBatToReach(withHands(backBase, normalize(vec(0.4, 0.3, -1)), normalize(vec(0.3, -0.6, 0.6))));

  // Downswing: hands lead, the blade lags, so the bat comes through on an arc rather than a straight line.
  const down = lerpPose(backlift, contact, 0.62);
  down.bat = { ...down.bat, dir: normalize(add(scale(backlift.bat.dir, 0.4), contact.bat.dir)) };
  down.bat.face = orthogonal(down.bat.face, down.bat.dir);
  down.pelvis = vec(down.pelvis.x, Math.min(down.pelvis.y, pelvisHeightFor(BATTER, down, 0.94)), down.pelvis.z);
  const downswing = fitBatToReach(withHands(down, contact.elbows.L, contact.elbows.R));

  // Follow-through and balanced recovery.
  const pelvisEnd = contact.pelvis;
  const followPose = (grip: Vec3, d: Vec3, yawExtra: number, torsoYaw: number, pitch: number, heel: number) => {
    const dd = normalize(d);
    return fitBatToReach(withHands({
      ...contact, yaw: contact.yaw + yawExtra, torsoYaw, torsoPitch: pitch,
      feet: { L: contact.feet.L, R: { ...contact.feet.R, heel: Math.max(contact.feet.R.heel, heel), yaw: contact.feet.R.yaw + heel * 0.5 } },
      bat: { grip, dir: dd, face: orthogonal(add(outH, vec(0, 0.2, 0)), dd) }
    }, normalize(add(outH, vec(0, 0.8, 0))), normalize(vec(0, -0.5, 0.5))));
  };
  let follow1: BatterPose, follow2: BatterPose;
  switch (leave ? "lift" : shot.follow) {
    case "high":
      follow1 = followPose(add(contact.bat.grip, add(scale(outH, 0.32), vec(0, 0.32, 0))), add(outH, vec(0, 0.35, 0)), 0.15, 0.25, shot.torsoPitch * 0.7, 0.4);
      follow2 = followPose(add(pelvisEnd, add(scale(outH, 0.2), vec(0.05, 0.78, 0))), add(scale(outH, -0.55), vec(0, 0.8, 0.15)), 0.3, 0.45, 0.2, 0.7);
      break;
    case "wrap":
      follow1 = followPose(add(contact.bat.grip, add(scale(outH, 0.35), vec(0, 0.25, 0.1))), add(outH, vec(0, 0.2, 0.4)), 0.25, 0.5, shot.torsoPitch * 0.8, 0.6);
      follow2 = followPose(add(pelvisEnd, vec(-0.12, 0.8, 0.1)), vec(0.35, 0.35, 1), 0.35, 0.7, 0.15, 0.8);
      break;
    case "low":
      follow1 = followPose(add(contact.bat.grip, add(scale(outH, 0.3), vec(0, -0.02, 0))), add(outH, vec(0, -0.45, 0)), 0.1, 0.2, shot.torsoPitch, 0.3);
      follow2 = followPose(add(pelvisEnd, add(scale(outH, 0.25), vec(0.1, 0.5, 0))), add(scale(outH, 0.5), vec(0, 0.6, 0.35)), 0.2, 0.3, 0.25, 0.5);
      break;
    case "check":
    case "hold":
      follow1 = withHands({ ...contact, bat: { ...contact.bat, grip: addScaled(contact.bat.grip, outH, shot.follow === "hold" ? 0.02 : 0.06) } }, contact.elbows.L, contact.elbows.R);
      follow2 = withHands({ ...follow1, torsoPitch: contact.torsoPitch * 0.9 }, contact.elbows.L, contact.elbows.R);
      break;
    default:
      follow1 = contact;
      follow2 = withHands({ ...contact, torsoPitch: 0.2 }, contact.elbows.L, contact.elbows.R);
  }
  const rest = {
    ...contact, pelvis: vec((contact.feet.L.p.x + contact.feet.R.p.x) / 2 - 0.08, 0, (contact.feet.L.p.z + contact.feet.R.p.z) / 2),
    yaw: HALF_PI + 0.4, lean: 0.08, torsoYaw: 0.05, torsoPitch: 0.16, torsoRoll: 0,
    feet: { L: { ...contact.feet.L }, R: { ...contact.feet.R, heel: footwork === "kneel" ? 0.3 : 0 } },
    bat: { grip: vec(0, 0, 0), dir: normalize(vec(0.15, -1, -0.12)), face: normalize(vec(0.3, 0, -1)) }
  };
  rest.pelvis = vec(rest.pelvis.x, pelvisHeightFor(BATTER, rest, 0.96), rest.pelvis.z);
  rest.bat.grip = add(rest.pelvis, vec(0.32, -0.05, -0.12));
  rest.bat.face = orthogonal(rest.bat.face, rest.bat.dir);
  const recovery = fitBatToReach(withHands(rest));

  // Feet: the striding foot lifts in flight; the front foot adjusts during back-foot shots.
  const moving: Side = footwork === "back" ? "R" : "L";
  steps.push({ side: moving, t0: tDecide, t1: tLand, height: footwork === "back" ? 0.05 : 0.09 });
  if (footwork === "back") steps.push({ side: "L", t0: tLand - 0.04, t1: tc, height: 0.03 });

  const holdBase = { ...trigger, bat: { ...trigger.bat, grip: add(trigger.bat.grip, vec(0, 0.08, 0.04)), dir: normalize(add(trigger.bat.dir, vec(0, 0.35, 0))) } };
  holdBase.bat.face = orthogonal(holdBase.bat.face, holdBase.bat.dir);
  const holdTrigger = fitBatToReach(withHands(holdBase, trigger.elbows.L, trigger.elbows.R));
  const keys = [
    { t: tStart, pose: stance }, { t: -0.2, pose: stance }, { t: 0.06, pose: trigger },
    { t: tDecide, pose: holdTrigger }, { t: tLand, pose: backlift },
    { t: tc - 0.055, pose: downswing }, { t: tc, pose: contact },
    { t: tc + 0.16, pose: follow1 }, { t: tc + 0.5, pose: follow2 },
    { t: tc + 1.35, pose: recovery }, { t: tEnd, pose: recovery }
  ];
  for (let i = 1; i < keys.length; i++) if (keys[i].t <= keys[i - 1].t + 0.02) keys[i].t = keys[i - 1].t + 0.02;

  const phases: Phase[] = [
    { id: "setup", label: "Setup", start: tStart, end: -0.2, note: "Balanced side-on stance, eyes level, weight on the balls of the feet." },
    { id: "release", label: "Release & recognition", start: -0.2, end: Math.min(0.16, tc * 0.3), note: "Head still as the ball leaves the hand; seam position and length cues are read early." },
    { id: "trigger", label: "Trigger", start: -0.14, end: 0.06, note: "Small back-and-across press; hands begin the pick-up toward second slip." },
    { id: "tracking", label: "Tracking", start: 0, end: tc, note: "Head follows the ball; it stays level and over the base." },
    { id: "footwork", label: footwork === "back" ? "Back-foot movement" : footwork === "kneel" ? "Stride & kneel" : "Front-foot stride", start: tDecide, end: tLand, note: footwork === "back" ? "Back foot moves back and across to gain time and get inside the line." : "Front foot steps toward the line of the ball; head leads." },
    { id: "weight", label: "Weight shift", start: tDecide + 0.04, end: tc + 0.04, note: footwork === "back" ? "Weight settles over the back foot while staying tall." : "Weight transfers onto the bent front knee." },
    { id: "rotation", label: "Rotation", start: tc - 0.18, end: tc + 0.18, note: "Hips then shoulders rotate toward the target; the front shoulder leads." },
    { id: "swing", label: "Backlift & downswing", start: 0.06, end: tc, note: "Hands lead, the blade lags, then releases through the line." },
    { id: "contact", label: "Contact", start: tc - 0.02, end: tc + 0.02, note: kindNote(kind) },
    { id: "follow", label: "Follow-through", start: tc, end: tc + 0.5, note: "Momentum is carried along the intended direction without falling over." },
    { id: "recovery", label: "Recovery", start: tc + 0.5, end: tc + 1.4, note: "Return to a stable base with head still and eyes on the ball." }
  ];

  const notes: string[] = [];
  if (!reachable) notes.push("The ball was out of reach for this shot.");
  if (suitability.length < 0.7) notes.push(`${shot.name} is not designed for a ${delivery.analysis.lengthLabel.toLowerCase()} ball.`);
  if (suitability.line < 0.6) notes.push(`The line (${Math.abs(C.x * 100).toFixed(0)} cm ${C.x >= 0 ? "off" : "leg"} side of middle) was outside this shot's zone.`);
  if (suitability.height < 0.6) notes.push(`Ball height at contact was ${(C.y * 100).toFixed(0)} cm, outside the ideal range.`);
  if (Math.abs(timing) > 0.3) notes.push(timing < 0 ? "Early: contact was in front of the ideal point." : "Late: the ball got deeper before contact.");
  if (Math.abs(faceError) > 0.3) notes.push(faceError > 0 ? "Open face sent the ball squarer on the off side." : "Closed face turned the ball toward the leg side.");

  return { shot, control: { timing, face: faceError }, footwork, tc, ball, batPoint, reachable, suitability, quality, kind, face: contact.bat.face, batSpeed, outgoing, hit, keys, steps, phases, notes };
}

function kindNote(kind: ContactKind) {
  return {
    middled: "Out of the middle: the ball met the sweet spot with a well-aligned face.",
    mistimed: "Contact, but away from the sweet spot or with the face slightly misaligned.",
    "edge-outside": "Outside edge: the ball found the edge of the blade.",
    "edge-inside": "Inside edge: the ball came back off the inner edge.",
    "top-edge": "Top edge: the ball was higher than the bat's path.",
    defended: "Dead bat: soft hands absorb the pace.",
    missed: "No contact: the bat was not on the ball's line.",
    left: "Bat raised clear of the line."
  }[kind];
}

export const outgoingAzimuth = (plan: BattingPlan) => plan.outgoing ? azimuthOf(plan.outgoing) : null;
export const stumpsBox = { halfWidth: PITCH.stumpHalfWidth, height: PITCH.stumpHeight };
