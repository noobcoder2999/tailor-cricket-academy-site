"use client";
/* Three.js scene state is updated outside React by the animation loop. */
/* eslint-disable react-hooks/immutability */
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { fieldLabels, type Role, type Technique } from "../../lib/cricket";
import { CREASE_SECONDS, createCreaseMatch, creaseFrame, creaseCamera, previewTechnique } from "../../lib/crease-match";
import { BALL_RADIUS } from "../../lib/sim/physics";
import { handoffTime } from "../../lib/sim/simulate";
import Stadium, { type StumpsState } from "../simulator/Stadium";
import { MatchPlayers, Fielder, PlayerAssetsReady } from "./CricketPlayer";

type Props = {
  technique: Technique | null; progress: number; role: Role; onReady: () => void; onFailure: () => void;
  selectedZone: string; onZone: (zone: string) => void; overview: boolean; paused: boolean; highQuality: boolean;
};
const positions: [number, number][] = [[18, -22], [-19, -23], [27, -8], [-25, -3], [19, 15], [-18, 20], [10, -40], [-14, -41], [6, 4]];

function Lights({ high }: { high: boolean }) {
  const light = useRef<THREE.DirectionalLight>(null);
  useEffect(() => {
    if (!light.current) return;
    light.current.target.position.set(0, 0, -10);
    light.current.target.updateMatrixWorld();
  }, []);
  return <>
    <hemisphereLight args={["#d8e6ff", "#607644", 1.25]} />
    <directionalLight ref={light} position={[-18, 35, -2]} intensity={2.5} color="#fff1da" castShadow shadow-mapSize={high ? [2048, 2048] : [1024, 1024]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={23} shadow-camera-bottom={-23} shadow-camera-near={1} shadow-camera-far={100} shadow-normalBias={0.012} shadow-bias={-0.00015} />
    <directionalLight position={[20, 15, -30]} intensity={1.1} color="#c9ddff" />
  </>;
}

function Scene({ technique, progress, role, onFailure, labels, caption, overview, paused }: Props & { labels: RefObject<HTMLDivElement | null>; caption: RefObject<HTMLSpanElement | null> }) {
  const { gl, size, camera } = useThree();
  const previews = useMemo(() => Array.from({ length: role === "batsman" ? 5 : 6 }, (_, cycle) => {
    const choice = previewTechnique(role, cycle);
    return { choice, sim: createCreaseMatch(choice) };
  }), [role]);
  const selected = useMemo(() => technique ? createCreaseMatch(technique) : null, [technique]);
  const elapsed = useRef(0);
  const match = useRef(creaseFrame(previews[0].sim, 0));
  const stumps = useRef<StumpsState>({ t: 0, hitAt: null, ballX: 0 });
  const ball = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(), []);
  const projected = useMemo(() => new THREE.Vector3(), []);
  const initialized = useRef(false);
  const lastCycle = useRef(-1);
  const lastTechnique = useRef(technique);
  const lastOverview = useRef(overview);
  useEffect(() => {
    const lost = (event: Event) => { event.preventDefault(); onFailure(); };
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl, onFailure]);
  useFrame((_, delta) => {
    if (initialized.current && !paused && !technique) elapsed.current += delta;
    const cycle = Math.floor(elapsed.current / CREASE_SECONDS);
    const preview = previews[cycle % previews.length];
    const sim = selected ?? preview.sim;
    const p = selected ? progress : (elapsed.current % CREASE_SECONDS) / CREASE_SECONDS;
    match.current = creaseFrame(sim, p);
    const f = match.current;
    stumps.current = { t: f.t, hitAt: sim.bowled ? handoffTime(sim) : null, ballX: sim.batting.ball.p.x };
    const pose = creaseCamera(f, overview && !technique, size.width / size.height);
    const view = camera as THREE.PerspectiveCamera;
    const reset = !initialized.current || cycle !== lastCycle.current || technique !== lastTechnique.current || overview !== lastOverview.current;
    const blend = reset ? 1 : paused && !technique ? 0 : 1 - Math.exp(-delta * 7);
    view.position.lerp(projected.set(pose.position.x, pose.position.y, pose.position.z), blend);
    target.lerp(projected.set(pose.target.x, pose.target.y, pose.target.z), blend);
    view.fov = THREE.MathUtils.lerp(view.fov, pose.fov, blend);
    view.lookAt(target); view.updateProjectionMatrix(); view.updateMatrixWorld();
    initialized.current = true; lastCycle.current = cycle; lastTechnique.current = technique; lastOverview.current = overview;
    if (ball.current) {
      ball.current.position.set(f.ball.x, f.ball.y, f.ball.z);
      ball.current.rotation.set(f.t * 28, 0.35, f.t * 5);
    }
    const attrs: Record<string, string> = {
      "data-camera-phase": pose.phase, "data-camera-height": view.position.y.toFixed(2),
      "data-match-time": (technique ? progress * CREASE_SECONDS : elapsed.current).toFixed(2),
      "data-bowler-z": f.bowler.pelvis.z.toFixed(2), "data-match-phase": f.phase,
      "data-bowling-arm": "right", "data-batting-hand": "right", "data-ball-phase": f.t < 0 ? "held" : f.t < sim.batting.tc ? "delivery" : sim.batting.hit ? "after-contact" : "past-bat",
      "data-ball-x": f.ball.x.toFixed(3), "data-ball-y": f.ball.y.toFixed(3), "data-ball-z": f.ball.z.toFixed(3),
      "data-contact-kind": sim.batting.kind, "data-render-width": String(gl.domElement.width)
    };
    for (const [key, value] of Object.entries(attrs)) if (gl.domElement.getAttribute(key) !== value) gl.domElement.setAttribute(key, value);
    const text = `${paused && !technique ? "PAUSED" : f.phase} / ${(technique ?? preview.choice).name} / ${sim.delivery.input.speedKph} KM/H`;
    if (caption.current?.textContent !== text) caption.current?.replaceChildren(text);
    fieldLabels.forEach((label, index) => {
      const node = labels.current?.children[index] as HTMLElement | undefined;
      if (!node) return;
      projected.set(-label.x, 0.1, label.z - 10).project(camera);
      node.style.left = `${(projected.x * 0.5 + 0.5) * size.width}px`;
      node.style.top = `${(-projected.y * 0.5 + 0.5) * size.height}px`;
      node.style.visibility = overview && !technique ? "visible" : "hidden";
    });
  }, -2);
  return <>
    <Stadium strikerStumps={stumps} crease />
    <MatchPlayers match={match} />
    <Fielder match={match} position={[0, 5.5]} keeper />
    {positions.map(position => <Fielder key={position.join(",")} position={position} match={match} />)}
    <group ref={ball} name="match-ball">
      <mesh castShadow><sphereGeometry args={[BALL_RADIUS, 24, 18]} /><meshStandardMaterial color="#faf2d4" roughness={0.4} /></mesh>
      {[-0.002, 0.002].map(z => <mesh key={z} position={[0, 0, z]}><torusGeometry args={[BALL_RADIUS, 0.0009, 4, 32]} /><meshStandardMaterial color="#a18e6d" /></mesh>)}
    </group>
  </>;
}

export default function FieldScene(props: Props) {
  const labels = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLSpanElement>(null);
  return <div className="immersive-scene">
    <Canvas className="three-canvas" shadows dpr={props.highQuality ? [1.25, 1.75] : 1} camera={{ position: [5, 2.3, -5.5], fov: 36, near: 0.08, far: 500 }} gl={{ antialias: true, powerPreference: "high-performance" }} onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.12; gl.shadowMap.type = THREE.PCFSoftShadowMap; }}>
      <fog attach="fog" args={["#748695", 130, 350]} />
      <Lights high={props.highQuality} />
      <PlayerAssetsReady onReady={props.onReady} />
      <Scene {...props} labels={labels} caption={caption} />
    </Canvas>
    <div className="world-labels" ref={labels} inert={!props.overview || Boolean(props.technique)}>{fieldLabels.map(label => <button key={label.name} aria-label={`Explore ${label.name} region`} aria-pressed={props.selectedZone === label.name} onClick={() => props.onZone(label.name)}>{label.name}</button>)}</div>
    <div className="match-broadcast"><span className="match-live-dot" /><strong>TAILOR / MATCH CENTRE</strong><span ref={caption}>PREPARING DELIVERY</span><small>ORIGINAL 3D SIMULATION · SLIGHTLY SLOWED DELIVERY</small></div>
  </div>;
}
