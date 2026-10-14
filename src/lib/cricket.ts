export type Role = "batsman" | "bowler";
export type Point = { x: number; y: number; z: number };
export type Technique = {
  id: string; name: string; role: Role; zone: string; cue: string; arrow: string;
  end: Point; lift: number; duration: number; swing: number; turn: number; bounceX: number;
};
export const fieldLabels = [
  { name: "Fine leg", x: 22, z: 40 }, { name: "Square leg", x: 39, z: 21 },
  { name: "Mid-wicket", x: 29, z: -1 }, { name: "Mid-on", x: 14, z: -20 },
  { name: "Long-on", x: 18, z: -42 }, { name: "Straight", x: 0, z: -49 },
  { name: "Long-off", x: -20, z: -42 }, { name: "Mid-off", x: -13, z: -20 },
  { name: "Extra cover", x: -29, z: -27 }, { name: "Cover", x: -37, z: -11 },
  { name: "Point", x: -40, z: 17 }, { name: "Third man", x: -25, z: 39 }
];
export const shots: Technique[] = [
  { id: "cover-drive", name: "Cover Drive", role: "batsman", zone: "Cover", cue: "A full face. A balanced stride. Through the off-side gap.", arrow: "↖", end: { x: -38, y: 0.3, z: -15 }, lift: 0.8, duration: 4800, swing: 0, turn: 0, bounceX: 0 },
  { id: "straight-drive", name: "Straight Drive", role: "batsman", zone: "Straight", cue: "Present the full face and send it back past the bowler.", arrow: "↑", end: { x: 1, y: 0.3, z: -47 }, lift: 0.5, duration: 4600, swing: 0, turn: 0, bounceX: 0 },
  { id: "pull", name: "Pull Shot", role: "batsman", zone: "Mid-wicket", cue: "Rock back, rotate and take the short ball to the leg side.", arrow: "→", end: { x: 41, y: 0.3, z: 9 }, lift: 5, duration: 4600, swing: 0, turn: 0, bounceX: 0 },
  { id: "hook", name: "Hook Shot", role: "batsman", zone: "Fine leg", cue: "Ride the bounce, sending the ball behind square on the leg side.", arrow: "↘", end: { x: 30, y: 0.3, z: 38 }, lift: 13, duration: 4900, swing: 0, turn: 0, bounceX: 0 },
  { id: "square-cut", name: "Square Cut", role: "batsman", zone: "Point", cue: "Create room and cut square through the off side.", arrow: "←", end: { x: -43, y: 0.3, z: 21 }, lift: 1.2, duration: 4600, swing: 0, turn: 0, bounceX: 0 },
  { id: "sweep", name: "Sweep Shot", role: "batsman", zone: "Square leg", cue: "Get low and sweep the ball behind square on the leg side.", arrow: "↘", end: { x: 39, y: 0.3, z: 29 }, lift: 1, duration: 4800, swing: 0, turn: 0, bounceX: 0 },
  { id: "flick", name: "Flick Shot", role: "batsman", zone: "Mid-wicket", cue: "Soft hands and a turn of the wrists through mid-wicket.", arrow: "↗", end: { x: 37, y: 0.3, z: -3 }, lift: 1.5, duration: 4700, swing: 0, turn: 0, bounceX: 0 },
  { id: "lofted-drive", name: "Lofted Drive", role: "batsman", zone: "Long-off", cue: "Extend through the line, lifting the ball toward long-off.", arrow: "↖", end: { x: -24, y: 0.3, z: -42 }, lift: 19, duration: 5100, swing: 0, turn: 0, bounceX: 0 }
];
export const deliveries: Technique[] = [
  { id: "fast", name: "Fast Bowler", role: "bowler", zone: "Pace channel", cue: "A direct, quicker delivery. Pace without lateral movement.", arrow: "↓", end: { x: 0, y: 1.5, z: 21 }, lift: 1.3, duration: 3900, swing: 0, turn: 0, bounceX: 0 },
  { id: "swing", name: "Swing Bowler", role: "bowler", zone: "In-flight swing", cue: "An outswing illustration: movement through the air before pitching.", arrow: "⤵", end: { x: -4, y: 1.4, z: 21 }, lift: 1.5, duration: 4900, swing: -5, turn: 0, bounceX: -4 },
  { id: "seam", name: "Seam Bowler", role: "bowler", zone: "Seam deviation", cue: "A straight approach, with a small deviation off the seam after bounce.", arrow: "↙", end: { x: -2, y: 1.6, z: 21 }, lift: 1.6, duration: 4600, swing: 0, turn: -2, bounceX: 0 },
  { id: "off-spin", name: "Off Spinner", role: "bowler", zone: "Off to leg", cue: "Right-arm off spin: from off toward leg after pitching.", arrow: "↘", end: { x: 4, y: 1.9, z: 21 }, lift: 2.8, duration: 5300, swing: 0, turn: 7, bounceX: -3 },
  { id: "leg-spin", name: "Leg Spinner", role: "bowler", zone: "Leg to off", cue: "Right-arm leg spin: from leg toward off after pitching.", arrow: "↙", end: { x: -5, y: 2.2, z: 21 }, lift: 3.5, duration: 5600, swing: 0, turn: -8, bounceX: 3 },
  { id: "left-arm", name: "Left-Arm Spinner", role: "bowler", zone: "Left-arm orthodox", cue: "Left-arm orthodox, not wrist spin: turns away from the right-handed striker.", arrow: "↙", end: { x: -5.5, y: 1.7, z: 21 }, lift: 2.5, duration: 5400, swing: 0, turn: -6, bounceX: 0.5 }
];
export const techniques = [...shots, ...deliveries];
export const clamp = (n: number) => Math.min(1, Math.max(0, n));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => { const p = clamp(t); return p * p * (3 - 2 * p); };
export function cameraPose(technique: Technique | null, progress: number, aspect = 1.6) {
  const overhead: Point = { x: 0, y: aspect < 1 ? 154 : 115, z: 26 };
  if (!technique) return { position: overhead, target: { x: 0, y: 0, z: 0 }, phase: "overhead" };
  const descend = smooth(progress / 0.16);
  const eye: Point = { x: -0.45, y: 3.7, z: 24 };
  const eyeTarget: Point = { x: 0, y: 2.4, z: -19 };
  const position = { x: mix(overhead.x, eye.x, descend), y: mix(overhead.y, eye.y, descend), z: mix(overhead.z, eye.z, descend) };
  const target = { x: mix(0, eyeTarget.x, descend), y: mix(0, eyeTarget.y, descend), z: mix(0, eyeTarget.z, descend) };
  // Hold the striker's eye line through contact/release before tracking the ball.
  const follow = smooth((progress - (technique.role === "batsman" ? 0.39 : 0.63)) / 0.18);
  const ball = ballAt(technique, progress);
  return {
    position: { x: mix(position.x, ball.x * 0.86 + 5, follow), y: mix(position.y, Math.max(5, ball.y + 4), follow), z: mix(position.z, ball.z + 12, follow) },
    target: { x: mix(target.x, ball.x, follow), y: mix(target.y, ball.y, follow), z: mix(target.z, ball.z, follow) },
    phase: progress < 0.16 ? "descending" : follow > 0 ? "ball-follow" : "striker-eye"
  };
}

// x is off/leg (-/+), y is height, z increases toward the striker (screen bottom).
// Both renderers consume these instructional paths; this is not a physics solver.
export function ballAt(technique: Technique, progress: number): Point {
  const p = clamp(progress);
  if (technique.role === "batsman") {
    if (p < 0.28) {
      const t = clamp((p - 0.12) / 0.16);
      return { x: 0, y: 0.5 + Math.sin(Math.PI * t) * 2, z: mix(-18, 18, t) };
    }
    const t = clamp((p - 0.28) / 0.54);
    return { x: technique.end.x * t, y: 0.3 + Math.sin(Math.PI * t) * technique.lift, z: mix(18, technique.end.z, t) };
  }
  if (p < 0.28) return { x: technique.id === "left-arm" ? 1.4 : -1.4, y: 4, z: mix(-40, -18, clamp(p / 0.28)) };
  if (p <= 0.61) {
    const t = (p - 0.28) / 0.33;
    return { x: mix(0, technique.bounceX, t) + technique.swing * Math.sin(Math.PI * t), y: mix(4, 0.25, t) + Math.sin(Math.PI * t) * technique.lift, z: mix(-18, technique.id === "yorker" ? 18 : 7, t) };
  }
  const t = clamp((p - 0.61) / 0.21);
  return { x: technique.bounceX + technique.turn * t, y: mix(0.25, technique.end.y, t) + Math.sin(Math.PI * t) * (technique.id === "yorker" ? 0.1 : 1.1), z: mix(technique.id === "yorker" ? 18 : 7, 21, t) };
}
export function trajectoryPoints(technique: Technique, until = 0.82, count = 60): Point[] {
  const start = 0.28;
  return Array.from({ length: count + 1 }, (_, i) => ballAt(technique, start + (Math.max(start, until) - start) * i / count));
}
export type MatchFrame = {
  time: number; progress: number; technique: Technique; ball: Point; ballVisible: boolean;
  batter: number; bowler: number; bowlerZ: number; chase: number; phase: string;
};
export const matchLoopSeconds = 12;
export function previewMatch(role: Role, seconds: number): MatchFrame {
  const time = Math.max(0, seconds);
  const cycle = Math.floor(time / matchLoopSeconds);
  const p = time % matchLoopSeconds / matchLoopSeconds;
  const technique = role === "batsman" ? shots[[0, 2, 5, 7][cycle % 4]] : deliveries[[0, 1, 3, 4, 5, 2][cycle % 6]];
  const batter = role === "batsman" ? p < 0.5 ? clamp((p - 0.16) / 0.34) * 0.28 : 0.28 + clamp((p - 0.5) / 0.36) * 0.54 : 0.04 + Math.sin(p * Math.PI) * 0.015;
  const ball = role === "batsman" && p < 0.5
    ? ballAt(deliveries[0], p < 0.28 ? p : 0.28 + (p - 0.28) / 0.22 * 0.50)
    : ballAt(technique, role === "batsman" ? batter : p);
  return {
    time, progress: p, technique, ball, ballVisible: p < 0.94, batter, bowler: p,
    bowlerZ: -40 + clamp(p / 0.28) * 22 + smooth((p - 0.3) / 0.18) * 4,
    chase: role === "batsman" ? smooth((p - 0.53) / 0.3) : smooth((p - 0.66) / 0.22) * 0.3,
    phase: p < 0.22 ? "RUN-UP" : p < 0.3 ? "GATHER & RELEASE" : p < (role === "batsman" ? 0.5 : 0.61) ? "BALL IN FLIGHT" : p < 0.86 ? role === "batsman" ? "STROKE & FIELDING" : "BOUNCE & MOVEMENT" : "NEXT DELIVERY"
  };
}
export function selectedMatch(technique: Technique, progress: number): MatchFrame {
  const bowler = technique.role === "bowler" ? progress : clamp(progress / 0.12) * 0.28 + clamp((progress - 0.12) / 0.35) * 0.35;
  return {
    time: progress * (technique.duration + 2200) / 1000, progress, technique, ball: ballAt(technique, progress),
    ballVisible: true, batter: technique.role === "batsman" ? progress : 0.04, bowler,
    bowlerZ: -40 + clamp(bowler / 0.28) * 22 + smooth((bowler - 0.3) / 0.18) * 4,
    chase: technique.role === "batsman" ? smooth((progress - 0.34) / 0.35) : 0,
    phase: phaseLabel(technique, progress)
  };
}
export function broadcastCamera(seconds: number, aspect = 1.6) {
  const orbit = Math.sin(seconds * 0.16);
  return {
    position: { x: -13 + orbit * 3, y: aspect < 1 ? 7.4 : 6.5, z: 31 + Math.cos(seconds * 0.12) * 2 },
    target: { x: aspect < 1 ? 1 : 4.5, y: aspect < 1 ? 1.7 : 1.4, z: -3 },
    phase: "broadcast"
  };
}
export function fielderPosition(base: Point, frame: MatchFrame, index: number): Point {
  const dx = frame.ball.x - base.x, dz = frame.ball.z - base.z;
  const distance = Math.hypot(dx, dz) || 1;
  const travel = Math.min(7, distance * 0.24) * frame.chase;
  return {
    x: base.x + dx / distance * travel + Math.sin(frame.time * 1.8 + index) * 0.10,
    y: base.y,
    z: base.z + dz / distance * travel + Math.sin(frame.time * 1.5 + index * 0.7) * 0.10
  };
}
export function phaseLabel(technique: Technique, progress: number) {
  if (progress < 0.28) return technique.role === "batsman" ? "Set your stance" : "Run-up & gather";
  if (progress < 0.34) return technique.role === "batsman" ? "Bat meets ball" : "Release";
  if (progress < 0.61) return technique.role === "batsman" ? `Through ${technique.zone.toLowerCase()}` : "In flight";
  if (progress < 0.82) return technique.role === "batsman" ? "Follow the ball" : "Bounce & movement";
  return "Your next innings starts here";
}

export type IntroState = { stage: "role" | "select" | "playing" | "complete"; role: Role | null; technique: Technique | null };
export type IntroEvent = { type: "ROLE"; role: Role } | { type: "TECHNIQUE"; id: string; choices?: Technique[] } | { type: "BACK" | "SKIP" | "FINISH" | "REPLAY" };
export const initialIntro: IntroState = { stage: "role", role: null, technique: null };
export function introReducer(state: IntroState, event: IntroEvent): IntroState {
  if (event.type === "SKIP" || event.type === "FINISH") return { stage: "complete", role: null, technique: null };
  if (event.type === "REPLAY" || event.type === "BACK") return initialIntro;
  if (event.type === "ROLE" && state.stage === "role") return { stage: "select", role: event.role, technique: null };
  if (event.type === "TECHNIQUE" && state.stage === "select") {
    const technique = (event.choices ?? techniques).find(t => t.id === event.id && t.role === state.role);
    if (technique) return { ...state, stage: "playing", technique };
  }
  return state;
}

export function runTimeline(duration: number, frame: (progress: number) => void, done: () => void) {
  let id = 0;
  let cancelled = false;
  let start: number | undefined;
  const tick = (now: number) => {
    if (cancelled) return;
    start ??= now;
    const progress = clamp((now - start) / duration);
    frame(progress);
    if (progress < 1) id = requestAnimationFrame(tick);
    else done();
  };
  id = requestAnimationFrame(tick);
  return () => { cancelled = true; cancelAnimationFrame(id); };
}
