import { add, rotateY, scale, vec, type Vec3 } from "./vec";

/**
 * Proportions of the bundled CC0 MakeHuman-derived rig (public/models/cricketer.glb, 3.45 model units tall,
 * identity rest rotations, facing +Z). Pose maths and the renderer share these numbers so IK targets are reachable.
 */
export const MODEL_HEIGHT = 3.45;
export const REST = {
  root: vec(0, 1.835, -0.155),
  spineBase: vec(0, 0.033, 0.184),
  spine03: vec(0, 0.232, 0.001),
  spine01: vec(0, 0.501, -0.045),
  shoulderL: vec(0.342, 0.953, 0.184),
  hipL: vec(0.225, -0.016, 0.18),
  upperArm: 0.4638, forearm: 0.4612, thigh: 0.8575, shin: 0.777, ankle: 0.204
} as const;

export type BodyMetrics = {
  height: number; scale: number; upperArm: number; forearm: number; reach: number; thigh: number; shin: number; leg: number; ankle: number;
  spineBase: Vec3; spine03: Vec3; spine01: Vec3; shoulder: { L: Vec3; R: Vec3 }; hip: { L: Vec3; R: Vec3 };
};
export function bodyMetrics(height: number): BodyMetrics {
  const s = height / MODEL_HEIGHT;
  const mirror = (v: Vec3) => vec(-v.x, v.y, v.z);
  return {
    height, scale: s, upperArm: REST.upperArm * s, forearm: REST.forearm * s, reach: (REST.upperArm + REST.forearm) * s,
    thigh: REST.thigh * s, shin: REST.shin * s, leg: (REST.thigh + REST.shin) * s, ankle: REST.ankle * s,
    spineBase: scale(REST.spineBase, s), spine03: scale(REST.spine03, s), spine01: scale(REST.spine01, s),
    shoulder: { L: scale(REST.shoulderL, s), R: scale(mirror(REST.shoulderL), s) },
    hip: { L: scale(REST.hipL, s), R: scale(mirror(REST.hipL), s) }
  };
}

export type Side = "L" | "R";
/** Ground contact for one foot. `yaw` uses the model convention (0 = toes toward +Z); `heel` raises the heel 0..1. */
export type FootPose = { p: Vec3; yaw: number; heel: number };
/**
 * World-space body pose. Pelvis yaw follows the model convention (0 faces +Z, π/2 faces +X).
 * Torso angles are distributed over the three spine bones. torsoRoll > 0 dips the left shoulder.
 */
export type BodyPose = {
  pelvis: Vec3; yaw: number; lean: number; torsoYaw: number; torsoPitch: number; torsoRoll: number;
  feet: { L: FootPose; R: FootPose };
  hands: { L: Vec3; R: Vec3 };
  elbows: { L: Vec3; R: Vec3 };
};

const rotX = (v: Vec3, a: number) => { const c = Math.cos(a), s = Math.sin(a); return vec(v.x, v.y * c - v.z * s, v.y * s + v.z * c); };
const rotZ = (v: Vec3, a: number) => { const c = Math.cos(a), s = Math.sin(a); return vec(v.x * c - v.y * s, v.x * s + v.y * c, v.z); };
/** three.js Euler order "YXZ" applied to a vector. */
export const eulerYXZ = (v: Vec3, x: number, y: number, z: number) => rotateY(rotX(rotZ(v, z), x), y);

/**
 * Forward kinematics matching the renderer exactly: the torso rotation is split into three equal
 * Euler("YXZ") steps applied at spine05, spine03 and spine01, so the bend is spread along the back.
 */
export function shoulderPosition(m: BodyMetrics, pose: Pick<BodyPose, "pelvis" | "yaw" | "lean" | "torsoYaw" | "torsoPitch" | "torsoRoll">, side: Side): Vec3 {
  const step = (v: Vec3) => eulerYXZ(v, pose.torsoPitch / 3, pose.torsoYaw / 3, -pose.torsoRoll / 3);
  const local = m.shoulder[side];
  const fromSpine01 = vec(local.x - m.spineBase.x - m.spine03.x - m.spine01.x, local.y - m.spineBase.y - m.spine03.y - m.spine01.y, local.z - m.spineBase.z - m.spine03.z - m.spine01.z);
  const chain = step(add(m.spine03, step(add(m.spine01, step(fromSpine01)))));
  return add(pose.pelvis, eulerYXZ(add(m.spineBase, chain), pose.lean, pose.yaw, 0));
}
/** Equal per-bone share of the torso rotation (renderer applies this to spine05, spine03 and spine01). */
export const spineStep = (pose: Pick<BodyPose, "torsoYaw" | "torsoPitch" | "torsoRoll">) => ({ x: pose.torsoPitch / 3, y: pose.torsoYaw / 3, z: -pose.torsoRoll / 3 });
export function hipPosition(m: BodyMetrics, pose: Pick<BodyPose, "pelvis" | "yaw" | "lean">, side: Side): Vec3 {
  return add(pose.pelvis, eulerYXZ(m.hip[side], pose.lean, pose.yaw, 0));
}
/** Highest pelvis that keeps both ankles reachable with legs extended to `extension` of full length. */
export function pelvisHeightFor(m: BodyMetrics, pose: Pick<BodyPose, "pelvis" | "yaw" | "lean" | "feet">, extension = 0.97): number {
  let best = Infinity;
  for (const side of ["L", "R"] as const) {
    const hip = hipPosition(m, { ...pose, pelvis: vec(pose.pelvis.x, 0, pose.pelvis.z) }, side);
    const foot = pose.feet[side];
    const ankleY = foot.p.y + m.ankle + foot.heel * 0.07;
    const dx = hip.x - foot.p.x, dz = hip.z - foot.p.z;
    const length = m.leg * extension;
    const vertical = Math.sqrt(Math.max(0.01, length * length - dx * dx - dz * dz));
    best = Math.min(best, ankleY + vertical - hip.y);
  }
  return best;
}
