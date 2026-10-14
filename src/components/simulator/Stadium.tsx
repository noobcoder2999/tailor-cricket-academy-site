"use client";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { BOUNDARY_RADIUS, BOWLER_STUMPS_Z, GROUND_CENTER, PITCH } from "../../lib/sim/physics";

/** Seeded procedural textures keep the venue original and free of downloaded assets. */
function seeded(seed: number) { return () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; }; }
function canvasTexture(width: number, height: number, draw: (ctx: CanvasRenderingContext2D, random: () => number) => void, seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D unavailable");
  draw(ctx, seeded(seed));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function outfieldTexture() {
  const texture = canvasTexture(1024, 1024, (ctx, random) => {
    for (let i = 0; i < 16; i++) { ctx.fillStyle = i % 2 ? "#3f6b2f" : "#4b7a36"; ctx.fillRect(0, i * 64, 1024, 64); }
    for (let i = 0; i < 60000; i++) {
      const shade = Math.floor(random() * 40);
      ctx.fillStyle = `rgba(${40 + shade},${80 + shade},${30 + shade * 0.6},${0.12 + random() * 0.25})`;
      ctx.fillRect(random() * 1024, random() * 1024, 0.8, 2 + random() * 5);
    }
  }, 41);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(9, 9);
  return texture;
}
function pitchTexture() {
  return canvasTexture(256, 1792, (ctx, random) => {
    const g = ctx.createLinearGradient(0, 0, 256, 0);
    g.addColorStop(0, "#9c9670"); g.addColorStop(0.18, "#c2b48a"); g.addColorStop(0.5, "#cbbd93"); g.addColorStop(0.82, "#c2b48a"); g.addColorStop(1, "#9c9670");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 1792);
    for (let i = 0; i < 26000; i++) {
      const shade = Math.floor(random() * 50);
      ctx.fillStyle = `rgba(${110 + shade},${98 + shade},${64 + shade},${random() * 0.3})`;
      ctx.fillRect(random() * 256, random() * 1792, random() * 2.5, 1);
    }
    // Wear and foot-marks at both ends, a few hairline cracks in the middle.
    for (const y of [200, 1592]) {
      const wear = ctx.createRadialGradient(128, y, 4, 128, y, 120);
      wear.addColorStop(0, "#8f7c5a66"); wear.addColorStop(1, "#8f7c5a00");
      ctx.fillStyle = wear; ctx.fillRect(0, y - 140, 256, 280);
    }
    ctx.strokeStyle = "#7f6d4c55"; ctx.lineWidth = 1;
    for (let i = 0; i < 50; i++) {
      const x = 40 + random() * 176, y = 300 + random() * 1200;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (random() - 0.5) * 18, y + random() * 40); ctx.lineTo(x + (random() - 0.5) * 24, y + 30 + random() * 40); ctx.stroke();
    }
  }, 613);
}
function crowdTexture() {
  const texture = canvasTexture(1024, 256, (ctx, random) => {
    ctx.fillStyle = "#1b2130"; ctx.fillRect(0, 0, 1024, 256);
    const palette = ["#e8e2d4", "#2f5fa8", "#f2b134", "#c2402f", "#3c8c5a", "#d9d9e3", "#22324f", "#9a5fb0", "#f07a3a"];
    for (let row = 0; row < 16; row++) {
      ctx.fillStyle = row % 2 ? "#232a3a" : "#283043"; ctx.fillRect(0, row * 16, 1024, 3);
      for (let x = 0; x < 1024; x += 5 + random() * 3) {
        if (random() < 0.12) continue;
        ctx.fillStyle = palette[Math.floor(random() * palette.length)];
        ctx.fillRect(x, row * 16 + 5, 4, 9);
        ctx.fillStyle = `rgb(${120 + random() * 80},${80 + random() * 60},${55 + random() * 40})`;
        ctx.fillRect(x + 0.6, row * 16 + 2, 2.6, 3);
      }
    }
  }, 97);
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(10, 1);
  return texture;
}
function boardTexture(crease: boolean) {
  const texture = canvasTexture(1024, 64, ctx => {
    const messages = ["TAILOR CRICKET ACADEMY", crease ? "ENTER THE CREASE" : "BATTING LAB", "PLAY STRAIGHT", "WATCH THE BALL"];
    messages.forEach((text, i) => {
      ctx.fillStyle = i % 2 ? "#102f26" : "#1d2a4a"; ctx.fillRect(i * 256, 0, 256, 64);
      ctx.fillStyle = i % 2 ? "#c9b781" : "#f5f2e9"; ctx.font = "bold 22px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(text, i * 256 + 128, 33);
    });
  }, 5);
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(14, 1);
  return texture;
}
function skyTexture() {
  return canvasTexture(16, 512, ctx => {
    const g = ctx.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#0b1426"); g.addColorStop(0.45, "#1d3557"); g.addColorStop(0.75, "#4f6b8a"); g.addColorStop(1, "#c79a6b");
    ctx.fillStyle = g; ctx.fillRect(0, 0, 16, 512);
  }, 1);
}

const white = "#f7f5ee";
function Line({ x, z, w, d }: { x: number; z: number; w: number; d: number }) {
  return <mesh position={[x, 0.004, z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[w, d]} /><meshStandardMaterial color={white} roughness={0.9} /></mesh>;
}
function Creases({ stumpsZ, dir }: { stumpsZ: number; dir: 1 | -1 }) {
  const popping = stumpsZ - dir * PITCH.poppingCrease;
  return <>
    <Line x={0} z={stumpsZ} w={2.64} d={0.05} />
    <Line x={0} z={popping} w={3.66} d={0.05} />
    {[-1, 1].map(side => <Line key={side} x={side * PITCH.returnCrease} z={popping + dir * 1.22} w={0.05} d={2.44 + 0.05} />)}
  </>;
}

export type StumpsState = { t: number; hitAt: number | null; ballX: number };
const STUMP_X = [-PITCH.stumpHalfWidth + 0.019, 0, PITCH.stumpHalfWidth - 0.019];

function Stumps({ z, state }: { z: number; state?: RefObject<StumpsState> }) {
  const stumps = useRef<(THREE.Mesh | null)[]>([]);
  const bails = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const s = state?.current;
    const dt = s && s.hitAt !== null ? Math.max(0, s.t - s.hitAt) : 0;
    const hit = s && s.hitAt !== null && s.t >= s.hitAt;
    stumps.current.forEach((stump, i) => {
      if (!stump) return;
      const struck = hit ? Math.max(0, 1 - Math.abs(STUMP_X[i] - (s?.ballX ?? 0)) / 0.15) : 0;
      const lean = struck * Math.min(1, dt * 6) * 0.42;
      stump.rotation.set(lean, 0, 0);
      stump.position.set(STUMP_X[i], PITCH.stumpHeight / 2 * Math.cos(lean), z + Math.sin(lean) * PITCH.stumpHeight / 2);
    });
    bails.current.forEach((bail, i) => {
      if (!bail) return;
      const x0 = i ? 0.057 : -0.057;
      if (!hit) { bail.position.set(x0, PITCH.stumpHeight + 0.008, z); bail.rotation.set(0, 0, Math.PI / 2); return; }
      const vx = (i ? 1.4 : -1.1) + (s?.ballX ?? 0) * 3, vy = 3.4 - i * 0.6, vz = 2.6 + i * 0.5;
      const y = Math.max(0.01, PITCH.stumpHeight + vy * dt - 4.9 * dt * dt);
      const flight = Math.min(dt, (vy + Math.sqrt(vy * vy + 2 * 9.8 * PITCH.stumpHeight)) / 9.8);
      bail.position.set(x0 + vx * flight, y, z + vz * flight);
      bail.rotation.set(flight * 14, flight * 6, Math.PI / 2 + flight * 9);
    });
  });
  return <group>
    {STUMP_X.map((x, i) => <mesh key={x} ref={m => { stumps.current[i] = m; }} position={[x, PITCH.stumpHeight / 2, z]} castShadow><cylinderGeometry args={[0.018, 0.018, PITCH.stumpHeight, 12]} /><meshStandardMaterial color="#efe6cf" roughness={0.45} /></mesh>)}
    {[0, 1].map(i => <mesh key={i} ref={m => { bails.current[i] = m; }} castShadow><capsuleGeometry args={[0.009, 0.09, 3, 8]} /><meshStandardMaterial color="#efe6cf" roughness={0.45} /></mesh>)}
  </group>;
}

function Floodlight({ angle }: { angle: number }) {
  const r = 104, x = GROUND_CENTER.x + Math.sin(angle) * r, z = GROUND_CENTER.z + Math.cos(angle) * r;
  return <group position={[x, 0, z]} rotation={[0, angle + Math.PI, 0]}>
    <mesh position={[0, 26, 0]}><cylinderGeometry args={[0.5, 1.1, 52, 8]} /><meshStandardMaterial color="#4a5260" metalness={0.5} roughness={0.5} /></mesh>
    <mesh position={[0, 53, 0.6]} rotation={[-0.45, 0, 0]}><boxGeometry args={[11, 5, 0.6]} /><meshStandardMaterial color="#2a3140" /></mesh>
    <mesh position={[0, 53, 0.95]} rotation={[-0.45, 0, 0]}><planeGeometry args={[10.4, 4.4]} /><meshBasicMaterial color="#fffbea" toneMapped={false} /></mesh>
  </group>;
}

export default function Stadium({ strikerStumps, crease = false }: { strikerStumps: RefObject<StumpsState>; crease?: boolean }) {
  const textures = useMemo(() => {
    const outfield = outfieldTexture(), boards = boardTexture(crease);
    if (crease) {
      outfield.repeat.set(1, 1);
      boards.repeat.x = -14;
    }
    return { outfield, pitch: pitchTexture(), crowd: crowdTexture(), boards, sky: skyTexture() };
  }, [crease]);
  useEffect(() => () => Object.values(textures).forEach(t => t.dispose()), [textures]);
  const c = GROUND_CENTER;
  const innerRing = useMemo(() => Array.from({ length: 64 }, (_, i) => i / 64 * Math.PI * 2), []);
  return <group>
    <mesh position={[c.x, 70, c.z]}><sphereGeometry args={[260, 32, 16]} /><meshBasicMaterial map={textures.sky} side={THREE.BackSide} depthWrite={false} toneMapped={false} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[c.x, 0, c.z]} receiveShadow><circleGeometry args={[BOUNDARY_RADIUS + 12, 96]} /><meshStandardMaterial map={textures.outfield} roughness={0.95} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[c.x, 0.002, c.z]} receiveShadow><planeGeometry args={[PITCH.width, PITCH.length + 4.4]} /><meshStandardMaterial map={textures.pitch} roughness={0.92} /></mesh>
    <Creases stumpsZ={0} dir={1} />
    <Creases stumpsZ={BOWLER_STUMPS_Z} dir={-1} />
    <Stumps z={0} state={strikerStumps} />
    <Stumps z={BOWLER_STUMPS_Z} />
    {innerRing.map(a => <mesh key={a} position={[c.x + Math.sin(a) * 27.4, 0.004, c.z + Math.cos(a) * 27.4]} rotation={[-Math.PI / 2, 0, a]}><planeGeometry args={[0.12, 0.7]} /><meshStandardMaterial color={white} /></mesh>)}
    <mesh position={[c.x, 0.07, c.z]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[BOUNDARY_RADIUS, 0.07, 6, 160]} /><meshStandardMaterial color="#f1efe6" /></mesh>
    <mesh position={[c.x, 0.5, c.z]}><cylinderGeometry args={[BOUNDARY_RADIUS + 5, BOUNDARY_RADIUS + 5, 1, 96, 1, true]} /><meshStandardMaterial map={textures.boards} side={THREE.BackSide} emissive="#ffffff" emissiveIntensity={0.18} emissiveMap={textures.boards} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[c.x, -0.01, c.z]}><ringGeometry args={[BOUNDARY_RADIUS + 5, 130, 64]} /><meshStandardMaterial color="#2b3a2c" roughness={1} /></mesh>
    {[0, 1, 2].map(tier => <mesh key={tier} position={[c.x, 3 + tier * 6.5, c.z]}><cylinderGeometry args={[BOUNDARY_RADIUS + 12 + tier * 9, BOUNDARY_RADIUS + 8 + tier * 9, 7, 72, 1, true]} /><meshStandardMaterial map={textures.crowd} side={THREE.BackSide} roughness={0.9} /></mesh>)}
    <mesh position={[c.x, 22, c.z]}><cylinderGeometry args={[BOUNDARY_RADIUS + 36, BOUNDARY_RADIUS + 30, 1.2, 72, 1, true]} /><meshStandardMaterial color="#c8ccd4" side={THREE.DoubleSide} metalness={0.3} roughness={0.4} /></mesh>
    {[1, -1].map(end => <mesh key={end} position={[0, 4.5, c.z + end * (BOUNDARY_RADIUS + 6.5)]}><boxGeometry args={[22, 9, 0.4]} /><meshStandardMaterial color={end > 0 ? "#f4f4f0" : "#f4f4f0"} roughness={0.85} /></mesh>)}
    {[0.75, 2.35, 3.9, 5.5].map(a => <Floodlight key={a} angle={a} />)}
  </group>;
}
