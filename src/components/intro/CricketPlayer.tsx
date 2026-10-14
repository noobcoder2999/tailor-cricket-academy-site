"use client";
import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import RiggedCricketer, { type RigFrame } from "../simulator/RiggedCricketer";
import { BATTER, BAT } from "../../lib/sim/batting";
import { BOWLER } from "../../lib/sim/bowler";
import { CREASE_MODEL, type CreaseFrame } from "../../lib/crease-match";
import { bodyMetrics, pelvisHeightFor, type BodyPose } from "../../lib/sim/body";
import { vec } from "../../lib/sim/vec";

const skin: [number, number, number] = [0.36, 0.20, 0.115];
const fielderMetrics = bodyMetrics(1.81);
export function PlayerAssetsReady({ onReady }: { onReady: () => void }) {
  useLoader(GLTFLoader, CREASE_MODEL);
  useEffect(onReady, [onReady]);
  return null;
}

function CricketBat({ match }: { match: RefObject<CreaseFrame> }) {
  const ref = useRef<THREE.Group>(null);
  const basis = useMemo(() => ({ x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3(), m: new THREE.Matrix4() }), []);
  const timber = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128; canvas.height = 512;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Bat texture unavailable.");
    ctx.fillStyle = "#dfc18c"; ctx.fillRect(0, 0, 128, 512);
    for (let i = 0; i < 35; i++) {
      ctx.strokeStyle = i % 3 ? "#a7844428" : "#fff1b530";
      ctx.beginPath(); ctx.moveTo(i * 4, 0); ctx.bezierCurveTo(i * 4 - 2, 150, i * 4 + 2, 360, i * 4, 512); ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }, []);
  useEffect(() => () => timber.dispose(), [timber]);
  useFrame(() => {
    if (!ref.current) return;
    const { grip, dir, face } = match.current.batter.bat;
    basis.y.set(-dir.x, -dir.y, -dir.z).normalize();
    basis.z.set(face.x, face.y, face.z).addScaledVector(basis.y, -basis.y.dot(new THREE.Vector3(face.x, face.y, face.z))).normalize();
    basis.x.crossVectors(basis.y, basis.z);
    basis.m.makeBasis(basis.x, basis.y, basis.z);
    ref.current.position.set(grip.x, grip.y, grip.z);
    ref.current.quaternion.setFromRotationMatrix(basis.m);
  }, 0);
  return <group ref={ref} name="right-handed-bat">
    <mesh position={[0, -0.5, 0.015]} castShadow><boxGeometry args={[BAT.width, 0.66, 0.034]} /><meshStandardMaterial map={timber} roughness={0.48} /></mesh>
    <mesh position={[0, -0.51, -0.01]} castShadow><boxGeometry args={[0.052, 0.55, 0.027]} /><meshStandardMaterial color="#c6a86f" roughness={0.5} /></mesh>
    <mesh position={[0, -0.017, 0]} castShadow><cylinderGeometry args={[0.017, 0.018, 0.31, 16]} /><meshStandardMaterial color="#182f43" roughness={0.92} /></mesh>
    {Array.from({ length: 18 }, (_, i) => <mesh key={i} position={[0, -0.15 + i * 0.016, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.017, 0.0014, 4, 12]} /><meshStandardMaterial color="#566472" /></mesh>)}
    <mesh position={[0, -0.24, 0.034]}><planeGeometry args={[0.073, 0.08]} /><meshStandardMaterial color="#173448" /></mesh>
  </group>;
}

export function MatchPlayers({ match }: { match: RefObject<CreaseFrame> }) {
  const batter = useRef<RigFrame | null>(null);
  const bowler = useRef<RigFrame | null>(null);
  useFrame(() => {
    const f = match.current;
    batter.current = { pose: f.batter, look: f.t < -0.4 ? vec(0, 1.8, -19) : f.ball };
    bowler.current = { pose: f.bowler, look: vec(0, 0.9, -1.2) };
  }, -1);
  return <>
    <group name="right-handed-striker"><RiggedCricketer modelUrl={CREASE_MODEL} detailed metrics={BATTER} frame={batter} role="batter" skin={skin} /></group>
    <group name="right-arm-bowler"><RiggedCricketer modelUrl={CREASE_MODEL} detailed metrics={BOWLER} frame={bowler} role="bowler" skin={skin} /></group>
    <CricketBat match={match} />
  </>;
}

export function Fielder({ match, position, keeper = false }: { match: RefObject<CreaseFrame>; position: [number, number]; keeper?: boolean }) {
  const frame = useRef<RigFrame | null>(null);
  useFrame(() => {
    const { t, ball, sim } = match.current;
    const elapsed = Math.max(0, t - sim.batting.tc - 0.25);
    const dx = ball.x - position[0], dz = ball.z - position[1], distance = Math.hypot(dx, dz) || 1;
    const travel = keeper ? 0 : Math.min(elapsed * 2.6, distance * 0.3, 5);
    const x = position[0] + dx / distance * travel, z = position[1] + dz / distance * travel;
    const yaw = Math.atan2(dx, dz), s = Math.sin(yaw), c = Math.cos(yaw);
    const step = Math.sin(elapsed * 12) * Math.min(travel, 0.3);
    const local = (a: number, b: number, h: number) => vec(x + a * c + b * s, h, z - a * s + b * c);
    const pose: BodyPose = {
      pelvis: vec(x, 0.9, z), yaw, lean: keeper ? 0.35 : 0.12, torsoYaw: 0, torsoPitch: keeper ? 0.35 : 0.1, torsoRoll: 0,
      feet: { L: { p: local(0.19, step, Math.max(0, step) * 0.4), yaw, heel: 0 }, R: { p: local(-0.19, -step, Math.max(0, -step) * 0.4), yaw, heel: 0 } },
      hands: { L: local(0.19, 0.28 - step, keeper ? 0.4 : 0.95), R: local(-0.19, 0.28 + step, keeper ? 0.4 : 0.95) },
      elbows: { L: vec(0.6, -0.5, -0.2), R: vec(-0.6, -0.5, -0.2) }
    };
    pose.pelvis.y = pelvisHeightFor(fielderMetrics, pose, keeper ? 0.68 : 0.93);
    frame.current = { pose, look: ball };
  }, -1);
  return <group name={keeper ? "keeper" : "fielder"}><RiggedCricketer modelUrl={CREASE_MODEL} metrics={fielderMetrics} frame={frame} role={keeper ? "batter" : "bowler"} skin={skin} /></group>;
}
