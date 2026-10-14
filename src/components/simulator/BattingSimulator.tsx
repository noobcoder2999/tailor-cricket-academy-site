"use client";
import { Component, Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { defaultControl, type BattingControl, type Phase } from "../../lib/sim/batting";
import { cameras, type CameraId } from "../../lib/sim/camera";
import { defaultDelivery, deliveryType, deliveryTypes, lengthLabel, lengths, lineLabel, lines, pitches, type DeliveryInput } from "../../lib/sim/delivery";
import { BOUNDARY_RADIUS, GROUND_CENTER, PITCH } from "../../lib/sim/physics";
import { createClock, playbackRates, replayModes, rewind, seek, tick, type Clock, type ReplayMode } from "../../lib/sim/replay";
import { shotById, shotGroups, shots, type ShotId } from "../../lib/sim/shots";
import { handoffTime, simulate, type Simulation } from "../../lib/sim/simulate";

const SimulatorScene = lazy(() => import("./SimulatorScene"));

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? null : this.props.children; }
}

function hasWebGL() {
  const canvas = document.createElement("canvas");
  try {
    const context = canvas.getContext("webgl2") || canvas.getContext("webgl");
    if (!context) return false;
    context.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch { return false; }
}

const kindLabel: Record<string, string> = {
  middled: "Middled", mistimed: "Mistimed", "edge-outside": "Outside edge", "edge-inside": "Inside edge", "top-edge": "Top edge",
  defended: "Defended", missed: "Beaten", left: "Left alone"
};
const fmt = (n: number, digits = 0) => n.toFixed(digits);

/** Mirrors the scene-owned clock into React at a modest rate, so only small widgets re-render. */
function useClockView(clock: RefObject<Clock>, fps = 20) {
  const [view, setView] = useState(() => ({ t: clock.current.t, playing: clock.current.playing }));
  useEffect(() => {
    let frame = 0, last = 0;
    const loop = (now: number) => {
      if (now - last > 1000 / fps) {
        last = now;
        const c = clock.current;
        setView(v => (Math.abs(v.t - c.t) > 1e-4 || v.playing !== c.playing ? { t: c.t, playing: c.playing } : v));
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [clock, fps]);
  return view;
}

function currentPhase(phases: Phase[], t: number): Phase | null {
  const active = phases.filter(p => t >= p.start && t < p.end);
  if (!active.length) return t >= phases[phases.length - 1].end ? phases[phases.length - 1] : null;
  return active.find(p => p.id === "contact") ?? active.reduce((a, b) => (b.start >= a.start ? b : a));
}

function Overlay({ sim, clock, mode, camera }: { sim: Simulation; clock: RefObject<Clock>; mode: ReplayMode; camera: CameraId }) {
  const { t } = useClockView(clock, 15);
  const a = sim.delivery.analysis;
  const phase = currentPhase(sim.batting.phases, t);
  const released = t >= 0;
  const done = t >= handoffTime(sim) + 0.3;
  const style = sim.delivery.type.style;
  return <div className="sim-overlay" aria-live="polite">
    <div className="sim-bug">
      <span className="sim-bug-tag">{mode === "live" ? "LIVE" : "REPLAY"}</span>
      <span className="sim-bug-name">A. Mehra<small>fictional · RHB</small></span>
      <span className="sim-bug-cam">{cameras.find(c => c.id === camera)?.label}{mode === "director" ? " · multi-angle" : mode === "tracking" ? " · tracking" : ""}</span>
    </div>
    <div className={`sim-speed ${released ? "is-on" : ""}`}>
      <strong>{fmt(a.releaseKph)}</strong><span>km/h</span>
      <small>{lengthLabel(a.length, style)} · {lineLabel(a.lineAtStumps)}</small>
    </div>
    {phase && !done && <div className="sim-phase"><span>{phase.label}</span><p>{phase.note}</p></div>}
    {done && <div className={`sim-result ${sim.outcome.bowled ? "is-out" : sim.outcome.runs && sim.outcome.runs >= 4 ? "is-boundary" : ""}`}>
      <strong>{sim.outcome.headline}</strong>
      {sim.outcome.runs !== null && !sim.outcome.bowled && <span className="sim-runs">{sim.outcome.runs} {sim.outcome.runs === 1 ? "run" : "runs"} (est.)</span>}
      <p>{sim.outcome.detail}</p>
    </div>}
  </div>;
}

function Transport({ sim, clock: clockRef, rate, setRate, onBowl, onReplay, onReset, replayMode, setReplayMode }: {
  sim: Simulation; clock: RefObject<Clock>; rate: number; setRate: (r: number) => void; onBowl: () => void; onReplay: () => void; onReset: () => void;
  replayMode: Exclude<ReplayMode, "live">; setReplayMode: (m: Exclude<ReplayMode, "live">) => void;
}) {
  const { t, playing } = useClockView(clockRef, 30);
  const atEnd = t >= sim.end - 1e-3;
  const toggle = () => { if (atEnd) onReplay(); else clockRef.current = { ...clockRef.current, playing: !clockRef.current.playing }; };
  const tc = sim.batting.tc;
  const pct = (x: number) => `${((x - sim.start) / (sim.end - sim.start)) * 100}%`;
  return <div className="sim-transport">
    <div className="sim-transport-row">
      <button className="sim-btn sim-btn-primary" onClick={onBowl}>Bowl</button>
      <button className="sim-btn" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>{playing ? "Pause" : atEnd ? "Replay" : "Play"}</button>
      <button className="sim-btn" onClick={onReplay}>Replay</button>
      <button className="sim-btn sim-btn-ghost" onClick={onReset}>Reset</button>
      <div className="sim-seg" role="group" aria-label="Playback speed">
        {playbackRates.map(r => <button key={r} aria-pressed={rate === r} onClick={() => setRate(r)}>{r === 1 ? "1×" : `${r}×`}</button>)}
      </div>
      <div className="sim-seg" role="group" aria-label="Replay mode">
        {replayModes.map(m => <button key={m.id} aria-pressed={replayMode === m.id} onClick={() => setReplayMode(m.id as Exclude<ReplayMode, "live">)}>{m.label}</button>)}
      </div>
    </div>
    <div className="sim-scrub">
      <span className="sim-time">{t < 0 ? `−${fmt(-t, 2)}` : `+${fmt(t, 2)}`} s</span>
      <div className="sim-scrub-track">
        <span className="sim-mark" style={{ left: pct(0) }} title="Release" />
        <span className="sim-mark is-contact" style={{ left: pct(tc) }} title="Contact plane" />
        <input type="range" min={sim.start} max={sim.end} step={0.005} value={t} aria-label="Scrub simulation time"
          onChange={e => { clockRef.current = seek({ ...clockRef.current, playing: false }, Number(e.target.value)); }} />
      </div>
    </div>
  </div>;
}

function PitchMap({ sim }: { sim: Simulation }) {
  // Top-down view of the batter's half: x across (off side right), z from 13 m out to the stumps.
  const W = 120, H = 220, sx = W / 3.2, sz = H / 14;
  const X = (x: number) => W / 2 + x * sx, Z = (z: number) => (z + 13.2) * sz;
  const p = sim.delivery.pitch.p, a = sim.delivery.analysis;
  const bands = sim.delivery.type.style === "pace" ? [0, 2, 5, 8, 10.6, 13] : [0, 1.8, 3.6, 5.7, 7.6, 13];
  const shades = ["#2f4f3a", "#3c6347", "#4b7556", "#3c6347", "#2f4f3a"];
  return <svg viewBox={`0 0 ${W} ${H}`} className="sim-pitchmap" role="img" aria-label={`Pitch map: pitched ${fmt(a.pitchDistance, 1)} metres from the stumps`}>
    {bands.slice(0, -1).map((d, i) => <rect key={d} x={X(-PITCH.width / 2)} width={PITCH.width * sx} y={Z(-bands[i + 1])} height={(bands[i + 1] - d) * sz} fill={shades[i]} />)}
    <line x1={X(-1.83)} x2={X(1.83)} y1={Z(-PITCH.poppingCrease)} y2={Z(-PITCH.poppingCrease)} stroke="#f5f2e9" strokeWidth="1" />
    <rect x={X(-PITCH.stumpHalfWidth)} width={PITCH.stumpHalfWidth * 2 * sx} y={Z(0) - 2} height="4" fill="#c9b781" />
    <circle cx={X(p.x)} cy={Z(p.z)} r="5" fill="#ff5a3c" stroke="#fff" strokeWidth="1.2" />
    <line x1={X(p.x)} y1={Z(p.z)} x2={X(a.xAtStumps)} y2={Z(0)} stroke="#ff5a3c" strokeDasharray="3 2" strokeWidth="1.2" />
    <text x="4" y="10" className="sim-svg-label">OFF →</text>
  </svg>;
}

function WagonWheel({ sim }: { sim: Simulation }) {
  const R = 60, scale = R / (BOUNDARY_RADIUS + 4);
  const hit = sim.batting.hit;
  // Rotate so the bowler is at the top: azimuth 0 = up, off side to the right.
  const P = (x: number, z: number) => [R + (x - GROUND_CENTER.x) * scale, R + (z - GROUND_CENTER.z) * scale] as const;
  const [bx, by] = P(0, -1.2);
  const path = hit ? hit.samples.filter((_, i) => i % 6 === 0).map(s => P(s.p.x, s.p.z)) : [];
  const runs = sim.outcome.runs ?? 0;
  return <svg viewBox={`0 0 ${R * 2} ${R * 2}`} className="sim-wagon" role="img" aria-label={hit ? `Wagon wheel: ball travelled toward ${sim.outcome.region ?? "the batter's feet"}` : "Wagon wheel: no shot in play"}>
    <circle cx={R} cy={R} r={R - 1} fill="#2f5a3a" stroke="#f5f2e9" strokeWidth="1" />
    <circle cx={R} cy={R} r={27.4 * scale} fill="none" stroke="#f5f2e955" strokeDasharray="2 3" />
    <rect x={R - 1.5} y={P(0, -20.12)[1]} width="3" height={20.12 * scale} fill="#c9b781" />
    {path.length > 1 && <polyline points={path.map(([x, y]) => `${x},${y}`).join(" ")} fill="none" stroke={runs >= 6 ? "#ffd166" : runs >= 4 ? "#ff8a5c" : "#f5f2e9"} strokeWidth="2" />}
    <circle cx={bx} cy={by} r="2.5" fill="#fff" />
    <text x={R} y="10" textAnchor="middle" className="sim-svg-label">BOWLER</text>
  </svg>;
}

function Meter({ label, value }: { label: string; value: number }) {
  return <div className="sim-meter"><span>{label}</span><div><i style={{ width: `${Math.round(value * 100)}%` }} /></div><b>{Math.round(value * 100)}</b></div>;
}

export default function BattingSimulator() {
  const [delivery, setDelivery] = useState<DeliveryInput>(defaultDelivery);
  const [shotId, setShotId] = useState<ShotId>("cover-drive");
  const [control, setControl] = useState<BattingControl>(defaultControl);
  const [camera, setCamera] = useState<CameraId>("broadcast");
  const [rate, setRateState] = useState(1);
  const [mode, setMode] = useState<ReplayMode>("live");
  const [replayMode, setReplayMode] = useState<Exclude<ReplayMode, "live">>("same-angle");
  const [webgl, setWebgl] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const sim = useMemo(() => simulate(delivery, shotId, control), [delivery, shotId, control]);
  const clock = useRef<Clock>(createClock(sim.start, sim.end));
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => setWebgl(hasWebGL()));
    return () => cancelAnimationFrame(id);
  }, []);
  // A new plan resets to the stance, keeping the chosen playback speed.
  useEffect(() => { clock.current = { ...createClock(sim.start, sim.end), rate: clock.current.rate }; }, [sim]);

  const setRate = useCallback((r: number) => { setRateState(r); clock.current = { ...clock.current, rate: r }; }, []);
  const bowl = useCallback(() => { setMode("live"); clock.current = { ...createClock(sim.start, sim.end), rate: clock.current.rate, playing: true }; }, [sim]);
  const replay = useCallback(() => { setMode(replayMode); clock.current = rewind(clock.current, Math.max(sim.start, -1.2)); }, [replayMode, sim]);
  const reset = useCallback(() => { setMode("live"); clock.current = { ...createClock(sim.start, sim.end), rate: clock.current.rate }; }, [sim]);
  const onFailure = useCallback(() => setFailed(true), []);
  const onReady = useCallback(() => setReady(true), []);
  useEffect(() => {
    if (!webgl || ready || failed) return;
    const timer = setTimeout(() => setFailed(true), 60000);
    return () => clearTimeout(timer);
  }, [webgl, ready, failed]);
  useEffect(() => {
    if (webgl && !failed) return;
    let id = 0, previous = 0;
    const advance = (now: number) => {
      if (previous) clock.current = tick(clock.current, (now - previous) / 1000);
      previous = now;
      id = requestAnimationFrame(advance);
    };
    id = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(id);
  }, [webgl, failed]);
  useEffect(() => {
    const pause = () => { if (document.hidden) clock.current = { ...clock.current, playing: false }; };
    document.addEventListener("visibilitychange", pause);
    return () => document.removeEventListener("visibilitychange", pause);
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag && ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag)) return;
      if (e.key === " ") { e.preventDefault(); clock.current = { ...clock.current, playing: !clock.current.playing }; }
      else if (e.key === "b" || e.key === "B") bowl();
      else if (e.key === "r" || e.key === "R") replay();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [bowl, replay]);

  const type = deliveryType(delivery.type);
  const update = (patch: Partial<DeliveryInput>) => { setMode("live"); setDelivery(d => ({ ...d, ...patch })); };
  const updateControl = (patch: Partial<BattingControl>) => { setMode("live"); setControl(c => ({ ...c, ...patch })); };
  const a = sim.delivery.analysis, b = sim.batting, shot = shotById(shotId);
  const show3d = webgl && !failed;

  return <div className="sim">
    <section className="sim-stage" aria-label="Simulation viewport">
      <div className="sim-viewport" ref={viewport}>
        {show3d ? <SceneBoundary onFailure={onFailure}><Suspense fallback={<div className="sim-loading">Loading stadium…</div>}>
          <SimulatorScene sim={sim} clock={clock} camera={camera} mode={mode} onFailure={onFailure} onReady={onReady} />
        </Suspense></SceneBoundary> : <div className="sim-fallback">
          <p>{webgl === null ? "Checking graphics support…" : "3D view unavailable (WebGL is disabled, failed to load, or was interrupted). The analysis panels below still reflect the full simulation."}</p>
          <div className="sim-fallback-maps"><PitchMap sim={sim} /><WagonWheel sim={sim} /></div>
        </div>}
        {show3d && !ready && <div className="sim-loading">Loading athlete and stadium...</div>}
        {webgl !== null && <Overlay sim={sim} clock={clock} mode={mode} camera={camera} />}
      </div>
      <Transport sim={sim} clock={clock} rate={rate} setRate={setRate} onBowl={bowl} onReplay={replay} onReset={reset} replayMode={replayMode} setReplayMode={setReplayMode} />
      <div className="sim-cameras" role="group" aria-label="Camera">
        {cameras.map(c => <button key={c.id} aria-pressed={camera === c.id} title={c.hint} onClick={() => setCamera(c.id)}>{c.label}</button>)}
        <span className="sim-hint">Keys: B bowl · Space play/pause · R replay</span>
      </div>
      <div className="sim-analysis">
        <article className="sim-card">
          <h3>Delivery</h3>
          <div className="sim-card-split">
            <PitchMap sim={sim} />
            <dl className="sim-stats">
              <div><dt>Release</dt><dd>{fmt(a.releaseKph)} km/h</dd></div>
              <div><dt>At the bat</dt><dd>{fmt(a.atBatKph)} km/h</dd></div>
              <div><dt>Pitched</dt><dd>{fmt(a.pitchDistance, 1)} m · {lengthLabel(a.length, type.style)}</dd></div>
              <div><dt>Line at stumps</dt><dd>{lineLabel(a.lineAtStumps)}</dd></div>
              <div><dt>Swing / drift</dt><dd>{fmt(a.swingCm)} cm</dd></div>
              <div><dt>Off the pitch</dt><dd>{fmt(a.deviationCm)} cm</dd></div>
              <div><dt>Height at stumps</dt><dd>{fmt(a.heightAtStumps * 100)} cm</dd></div>
              <div><dt>Hitting the stumps?</dt><dd>{a.wouldHitStumps ? "Yes" : "No"}</dd></div>
            </dl>
          </div>
        </article>
        <article className="sim-card">
          <h3>Shot · {shot.name}</h3>
          <div className="sim-card-split">
            <WagonWheel sim={sim} />
            <div className="sim-shot-read">
              <p className="sim-kind">{kindLabel[b.kind]} <span>quality {Math.round(b.quality * 100)}%</span></p>
              <Meter label="Length" value={b.suitability.length} />
              <Meter label="Line" value={b.suitability.line} />
              <Meter label="Height" value={b.suitability.height} />
              <Meter label="Timing" value={b.suitability.timing} />
              <p className="sim-footwork">{b.footwork === "front" ? "Front-foot" : b.footwork === "back" ? "Back-foot" : "Kneeling"} response · contact {fmt(b.tc * 1000)} ms after release</p>
            </div>
          </div>
          <p className="sim-cue">{shot.cue}</p>
          {b.notes.length > 0 && <ul className="sim-notes">{b.notes.map(n => <li key={n}>{n}</li>)}</ul>}
        </article>
        <article className="sim-card">
          <h3>Movement phases</h3>
          <ol className="sim-phases">{b.phases.map(p => <li key={p.id}><b>{p.label}</b><span>{p.start < -1 ? "stance" : `${fmt(p.start * 1000)}–${fmt(p.end * 1000)} ms`}</span><p>{p.note}</p></li>)}</ol>
        </article>
      </div>
    </section>

    <aside className="sim-panel" aria-label="Simulator controls">
      <fieldset className="sim-group">
        <legend>Delivery</legend>
        <label className="sim-field"><span>Type</span>
          <select value={delivery.type} onChange={e => { const next = deliveryType(e.target.value as DeliveryInput["type"]); update({ type: next.id, speedKph: next.speed[2] }); }}>
            {deliveryTypes.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </label>
        <p className="sim-help">{type.summary}</p>
        <label className="sim-field"><span>Speed <b>{delivery.speedKph} km/h</b></span>
          <input type="range" min={type.speed[0]} max={type.speed[1]} step={1} value={delivery.speedKph} onChange={e => update({ speedKph: Number(e.target.value) })} />
        </label>
        <div className="sim-field"><span>Length</span>
          <div className="sim-chips" role="radiogroup" aria-label="Length">{lengths.map(l => <button key={l.id} role="radio" aria-checked={delivery.length === l.id} onClick={() => update({ length: l.id })}>{type.style === "spin" && l.spinLabel ? l.spinLabel : l.label}</button>)}</div>
        </div>
        <div className="sim-field"><span>Line</span>
          <div className="sim-chips" role="radiogroup" aria-label="Line">{lines.map(l => <button key={l.id} role="radio" aria-checked={delivery.line === l.id} onClick={() => update({ line: l.id })}>{l.label}</button>)}</div>
        </div>
        <label className="sim-field"><span>Movement <b>{Math.round(delivery.movement * 100)}%</b></span>
          <input type="range" min={0} max={1} step={0.05} value={delivery.movement} onChange={e => update({ movement: Number(e.target.value) })} />
        </label>
        <div className="sim-field"><span>Surface</span>
          <div className="sim-chips" role="radiogroup" aria-label="Surface">{pitches.map(p => <button key={p.id} role="radio" aria-checked={delivery.pitch === p.id} onClick={() => update({ pitch: p.id })}>{p.label}</button>)}</div>
        </div>
      </fieldset>

      <fieldset className="sim-group">
        <legend>Shot</legend>
        {shotGroups.map(group => <div className="sim-shot-group" key={group}>
          <span>{group}</span>
          <div className="sim-shots">{shots.filter(s => s.group === group).map(s => <button key={s.id} aria-pressed={shotId === s.id} onClick={() => { setMode("live"); setShotId(s.id); }}>{s.name}</button>)}</div>
        </div>)}
      </fieldset>

      <fieldset className="sim-group">
        <legend>Execution</legend>
        <label className="sim-field"><span>Timing <b>{control.timing === 0 ? "on time" : control.timing < 0 ? `early ${Math.round(-control.timing * 100)}%` : `late ${Math.round(control.timing * 100)}%`}</b></span>
          <input type="range" min={-1} max={1} step={0.05} value={control.timing} onChange={e => updateControl({ timing: Number(e.target.value) })} />
        </label>
        <label className="sim-field"><span>Bat face <b>{control.face === 0 ? "square" : control.face < 0 ? `closed ${Math.round(-control.face * 100)}%` : `open ${Math.round(control.face * 100)}%`}</b></span>
          <input type="range" min={-1} max={1} step={0.05} value={control.face} onChange={e => updateControl({ face: Number(e.target.value) })} />
        </label>
        <button className="sim-btn sim-btn-ghost" onClick={() => updateControl(defaultControl)}>Perfect execution</button>
      </fieldset>
      <p className="sim-disclaimer">The batter is an original, fictional athlete on a generic CC0 rig — not a likeness of any real player. Motion is procedural (keyframed poses solved with inverse kinematics), not motion capture; ball flight uses a simplified drag, swing, bounce and bat-impact model. Fielders, LBW and run-scoring are not simulated; run values are estimates.</p>
    </aside>
  </div>;
}
