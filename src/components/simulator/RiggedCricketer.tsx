"use client";
import { sitePath } from "../../lib/site";
import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, type RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { spineStep, type BodyMetrics, type BodyPose, type Side } from "../../lib/sim/body";
import type { Vec3 } from "../../lib/sim/vec";

export const MODEL_URL = sitePath("/models/cricketer.glb");

/** Per-frame data written by the scene before the players render. */
export type RigFrame = { pose: BodyPose; look: Vec3 };

type Props = {
  modelUrl?: string;
  detailed?: boolean;
  metrics: BodyMetrics;
  frame: RefObject<RigFrame | null>;
  role: "batter" | "bowler";
  /** Linear-space skin tone applied to the CC0 mesh's skin vertex colours. */
  skin: [number, number, number];
};

const sides: Side[] = ["L", "R"];
const v3 = (v: Vec3, out = new THREE.Vector3()) => out.set(v.x, v.y, v.z);

/** Rotation taking an orthonormal rest basis (primary, secondary) to a world basis. */
function basisRotation(restP: THREE.Vector3, restS: THREE.Vector3, p: THREE.Vector3, s: THREE.Vector3, out: THREE.Quaternion) {
  const rest = new THREE.Matrix4().makeBasis(restP, restS, new THREE.Vector3().crossVectors(restP, restS));
  const world = new THREE.Matrix4().makeBasis(p, s, new THREE.Vector3().crossVectors(p, s));
  return out.setFromRotationMatrix(world.multiply(rest.transpose()));
}
const orthogonal = (v: THREE.Vector3, axis: THREE.Vector3, fallback: THREE.Vector3) => {
  const o = v.clone().addScaledVector(axis, -v.dot(axis));
  if (o.lengthSq() < 1e-6) o.copy(fallback).addScaledVector(axis, -fallback.dot(axis));
  return o.normalize();
};

type Limb = { upper: THREE.Bone; lower: THREE.Bone; end: THREE.Bone; a: number; b: number; restUpper: [THREE.Vector3, THREE.Vector3]; restLower: [THREE.Vector3, THREE.Vector3] };

function makeLimb(upper: THREE.Bone, lower: THREE.Bone, end: THREE.Bone, scale: number, restPole?: THREE.Vector3): Limb {
  const u = lower.position.clone().normalize(), l = end.position.clone().normalize();
  // Rest bend direction: the elbow/knee's offset from the straight root-to-end line, unless supplied.
  const line = lower.position.clone().add(end.position).normalize();
  const offset = restPole ?? lower.position.clone().addScaledVector(line, -lower.position.dot(line));
  const fallback = new THREE.Vector3(0, 0, 1);
  return {
    upper, lower, end, a: lower.position.length() * scale, b: end.position.length() * scale,
    restUpper: [u, orthogonal(offset, u, fallback)], restLower: [l, orthogonal(offset, l, fallback)]
  };
}

const tmp = { parent: new THREE.Quaternion(), world: new THREE.Quaternion(), start: new THREE.Vector3() };
function setWorldRotation(bone: THREE.Bone, world: THREE.Quaternion) {
  bone.parent!.getWorldQuaternion(tmp.parent);
  bone.quaternion.copy(tmp.parent.invert().multiply(world));
  bone.updateWorldMatrix(false, false);
}

/** Analytic two-bone IK in world space with a pole (bend-direction) hint. */
function solveLimb(limb: Limb, target: THREE.Vector3, pole: THREE.Vector3) {
  const start = limb.upper.getWorldPosition(tmp.start);
  const toTarget = target.clone().sub(start);
  const dist = THREE.MathUtils.clamp(toTarget.length(), Math.abs(limb.a - limb.b) + 1e-3, limb.a + limb.b - 1e-3);
  const axis = toTarget.normalize();
  const bend = orthogonal(pole, axis, new THREE.Vector3(0, 0, 1));
  const along = (limb.a * limb.a + dist * dist - limb.b * limb.b) / (2 * dist);
  const joint = start.clone().addScaledVector(axis, along).addScaledVector(bend, Math.sqrt(Math.max(0, limb.a * limb.a - along * along)));
  const tip = start.clone().addScaledVector(axis, dist);
  const upperDir = joint.clone().sub(start).normalize();
  const lowerDir = tip.sub(joint).normalize();
  setWorldRotation(limb.upper, basisRotation(limb.restUpper[0], limb.restUpper[1], upperDir, orthogonal(bend, upperDir, axis), tmp.world));
  setWorldRotation(limb.lower, basisRotation(limb.restLower[0], limb.restLower[1], lowerDir, orthogonal(bend, lowerDir, axis), tmp.world));
}

function retintSkin(mesh: THREE.SkinnedMesh, tone: [number, number, number]) {
  mesh.geometry = mesh.geometry.clone();
  const color = mesh.geometry.getAttribute("color") as THREE.BufferAttribute | undefined;
  if (!color) return;
  for (let i = 0; i < color.count; i++) {
    const r = color.getX(i), g = color.getY(i), b = color.getZ(i);
    // Skin vertices are the warm group (~0.5, 0.3, 0.2); whites and dark features are untouched.
    if (r - b > 0.18 && r > 0.38) {
      const shade = THREE.MathUtils.clamp((r + g + b) / 1.0, 0.75, 1.2);
      color.setXYZ(i, tone[0] * shade, tone[1] * shade, tone[2] * shade);
    }
  }
  color.needsUpdate = true;
}

export default function RiggedCricketer({ metrics, frame, role, skin, modelUrl = MODEL_URL, detailed = false }: Props) {
  const loaded = useLoader(GLTFLoader, modelUrl);
  const rig = useMemo(() => {
    const object = clone(loaded.scene);
    object.scale.setScalar(metrics.scale);
    const bones: Record<string, THREE.Bone> = {};
    const generated: (THREE.Mesh | THREE.BufferGeometry | THREE.Material)[] = [];
    object.traverse(child => {
      if (child instanceof THREE.Bone) bones[child.name] = child;
      if (child instanceof THREE.SkinnedMesh) {
        child.castShadow = true; child.receiveShadow = true; child.frustumCulled = false;
        retintSkin(child, skin);
        generated.push(child.geometry);
      }
    });
    const material = (color: string, roughness = 0.6, metalness = 0) => { const m = new THREE.MeshStandardMaterial({ color, roughness, metalness }); generated.push(m); return m; };
    function attach(bone: string, geometry: THREE.BufferGeometry, mat: THREE.Material, position: [number, number, number], rotation: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1]) {
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(...position); mesh.rotation.set(...rotation); mesh.scale.set(...scale);
      mesh.castShadow = true;
      bones[bone].add(mesh);
      generated.push(geometry);
      return mesh;
    }
    if (detailed) {
      const eyeWhite = material("#ddd4bf", 0.5), iris = material("#402b1f", 0.35), pupil = material("#101417", 0.2);
      const brow = material("#322820"), trim = material("#cdb582"), seam = material("#456071");
      for (const x of [-0.085, 0.085]) {
        attach("head", new THREE.SphereGeometry(0.032, 14, 10), eyeWhite, [x, 0.042, 0.237], [0, 0, 0], [1, 0.68, 0.58]);
        attach("head", new THREE.SphereGeometry(0.015, 12, 10), iris, [x, 0.042, 0.254], [0, 0, 0], [1, 1, 0.3]);
        attach("head", new THREE.SphereGeometry(0.007, 10, 8), pupil, [x, 0.042, 0.258], [0, 0, 0], [1, 1, 0.3]);
        attach("head", new THREE.CapsuleGeometry(0.011, 0.048, 3, 8), brow, [x, 0.078, 0.244], [0, 0, Math.PI / 2 + Math.sign(x) * 0.1]);
      }
      attach("neck01", new THREE.TorusGeometry(0.135, 0.018, 6, 24), trim, [0, -0.035, 0.02], [Math.PI / 2, 0, 0]);
      attach("spine01", new THREE.BoxGeometry(0.012, 0.19, 0.008), seam, [0, -0.09, 0.24]);
      for (const side of sides) {
        attach(`foot_${side}`, new THREE.BoxGeometry(0.2, 0.05, 0.39), material("#cad0d2"), [0, -0.16, 0.12]);
        for (let i = 0; i < 4; i++) attach(`foot_${side}`, new THREE.CapsuleGeometry(0.007, 0.11, 3, 6), trim, [0, -0.075, 0.14 + i * 0.035], [0, 0, Math.PI / 2]);
      }
    }
    // Generic, unbranded kit (navy/white); geometry is in model units and scales with the rig.
    if (role === "batter") {
      const navy = material("#1d2a4a", 0.35, 0.15), grille = material("#9aa3ad", 0.3, 0.8), pad = material("#f3f0e6", 0.7), padRib = material("#e6e1d2", 0.75);
      attach("head", new THREE.SphereGeometry(0.3, 28, 18, 0, Math.PI * 2, 0, Math.PI * 0.56), navy, [0, 0.13, 0.0], [0, 0, 0], [1, 1.02, 1.12]);
      attach("head", new THREE.BoxGeometry(0.42, 0.03, 0.18), navy, [0, 0.12, 0.32], [0.18, 0, 0]);
      attach("head", new THREE.TorusGeometry(0.29, 0.015, 6, 24, Math.PI), navy, [0, 0.05, 0.02], [0, 0, Math.PI], [1, 1, 1.18]);
      for (const y of [-0.02, 0.04]) attach("head", new THREE.TorusGeometry(0.27, 0.012, 6, 24, Math.PI * 0.62), grille, [0, y, 0.03], [Math.PI / 2, 0, Math.PI * 0.19], [1, 1.25, 1]);
      for (const x of [-0.07, 0, 0.07]) attach("head", new THREE.CylinderGeometry(0.01, 0.01, 0.14, 6), grille, [x, 0.01, 0.335]);
      for (const side of sides) {
        attach(`lowerleg01_${side}`, new THREE.BoxGeometry(0.34, 0.86, 0.12), pad, [side === "L" ? 0.03 : -0.03, -0.36, 0.13]);
        for (const x of [-0.1, 0, 0.1]) attach(`lowerleg01_${side}`, new THREE.CapsuleGeometry(0.04, 0.68, 3, 8), padRib, [x + (side === "L" ? 0.03 : -0.03), -0.36, 0.2]);
        attach(`lowerleg01_${side}`, new THREE.BoxGeometry(0.36, 0.22, 0.2), pad, [side === "L" ? 0.03 : -0.03, 0.06, 0.1], [-0.25, 0, 0]);
        const fore = bones[`wrist_${side}`].position.clone().normalize();
        attach(`wrist_${side}`, new THREE.SphereGeometry(0.11, 14, 10), pad, [fore.x * 0.11, fore.y * 0.11, fore.z * 0.11], [0, 0, 0], [1.05, 1.2, 1.05]);
        const cuff = attach(`wrist_${side}`, new THREE.CylinderGeometry(0.085, 0.08, 0.1, 12), navy, [fore.x * 0.005, fore.y * 0.005, fore.z * 0.005]);
        cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fore);
        if (detailed) {
          for (let i = 0; i < 4; i++) {
            const finger = attach(`wrist_${side}`, new THREE.CapsuleGeometry(0.022, 0.105, 3, 8), pad, [fore.x * 0.16 + (i - 1.5) * 0.04, fore.y * 0.16, fore.z * 0.16 + 0.05]);
            finger.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), fore);
          }
          for (const y of [-0.1, -0.43, -0.62]) attach(`lowerleg01_${side}`, new THREE.BoxGeometry(0.33, 0.04, 0.04), navy, [0, y, -0.085]);
        }
      }
    } else {
      const navy = material("#1d2a4a", 0.6);
      attach("head", new THREE.SphereGeometry(0.29, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.42), navy, [0, 0.15, -0.01]);
      attach("head", new THREE.CylinderGeometry(0.2, 0.22, 0.02, 20, 1, false, -Math.PI / 2, Math.PI), navy, [0, 0.12, 0.2]);
    }
    const s = metrics.scale;
    const limbs = {
      armL: makeLimb(bones.upperarm01_L, bones.lowerarm01_L, bones.wrist_L, s),
      armR: makeLimb(bones.upperarm01_R, bones.lowerarm01_R, bones.wrist_R, s),
      legL: makeLimb(bones.upperleg01_L, bones.lowerleg01_L, bones.foot_L, s, new THREE.Vector3(0, 0, 1)),
      legR: makeLimb(bones.upperleg01_R, bones.lowerleg01_R, bones.foot_R, s, new THREE.Vector3(0, 0, 1))
    };
    return { object, bones, limbs, generated };
  }, [loaded.scene, metrics, role, skin, detailed]);

  useEffect(() => () => {
    for (const item of rig.generated) {
      if (item instanceof THREE.Mesh) continue;
      item.dispose();
    }
    rig.object.traverse(child => { if (child instanceof THREE.SkinnedMesh) child.skeleton.dispose(); });
  }, [rig]);

  useFrame(() => {
    const current = frame.current;
    if (!current) return;
    const { pose, look } = current;
    const { bones, limbs, object } = rig;
    const s = metrics.scale;
    bones.root.position.set(pose.pelvis.x / s, pose.pelvis.y / s, pose.pelvis.z / s);
    bones.root.quaternion.setFromEuler(new THREE.Euler(pose.lean, pose.yaw, 0, "YXZ"));
    const step = spineStep(pose);
    const spineQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(step.x, step.y, step.z, "YXZ"));
    for (const name of ["spine05", "spine03", "spine01"]) bones[name].quaternion.copy(spineQ);
    for (const name of ["neck01", "head", "shoulder01_L", "shoulder01_R", "wrist_L", "wrist_R"]) bones[name].quaternion.identity();
    object.updateMatrixWorld(true);

    // Head tracks the ball within a comfortable neck range.
    const spineWorld = bones.spine01.getWorldQuaternion(new THREE.Quaternion());
    const headPos = bones.head.getWorldPosition(new THREE.Vector3());
    const toBall = v3(look).sub(headPos).applyQuaternion(spineWorld.invert());
    const yaw = THREE.MathUtils.clamp(Math.atan2(toBall.x, toBall.z), -1.25, 1.25);
    const pitch = THREE.MathUtils.clamp(Math.atan2(-toBall.y, Math.hypot(toBall.x, toBall.z)), -0.5, 0.75);
    bones.neck01.quaternion.setFromEuler(new THREE.Euler(pitch * 0.4, yaw * 0.45, 0, "YXZ"));
    bones.head.quaternion.setFromEuler(new THREE.Euler(pitch * 0.6, yaw * 0.55, 0, "YXZ"));

    // Wrist joints sit HAND (7.5 cm) behind the hand targets, pulled toward each shoulder.
    for (const side of sides) {
      const limb = side === "L" ? limbs.armL : limbs.armR;
      const hand = v3(pose.hands[side]);
      const shoulder = limb.upper.getWorldPosition(new THREE.Vector3());
      const wrist = hand.clone().addScaledVector(hand.clone().sub(shoulder).normalize(), -0.075);
      solveLimb(limb, wrist, v3(pose.elbows[side]));
    }
    for (const side of sides) {
      const limb = side === "L" ? limbs.legL : limbs.legR;
      const foot = pose.feet[side];
      const ankle = new THREE.Vector3(foot.p.x, foot.p.y + metrics.ankle + foot.heel * 0.07, foot.p.z);
      const forward = new THREE.Vector3(Math.sin(foot.yaw), 0.15, Math.cos(foot.yaw));
      solveLimb(limb, ankle, forward);
      setWorldRotation(limb.end, new THREE.Quaternion().setFromEuler(new THREE.Euler(foot.heel * 0.55, foot.yaw, 0, "YXZ")));
    }
  }, 0);

  return <primitive object={rig.object} dispose={null} />;
}
