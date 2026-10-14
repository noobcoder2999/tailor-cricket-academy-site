"use client";
/* R3F's frame loop intentionally mutates Three.js scene objects outside React rendering. */
/* eslint-disable react-hooks/immutability */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { BATTER, BAT, batterPoseAt } from "../../lib/sim/batting";
import { BOWLER, bowlerPoseAt, bowlingHand } from "../../lib/sim/bowler";
import { cameraShot, dampShot, directorCamera, type CameraId, type CameraShot } from "../../lib/sim/camera";
import { BALL_RADIUS } from "../../lib/sim/physics";
import { tick, type Clock, type ReplayMode } from "../../lib/sim/replay";
import { ballAt, handoffTime, type Simulation } from "../../lib/sim/simulate";
import { cross, normalize, sub, vec } from "../../lib/sim/vec";
import RiggedCricketer, { type RigFrame } from "./RiggedCricketer";
import Stadium, { type StumpsState } from "./Stadium";

export type SceneProps = {
  sim: Simulation;
  clock: RefObject<Clock>;
  camera: CameraId;
  mode: ReplayMode;
  onFailure: () => void;
  onReady: () => void;
};

// Linear-space skin tones for the two generic athletes (not modelled on anyone).
const BATTER_SKIN: [number, number, number] = [0.36, 0.2, 0.115];
const BOWLER_SKIN: [number, number, number] = [0.5, 0.31, 0.2];

function Bat({ frame }: { frame: RefObject<RigFrame & { bat?: { grip: { x: number; y: number; z: number }; dir: { x: number; y: number; z: number }; face: { x: number; y: number; z: number } } } | null> }) {
  const group = useRef<THREE.Group>(null);
  const basis = useMemo(() => ({ m: new THREE.Matrix4(), x: new THREE.Vector3(), y: new THREE.Vector3(), z: new THREE.Vector3() }), []);
  useFrame(() => {
    const bat = frame.current?.bat;
    if (!group.current || !bat) return;
    // Local frame: +Y up the handle, +Z out of the hitting face, origin between the hands.
    const y = normalize(vec(-bat.dir.x, -bat.dir.y, -bat.dir.z));
    const z = normalize(sub(bat.face, vec(y.x * (bat.face.x * y.x + bat.face.y * y.y + bat.face.z * y.z), y.y * (bat.face.x * y.x + bat.face.y * y.y + bat.face.z * y.z), y.z * (bat.face.x * y.x + bat.face.y * y.y + bat.face.z * y.z))));
    const x = cross(y, z);
    basis.m.makeBasis(basis.x.set(x.x, x.y, x.z), basis.y.set(y.x, y.y, y.z), basis.z.set(z.x, z.y, z.z));
    group.current.quaternion.setFromRotationMatrix(basis.m);
    group.current.position.set(bat.grip.x, bat.grip.y, bat.grip.z);
  }, 0);
  const handleTop = BAT.length - BAT.gripToToe, bladeTop = -0.17, toe = -BAT.gripToToe;
  const bladeLength = bladeTop - toe;
  return <group ref={group}>
    <mesh position={[0, (handleTop + bladeTop) / 2, 0]} castShadow><cylinderGeometry args={[0.017, 0.016, handleTop - bladeTop, 12]} /><meshStandardMaterial color="#1d2a4a" roughness={0.8} /></mesh>
    <mesh position={[0, handleTop + 0.008, 0]}><sphereGeometry args={[0.019, 10, 8]} /><meshStandardMaterial color="#1d2a4a" roughness={0.8} /></mesh>
    <mesh position={[0, bladeTop + 0.02, 0]} castShadow><cylinderGeometry args={[0.015, 0.03, 0.06, 10]} /><meshStandardMaterial color="#d8be8a" roughness={0.55} /></mesh>
    <mesh position={[0, toe + bladeLength / 2, BAT.thickness / 2 - 0.016]} castShadow><boxGeometry args={[BAT.width, bladeLength, 0.032]} /><meshStandardMaterial color="#e2c993" roughness={0.5} /></mesh>
    <mesh position={[0, toe + bladeLength * 0.45, -0.004]} castShadow><boxGeometry args={[BAT.width * 0.5, bladeLength * 0.82, 0.03]} /><meshStandardMaterial color="#d3b57c" roughness={0.55} /></mesh>
    <mesh position={[0, toe + 0.004, BAT.thickness / 2 - 0.016]}><boxGeometry args={[BAT.width, 0.008, 0.033]} /><meshStandardMaterial color="#b89a64" roughness={0.6} /></mesh>
  </group>;
}

function Tracking({ sim, visible }: { sim: Simulation; visible: boolean }) {
  const { line, pitch, impact } = useMemo(() => {
    const end = handoffTime(sim);
    const points = sim.delivery.samples.filter(s => s.t <= end).map(s => new THREE.Vector3(s.p.x, s.p.y, s.p.z));
    const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.filter((_, i) => i % 8 === 0 || i === points.length - 1)), 160, BALL_RADIUS * 0.9, 8, false);
    const material = new THREE.MeshBasicMaterial({ color: "#ff5a3c", transparent: true, opacity: 0.55, depthWrite: false });
    const last = points[points.length - 1];
    return { line: new THREE.Mesh(geometry, material), pitch: sim.delivery.pitch.p, impact: last };
  }, [sim]);
  useEffect(() => () => { line.geometry.dispose(); (line.material as THREE.Material).dispose(); }, [line]);
  if (!visible) return null;
  return <group>
    <primitive object={line} />
    <mesh position={[pitch.x, 0.006, pitch.z]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.07, 0.11, 32]} /><meshBasicMaterial color="#ffd166" transparent opacity={0.9} /></mesh>
    <mesh position={[impact.x, impact.y, impact.z]}><sphereGeometry args={[0.05, 16, 12]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.65} /></mesh>
  </group>;
}

function Director({ sim, clock, camera, mode, onFailure, onReady }: SceneProps) {
  const { gl, camera: view, size } = useThree();
  const batterFrame = useRef<(RigFrame & { bat?: ReturnType<typeof batterPoseAt>["bat"] }) | null>(null);
  const bowlerFrame = useRef<RigFrame | null>(null);
  const stumps = useRef<StumpsState>({ t: 0, hitAt: null, ballX: 0 });
  const ball = useRef<THREE.Mesh>(null);
  const trail = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(48 * 3), 3));
    return new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: "#ffe9b0", transparent: true, opacity: 0.55 }));
  }, []);
  const shot = useRef<CameraShot | null>(null);
  const lastT = useRef(-Infinity);
  useEffect(onReady, [onReady]);
  useEffect(() => () => { trail.geometry.dispose(); (trail.material as THREE.Material).dispose(); }, [trail]);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);

  useFrame((_, dt) => {
    clock.current = tick(clock.current, dt);
    const t = clock.current.t;
    const sample = ballAt(sim, t);
    const p = sample.phase === "hand" ? bowlingHand(sim.bowler, t) : sample.p;
    const batter = batterPoseAt(sim.batting, t);
    batterFrame.current = { pose: batter, look: t < -0.4 ? vec(-0.4, 2, -18) : p, bat: batter.bat };
    bowlerFrame.current = { pose: bowlerPoseAt(sim.bowler, t), look: t < 0.2 ? vec(0, 0.8, -1) : p };
    stumps.current = { t, hitAt: sim.bowled ? handoffTime(sim) : null, ballX: sim.batting.ball.p.x };
    if (ball.current) {
      ball.current.position.set(p.x, p.y, p.z);
      if (sample.phase !== "hand") ball.current.rotation.x -= dt * clock.current.rate * (clock.current.playing ? 28 : 0);
    }
    // Trail of recent ball positions (sampled backwards in sim time, so it also works when scrubbing).
    const positions = trail.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < 48; i++) {
      const tt = Math.max(0, t - i * 0.012);
      const q = t <= 0 ? p : ballAt(sim, tt).p;
      positions.setXYZ(i, q.x, q.y, q.z);
    }
    positions.needsUpdate = true;
    trail.visible = t > 0;

    const hit = !!sim.batting.hit;
    const id = mode === "director" ? directorCamera(t, sim.batting.tc, hit) : mode === "tracking" && camera !== "wicket" && camera !== "bowler-end" ? "behind" : camera;
    const target = cameraShot(id, { ball: p, ballVelocity: sample.v, batter: sim.batting.ball.p, hitInPlay: sample.phase === "after" && hit });
    const jumped = Math.abs(t - lastT.current) > 0.5 || !shot.current;
    shot.current = jumped ? target : dampShot(shot.current!, target, Math.min(dt, 0.1), id === "ball-follow" ? 6 : 4.5);
    lastT.current = t;
    const cam = view as THREE.PerspectiveCamera;
    cam.position.set(shot.current.position.x, shot.current.position.y, shot.current.position.z);
    cam.lookAt(shot.current.target.x, shot.current.target.y, shot.current.target.z);
    // Long lenses look the same on narrow screens by widening vertically.
    const aspect = size.width / Math.max(1, size.height);
    cam.fov = shot.current.fov * (aspect < 1.2 ? 1.2 / Math.max(0.6, aspect) : 1);
    cam.near = id === "wicket" ? 0.03 : 0.1;
    cam.updateProjectionMatrix();
  }, -1);

  return <>
    <Stadium strikerStumps={stumps} />
    <RiggedCricketer metrics={BATTER} frame={batterFrame} role="batter" skin={BATTER_SKIN} />
    <RiggedCricketer metrics={BOWLER} frame={bowlerFrame} role="bowler" skin={BOWLER_SKIN} />
    <Bat frame={batterFrame} />
    <mesh ref={ball} castShadow><sphereGeometry args={[BALL_RADIUS, 20, 14]} /><meshStandardMaterial color="#b0171c" roughness={0.35} /></mesh>
    <primitive object={trail} />
    <Tracking sim={sim} visible={mode === "tracking"} />
  </>;
}

function Lights() {
  const light = useRef<THREE.DirectionalLight>(null);
  useEffect(() => {
    const l = light.current;
    if (!l) return;
    l.target.position.set(0, 0, -8);
    l.target.updateMatrixWorld();
    const s = l.shadow.camera;
    s.left = -14; s.right = 14; s.top = 16; s.bottom = -16; s.near = 10; s.far = 120;
    s.updateProjectionMatrix();
  }, []);
  return <>
    <hemisphereLight args={["#c7d6f0", "#2f4a2a", 0.85]} />
    <directionalLight ref={light} position={[28, 48, 18]} intensity={2.4} color="#fff3dc" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.02} />
    <directionalLight position={[-30, 40, -60]} intensity={0.9} color="#dfe8ff" />
  </>;
}

export default function SimulatorScene(props: SceneProps) {
  return <Canvas shadows dpr={[1, 1.75]} camera={{ position: [1.2, 8.5, -58], fov: 13, near: 0.1, far: 700 }} gl={{ antialias: true, powerPreference: "high-performance" }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.05; }}>
    <fog attach="fog" args={["#1a2a40", 160, 420]} />
    <Lights />
    <Suspense fallback={null}><Director {...props} /></Suspense>
  </Canvas>;
}
