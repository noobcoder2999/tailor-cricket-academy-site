import { type Technique, type Role, shots, deliveries } from "./cricket";
import { sitePath } from "./site";
import { batterPoseAt, defaultControl, type BatterPose } from "./sim/batting";
import { bowlerPoseAt } from "./sim/bowler";
import type { BodyPose } from "./sim/body";
import { type DeliveryInput, type DeliveryTypeId } from "./sim/delivery";
import { ballAt, simulate, type Simulation } from "./sim/simulate";
import type { ShotId } from "./sim/shots";
import { add, clamp, mix, smoothstep, sub, vec, type Vec3 } from "./sim/vec";

export const CREASE_MODEL = sitePath("/models/crease-player.glb");
export const CREASE_SECONDS = 9;
export const creaseDeliveries = [
  ...deliveries.filter(item => item.id !== "left-arm"),
  { ...deliveries[0], id: "yorker", name: "Yorker", zone: "Right-arm full pace", cue: "Aim at the base of the stumps. A full-length delivery met with a compact defence.", end: { x: 0, y: 0.3, z: 21 }, bounceX: 0, lift: 0.2, duration: 4300 }
];
const shotIds: Record<string, ShotId> = {
  "cover-drive": "cover-drive", "straight-drive": "straight-drive", pull: "pull", hook: "hook",
  "square-cut": "cut", sweep: "sweep", flick: "flick", "lofted-drive": "lofted-cover"
};
const deliveryIds: Record<string, DeliveryTypeId> = { fast: "pace", swing: "outswing", seam: "leg-cutter", "off-spin": "off-spin", "leg-spin": "leg-spin", yorker: "pace" };

export function createCreaseMatch(technique: Technique): Simulation {
  const isBat = technique.role === "batsman";
  const type = isBat ? technique.id === "sweep" ? "off-spin" : "pace" : deliveryIds[technique.id];
  if (!type) throw new Error(`Unsupported right-arm delivery: ${technique.id}`);
  const spin = type === "off-spin" || type === "leg-spin";
  const input: DeliveryInput = {
    type, speedKph: spin ? 82 : 132, line: "off-stump", length: "full", movement: isBat ? 0.2 : 0.65, pitch: "true"
  };
  if (technique.id === "pull" || technique.id === "square-cut") input.length = "short";
  if (technique.id === "hook") { input.length = "bouncer"; input.line = "leg-stump"; }
  if (technique.id === "square-cut") input.line = "outside-off";
  if (technique.id === "cover-drive") input.line = "outside-off";
  if (technique.id === "flick" || technique.id === "sweep") input.line = "leg-stump";
  if (!isBat) input.length = technique.id === "yorker" ? "yorker" : "good";
  const shot = isBat ? shotIds[technique.id] : technique.id === "yorker" ? "forward-defence" : "back-defence";
  if (!shot) throw new Error(`Unsupported batting stroke: ${technique.id}`);
  return simulate(input, shot, defaultControl);
}

export function previewTechnique(role: Role, cycle: number) {
  return role === "batsman" ? shots[[0, 1, 2, 5, 7][cycle % 5]] : creaseDeliveries[cycle % creaseDeliveries.length];
}

// A brief hold, real-time run-up, slightly slowed ball recognition, then real-time outfield action.
export function creaseTime(sim: Simulation, progress: number): number {
  const p = clamp(progress);
  if (p < 0.38) return mix(sim.start, 0, p / 0.38);
  if (p < 0.57) return mix(0, sim.batting.tc, (p - 0.38) / 0.19);
  return mix(sim.batting.tc, sim.batting.tc + 3.2, (p - 0.57) / 0.43);
}
export type CreaseFrame = { t: number; ball: Vec3; batter: BatterPose; bowler: BodyPose; phase: string; sim: Simulation };
export function creaseFrame(sim: Simulation, progress: number): CreaseFrame {
  const t = creaseTime(sim, progress);
  const bowler = bowlerPoseAt(sim.bowler, t);
  // Align the final 100 ms of the hand arc with the physics release, including the carried ball.
  const releaseHand = bowlerPoseAt(sim.bowler, 0).hands.R;
  const correction = sub(sim.delivery.release, releaseHand);
  const w = smoothstep((t + 0.16) / 0.12) * (1 - smoothstep((t - 0.04) / 0.18));
  bowler.hands.R = add(bowler.hands.R, vec(correction.x * w, correction.y * w, correction.z * w));
  const ball = t < 0 ? bowler.hands.R : ballAt(sim, t).p;
  const result = sim.batting.hit ? "CONTACT" : sim.bowled ? "BOWLED" : "PAST THE BAT";
  const phase = t < -0.4 ? "RUN-UP" : t < 0 ? "GATHER" : t < sim.delivery.pitch.t ? "RELEASE" : t < sim.batting.tc ? "BOUNCE" : t < sim.batting.tc + 0.3 ? result : "FOLLOW-THROUGH";
  return { t, ball, batter: batterPoseAt(sim.batting, t), bowler, phase, sim };
}
export type CreaseCamera = { position: Vec3; target: Vec3; fov: number; phase: string };
const lerpVec = (a: Vec3, b: Vec3, w: number) => vec(mix(a.x, b.x, w), mix(a.y, b.y, w), mix(a.z, b.z, w));
export function creaseCamera(frame: CreaseFrame, overview: boolean, aspect: number): CreaseCamera {
  if (overview) return { position: vec(0, 95, -10.2), target: vec(0, 0, -10), fov: aspect < 1 ? 70 : 57, phase: "overview" };
  const { t, ball, sim } = frame;
  const establish = 1 - smoothstep((t - sim.start) / 0.95);
  const follow = smoothstep((t - sim.batting.tc - 0.15) / 0.65);
  const onside = ball.x < 0 ? -1 : 1;
  const deliveryPosition = vec(1.4, 5.8, -33);
  const followPosition = vec(ball.x * 0.23 + onside * 13, 8 + Math.min(ball.y * 0.25, 5), -22 + ball.z * 0.12);
  const position = lerpVec(lerpVec(deliveryPosition, followPosition, follow), vec(5, 2.3, -5.5), establish);
  const target = lerpVec(lerpVec(vec(0, 0.95, -2), vec(ball.x * 0.85, Math.max(0.6, ball.y * 0.85), ball.z), follow), vec(-0.15, 0.9, -0.8), establish);
  const fov = mix(mix(27, 44, follow), 36, establish);
  return { position, target, fov: aspect < 1 ? fov * 1.3 : fov, phase: establish > 0.1 ? "crease-closeup" : follow > 0.05 ? "outfield-tracking" : "bowler-end" };
}
