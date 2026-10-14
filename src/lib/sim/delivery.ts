import { BALL_RADIUS, BOWLER_CREASE_Z, PITCH, STRIKER_CREASE_Z, bounce, kph, stepFlight, type BallSample } from "./physics";
import { clamp, vec, type Vec3 } from "./vec";

export type DeliveryTypeId = "pace" | "outswing" | "inswing" | "leg-cutter" | "off-cutter" | "off-spin" | "leg-spin" | "left-arm-orthodox";
export type LineId = "wide-off" | "outside-off" | "off-stump" | "middle" | "leg-stump" | "down-leg";
export type LengthId = "yorker" | "full" | "good" | "short" | "bouncer";
export type PitchId = "low" | "true" | "bouncy";

export type DeliveryType = {
  id: DeliveryTypeId; name: string; style: "pace" | "spin"; arm: "right" | "left";
  speed: [min: number, max: number, preset: number];
  /** Lateral air force at full movement, m/s² (+ = toward the right-hander's off side). */
  swing: number;
  /** Magnus-style drift before pitching for spinners, m/s². */
  drift: number;
  /** Sideways velocity change at the bounce (seam or spin), m/s. */
  deviation: number;
  /** Horizontal speed lost to grip at the bounce (0..1). */
  grip: number;
  /** Extra vertical restitution from over-spin. */
  kick: number;
  summary: string;
};

export const deliveryTypes: DeliveryType[] = [
  { id: "pace", name: "Pace — hit the deck", style: "pace", arm: "right", speed: [125, 152, 142], swing: 0, drift: 0, deviation: 0, grip: 0.06, kick: 0, summary: "Right-arm over, upright seam, no designed lateral movement. Pace and bounce do the work." },
  { id: "outswing", name: "Outswinger", style: "pace", arm: "right", speed: [118, 145, 132], swing: 5.2, drift: 0, deviation: 0, grip: 0.07, kick: 0, summary: "Seam angled toward slip. Movement away from the right-hander grows late in flight; it straightens after pitching." },
  { id: "inswing", name: "Inswinger", style: "pace", arm: "right", speed: [118, 145, 132], swing: -5.2, drift: 0, deviation: 0, grip: 0.07, kick: 0, summary: "Seam angled toward fine leg. Curves into the right-hander's pads and stumps." },
  { id: "leg-cutter", name: "Leg-cutter (seam away)", style: "pace", arm: "right", speed: [112, 138, 126], swing: 0, drift: 0, deviation: 1.0, grip: 0.1, kick: 0, summary: "Fingers drag across the seam; the ball nips away off the pitch toward the slips." },
  { id: "off-cutter", name: "Off-cutter (seam in)", style: "pace", arm: "right", speed: [112, 138, 126], swing: 0, drift: 0, deviation: -1.0, grip: 0.1, kick: 0, summary: "Cut down the off side of the ball; it grips and jags back into the right-hander." },
  { id: "off-spin", name: "Off-spin (right-arm)", style: "spin", arm: "right", speed: [72, 98, 85], swing: 0, drift: 0.7, deviation: -2.0, grip: 0.2, kick: 0.05, summary: "Finger spin: drifts slightly away in the air, then turns from off to leg after pitching." },
  { id: "leg-spin", name: "Leg-spin (right-arm wrist)", style: "spin", arm: "right", speed: [70, 95, 82], swing: 0, drift: -0.7, deviation: 2.5, grip: 0.22, kick: 0.09, summary: "Wrist spin: drifts in, dips, then turns from leg to off with extra bounce." },
  { id: "left-arm-orthodox", name: "Left-arm orthodox", style: "spin", arm: "left", speed: [72, 96, 86], swing: 0, drift: -0.6, deviation: 2.0, grip: 0.2, kick: 0.05, summary: "Left-arm finger spin from over the wicket: angles in, then turns away from the right-hander." }
];

export const lines: { id: LineId; label: string; x: number }[] = [
  { id: "wide-off", label: "Wide outside off", x: 0.62 },
  { id: "outside-off", label: "Outside off (corridor)", x: 0.3 },
  { id: "off-stump", label: "Off stump", x: 0.11 },
  { id: "middle", label: "Middle stump", x: 0 },
  { id: "leg-stump", label: "Leg stump", x: -0.11 },
  { id: "down-leg", label: "Down leg side", x: -0.4 }
];

/** Target pitching distance from the striker's stumps, metres. Spinners' bands sit fuller. */
export const lengths: { id: LengthId; label: string; pace: number; spin: number; spinLabel?: string }[] = [
  { id: "yorker", label: "Yorker", pace: 1.45, spin: 1.35 },
  { id: "full", label: "Full", pace: 3.6, spin: 2.7 },
  { id: "good", label: "Good length", pace: 6.6, spin: 4.6 },
  { id: "short", label: "Short of a length", pace: 9.2, spin: 6.6 },
  { id: "bouncer", label: "Bouncer", pace: 12.2, spin: 8.6, spinLabel: "Long hop" }
];
const lengthBands: Record<"pace" | "spin", number[]> = { pace: [2.0, 5.0, 8.0, 10.6], spin: [1.8, 3.6, 5.7, 7.6] };

export const pitches: { id: PitchId; label: string; restitution: number; grip: number }[] = [
  { id: "low", label: "Low & slow", restitution: 0.41, grip: 1.25 },
  { id: "true", label: "True surface", restitution: 0.5, grip: 1 },
  { id: "bouncy", label: "Hard & bouncy", restitution: 0.6, grip: 0.8 }
];

export type DeliveryInput = { type: DeliveryTypeId; speedKph: number; line: LineId; length: LengthId; movement: number; pitch: PitchId };
export const defaultDelivery: DeliveryInput = { type: "outswing", speedKph: 134, line: "off-stump", length: "good", movement: 0.7, pitch: "true" };

export const deliveryType = (id: DeliveryTypeId) => deliveryTypes.find(type => type.id === id) ?? deliveryTypes[0];

/** Over-the-wicket release beside the bowler's stumps; height suits the generic 1.86 m bowler model. */
export function releasePoint(type: DeliveryType): Vec3 {
  return vec(type.arm === "right" ? -0.36 : 0.36, type.style === "pace" ? 2.02 : 1.92, BOWLER_CREASE_Z + 0.2);
}

export type DeliveryAnalysis = {
  releaseKph: number; atBatKph: number; pitchDistance: number; length: LengthId; lengthLabel: string;
  pitchLine: LineId; lineAtStumps: LineId; xAtStumps: number; heightAtCrease: number; heightAtStumps: number;
  wouldHitStumps: boolean; swingCm: number; deviationCm: number; timeToCrease: number;
};
export type DeliveryPlan = {
  input: DeliveryInput; type: DeliveryType; release: Vec3; releaseVelocity: Vec3;
  /** Time 0 = release. Ends just past the striker's stumps. */
  samples: BallSample[]; pitch: BallSample; analysis: DeliveryAnalysis;
};

const DT = 1 / 500;
function lateralForce(type: DeliveryType, movement: number, progress: number): Vec3 {
  // Conventional swing is modelled as a force that grows through the flight ("late swing").
  return vec((type.swing * (0.3 + 0.9 * progress * progress) + type.drift) * movement, 0, 0);
}
function flyToPitch(type: DeliveryType, input: DeliveryInput, release: Vec3, velocity: Vec3, targetZ: number, record = false) {
  let p = release, v = velocity, t = 0;
  const samples: BallSample[] = record ? [{ t, p, v }] : [];
  while (p.y > BALL_RADIUS && t < 3) {
    const progress = clamp((p.z - release.z) / (targetZ - release.z));
    const next = stepFlight(p, v, DT, lateralForce(type, input.movement, progress));
    t += DT;
    if (next.p.y <= BALL_RADIUS) {
      const k = (p.y - BALL_RADIUS) / (p.y - next.p.y || 1);
      p = vec(p.x + (next.p.x - p.x) * k, BALL_RADIUS, p.z + (next.p.z - p.z) * k);
      v = next.v; t -= DT * (1 - k);
      if (record) samples.push({ t, p, v });
      break;
    }
    p = next.p; v = next.v;
    if (record) samples.push({ t, p, v });
  }
  return { p, v, t, samples };
}

const directionVelocity = (speed: number, pitchDown: number, yaw: number) => vec(speed * Math.sin(yaw) * Math.cos(pitchDown), -speed * Math.sin(pitchDown), speed * Math.cos(yaw) * Math.cos(pitchDown));

export function classifyLength(distance: number, style: "pace" | "spin"): LengthId {
  const bands = lengthBands[style];
  const index = bands.findIndex(limit => distance < limit);
  return lengths[index === -1 ? 4 : index].id;
}
export function classifyLine(x: number): LineId {
  if (x > 0.45) return "wide-off";
  if (x > 0.2) return "outside-off";
  if (x > 0.055) return "off-stump";
  if (x > -0.055) return "middle";
  if (x > -0.2) return "leg-stump";
  return "down-leg";
}
export const lengthLabel = (id: LengthId, style: "pace" | "spin") => { const l = lengths.find(item => item.id === id)!; return style === "spin" && l.spinLabel ? l.spinLabel : l.label; };
export const lineLabel = (id: LineId) => lines.find(line => line.id === id)!.label;

/** Interpolate the sample where the ball crosses plane z (samples must advance in z). */
export function sampleAtZ(samples: BallSample[], z: number): BallSample | null {
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1], b = samples[i];
    if (a.p.z <= z && b.p.z >= z) {
      const k = (z - a.p.z) / (b.p.z - a.p.z || 1);
      return { t: a.t + (b.t - a.t) * k, p: vec(a.p.x + (b.p.x - a.p.x) * k, a.p.y + (b.p.y - a.p.y) * k, z), v: vec(a.v.x + (b.v.x - a.v.x) * k, a.v.y + (b.v.y - a.v.y) * k, a.v.z + (b.v.z - a.v.z) * k) };
    }
  }
  return null;
}

/** Solve the release angles that pitch the ball on the requested line and length, then fly it to the striker. */
export function planDelivery(input: DeliveryInput): DeliveryPlan {
  const type = deliveryType(input.type);
  const speedKph = clamp(input.speedKph, type.speed[0], type.speed[1]);
  const movement = clamp(input.movement);
  const resolved: DeliveryInput = { ...input, speedKph, movement };
  const speed = speedKph / 3.6;
  const release = releasePoint(type);
  const lengthSpec = lengths.find(item => item.id === input.length)!;
  const targetZ = -(type.style === "spin" ? lengthSpec.spin : lengthSpec.pace);
  const targetX = lines.find(item => item.id === input.line)!.x;
  let pitchDown = Math.atan2(release.y, targetZ - release.z) * 0.6;
  let yaw = Math.atan2(targetX - release.x, targetZ - release.z);
  for (let i = 0; i < 30; i++) {
    const r = flyToPitch(type, resolved, release, directionVelocity(speed, pitchDown, yaw), targetZ);
    const ez = r.p.z - targetZ, ex = r.p.x - targetX;
    if (Math.abs(ez) < 0.005 && Math.abs(ex) < 0.003) break;
    const h = 0.0015;
    const rz = flyToPitch(type, resolved, release, directionVelocity(speed, pitchDown + h, yaw), targetZ);
    const dz = (rz.p.z - r.p.z) / h;
    if (Math.abs(dz) > 1e-6) pitchDown -= clamp(ez / dz, -0.08, 0.08);
    yaw -= ex / Math.max(4, r.p.z - release.z);
  }
  const releaseVelocity = directionVelocity(speed, pitchDown, yaw);
  const flight = flyToPitch(type, resolved, release, releaseVelocity, targetZ, true);
  const samples = flight.samples;
  const pitch = samples[samples.length - 1];
  const surface = pitches.find(item => item.id === input.pitch)!;
  let v = bounce(pitch.v, { restitution: surface.restitution + type.kick, friction: Math.min(0.5, type.grip * surface.grip), lateralImpulse: type.deviation * movement });
  let p = pitch.p, t = pitch.t;
  while (p.z < 2.4 && t < 4) {
    const next = stepFlight(p, v, DT);
    p = next.p; v = next.v; t += DT;
    if (p.y < BALL_RADIUS) { p = vec(p.x, BALL_RADIUS, p.z); v = vec(v.x, Math.abs(v.y) * 0.35, v.z); }
    samples.push({ t, p, v });
  }
  const crease = sampleAtZ(samples, STRIKER_CREASE_Z) ?? samples[samples.length - 1];
  const stumps = sampleAtZ(samples, 0) ?? samples[samples.length - 1];
  const pitchDistance = -pitch.p.z;
  const lengthId = classifyLength(pitchDistance, type.style);
  // Straight-line reference from release to the pitch point shows how far swing bent the path.
  const halfway = samples[Math.floor(samples.indexOf(pitch) / 2)];
  const progress = (halfway.p.z - release.z) / (pitch.p.z - release.z);
  const chordX = release.x + (pitch.p.x - release.x) * progress;
  const projectedX = pitch.p.x + pitch.v.x / pitch.v.z * (stumps.p.z - pitch.p.z);
  return {
    input: resolved, type, release, releaseVelocity, samples, pitch,
    analysis: {
      releaseKph: speedKph, atBatKph: kph(crease.v), pitchDistance, length: lengthId, lengthLabel: lengthLabel(lengthId, type.style),
      pitchLine: classifyLine(pitch.p.x), lineAtStumps: classifyLine(stumps.p.x), xAtStumps: stumps.p.x,
      heightAtCrease: crease.p.y, heightAtStumps: stumps.p.y,
      wouldHitStumps: Math.abs(stumps.p.x) < PITCH.stumpHalfWidth + 0.036 && stumps.p.y < PITCH.stumpHeight + 0.036,
      swingCm: Math.round((halfway.p.x - chordX) * 100), deviationCm: Math.round((stumps.p.x - projectedX) * 100),
      timeToCrease: crease.t
    }
  };
}
