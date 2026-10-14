import type { LengthId } from "./delivery";

export type ShotId =
  | "straight-drive" | "cover-drive" | "square-drive" | "on-drive" | "flick" | "leg-glance"
  | "pull" | "hook" | "cut" | "late-cut" | "lofted-drive" | "lofted-cover" | "lofted-straight"
  | "sweep" | "paddle-scoop" | "forward-defence" | "back-defence" | "leave";
export type Footwork = "front" | "back" | "kneel" | "adaptive";
export type BatPlane = "vertical" | "horizontal" | "deflect" | "defensive" | "leave";
export type FollowStyle = "high" | "wrap" | "low" | "check" | "hold" | "lift";

export type ShotDef = {
  id: ShotId; name: string; group: string; footwork: Footwork; plane: BatPlane;
  /** Intended direction: 0° straight back, +90° square on the off side, -90° square on the leg side. */
  azimuth: number; loft: number;
  /** Bat-face speed at impact (m/s) and effective restitution. */
  batSpeed: number; restitution: number; retention: number;
  /** z of the contact plane (striker's popping crease is z = -1.22). */
  contactZ: number;
  /** Handle-to-toe direction hint at impact for cross-bat and deflection shots. */
  batDir?: [number, number, number];
  ideal: { lengths: LengthId[]; x: [number, number]; height: [number, number] };
  /** Pelvis opening toward the bowler at contact (rad) and forward torso flexion. */
  hipOpen: number; torsoPitch: number; torsoRoll: number;
  follow: FollowStyle;
  cue: string;
};

export const shotGroups = ["Drives", "Leg side", "Back foot", "Lofted", "Sweep & improvised", "Defence & leave"] as const;

export const shots: ShotDef[] = [
  { id: "straight-drive", name: "Straight drive", group: "Drives", footwork: "front", plane: "vertical", azimuth: 0, loft: 3, batSpeed: 20, restitution: 0.5, retention: 0.8, contactZ: -2.2, ideal: { lengths: ["full"], x: [-0.12, 0.2], height: [0.05, 0.75] }, hipOpen: 0.42, torsoPitch: 0.5, torsoRoll: 0.06, follow: "high", cue: "Head leads to the line, front foot beside the pitch of the ball, full face presented back past the bowler." },
  { id: "cover-drive", name: "Cover drive", group: "Drives", footwork: "front", plane: "vertical", azimuth: 52, loft: 3, batSpeed: 21, restitution: 0.5, retention: 0.8, contactZ: -2.15, ideal: { lengths: ["full", "good"], x: [0.08, 0.55], height: [0.05, 0.8] }, hipOpen: 0.2, torsoPitch: 0.52, torsoRoll: 0.12, follow: "high", cue: "Stride toward the line outside off, knee over the ball, high front elbow and a full face toward cover." },
  { id: "square-drive", name: "Square drive", group: "Drives", footwork: "front", plane: "vertical", azimuth: 84, loft: 4, batSpeed: 21, restitution: 0.5, retention: 0.8, contactZ: -2.0, ideal: { lengths: ["full", "good"], x: [0.3, 0.8], height: [0.1, 0.9] }, hipOpen: 0.12, torsoPitch: 0.48, torsoRoll: 0.2, follow: "high", cue: "Reach wider outside off, let the ball come level with the front pad and drive square of the wicket." },
  { id: "on-drive", name: "On drive", group: "Drives", footwork: "front", plane: "vertical", azimuth: -22, loft: 3, batSpeed: 19, restitution: 0.5, retention: 0.8, contactZ: -2.2, ideal: { lengths: ["full"], x: [-0.28, 0.06], height: [0.05, 0.7] }, hipOpen: 0.62, torsoPitch: 0.5, torsoRoll: 0.02, follow: "high", cue: "Short, precise stride; front shoulder opens slightly and the bat comes through straight toward mid-on." },
  { id: "flick", name: "Flick off the pads", group: "Leg side", footwork: "front", plane: "vertical", azimuth: -72, loft: 5, batSpeed: 17, restitution: 0.48, retention: 0.8, contactZ: -2.05, ideal: { lengths: ["full", "good"], x: [-0.4, 0.02], height: [0.1, 0.9] }, hipOpen: 0.8, torsoPitch: 0.42, torsoRoll: -0.04, follow: "low", cue: "Play late in front of the front pad with a straight bat, then roll the wrists to turn the face toward mid-wicket." },
  { id: "leg-glance", name: "Leg glance", group: "Leg side", footwork: "front", plane: "deflect", azimuth: -150, loft: 2, batSpeed: 3, restitution: 0.45, retention: 0.86, contactZ: -1.65, batDir: [0.05, -1, 0.1], ideal: { lengths: ["good", "full", "short"], x: [-0.5, -0.04], height: [0.2, 1.05] }, hipOpen: 0.55, torsoPitch: 0.35, torsoRoll: 0, follow: "check", cue: "Get inside the line, keep the head over the ball and angle the face to deflect it fine using the bowler's pace." },
  { id: "pull", name: "Pull", group: "Back foot", footwork: "back", plane: "horizontal", azimuth: -96, loft: 7, batSpeed: 24, restitution: 0.5, retention: 0.78, contactZ: -1.5, batDir: [0.3, -0.12, -1], ideal: { lengths: ["short", "bouncer"], x: [-0.32, 0.42], height: [0.7, 1.45] }, hipOpen: 1.35, torsoPitch: 0.12, torsoRoll: -0.1, follow: "wrap", cue: "Back and across early, chest opens to the bowler, arms extend and the bat rolls over the ball toward mid-wicket." },
  { id: "hook", name: "Hook", group: "Back foot", footwork: "back", plane: "horizontal", azimuth: -138, loft: 22, batSpeed: 22, restitution: 0.5, retention: 0.78, contactZ: -1.35, batDir: [0.25, 0.2, -1], ideal: { lengths: ["bouncer"], x: [-0.45, 0.3], height: [1.25, 2.0] }, hipOpen: 1.45, torsoPitch: 0.02, torsoRoll: -0.18, follow: "wrap", cue: "Head inside the line of a ball rising at shoulder height; rotate hard and keep the swing above the ball's path." },
  { id: "cut", name: "Square cut", group: "Back foot", footwork: "back", plane: "horizontal", azimuth: 96, loft: 2, batSpeed: 22, restitution: 0.5, retention: 0.78, contactZ: -1.2, batDir: [0.2, -0.55, -0.8], ideal: { lengths: ["short", "good"], x: [0.32, 0.95], height: [0.35, 1.2] }, hipOpen: 0.1, torsoPitch: 0.3, torsoRoll: 0.32, follow: "low", cue: "Back and across to width, front shoulder stays down and the bat comes from high to hit down through point." },
  { id: "late-cut", name: "Late cut", group: "Back foot", footwork: "back", plane: "deflect", azimuth: 142, loft: -2, batSpeed: 7, restitution: 0.45, retention: 0.86, contactZ: -0.65, batDir: [0.15, -0.85, 0.45], ideal: { lengths: ["short", "good"], x: [0.3, 0.85], height: [0.3, 1.0] }, hipOpen: 0.0, torsoPitch: 0.38, torsoRoll: 0.36, follow: "check", cue: "Let the ball pass almost level with the stumps and open the face with soft hands to guide it past slip." },
  { id: "lofted-drive", name: "Lofted drive (long-on)", group: "Lofted", footwork: "front", plane: "vertical", azimuth: -14, loft: 31, batSpeed: 27, restitution: 0.5, retention: 0.8, contactZ: -2.3, ideal: { lengths: ["full"], x: [-0.25, 0.18], height: [0.05, 0.85] }, hipOpen: 0.58, torsoPitch: 0.36, torsoRoll: 0, follow: "high", cue: "Get to the pitch, stay still at impact and extend the arms through the line with a full, high finish." },
  { id: "lofted-cover", name: "Lofted cover drive", group: "Lofted", footwork: "front", plane: "vertical", azimuth: 46, loft: 27, batSpeed: 26, restitution: 0.5, retention: 0.8, contactZ: -2.25, ideal: { lengths: ["full"], x: [0.08, 0.6], height: [0.05, 0.85] }, hipOpen: 0.25, torsoPitch: 0.38, torsoRoll: 0.08, follow: "high", cue: "Make room to the line outside off, open the face slightly and lift it over the inner ring." },
  { id: "lofted-straight", name: "Lofted straight drive", group: "Lofted", footwork: "front", plane: "vertical", azimuth: 2, loft: 35, batSpeed: 28, restitution: 0.5, retention: 0.8, contactZ: -2.3, ideal: { lengths: ["full"], x: [-0.15, 0.2], height: [0.05, 0.8] }, hipOpen: 0.45, torsoPitch: 0.34, torsoRoll: 0, follow: "high", cue: "Head over the ball, a still base and a straight bat swung through the line over the bowler's head." },
  { id: "sweep", name: "Sweep", group: "Sweep & improvised", footwork: "kneel", plane: "horizontal", azimuth: -102, loft: 5, batSpeed: 18, restitution: 0.48, retention: 0.8, contactZ: -2.35, batDir: [0.35, -0.25, -1], ideal: { lengths: ["full", "good"], x: [-0.2, 0.55], height: [0.04, 0.7] }, hipOpen: 0.45, torsoPitch: 0.7, torsoRoll: -0.06, follow: "wrap", cue: "Long stride to the pitch, back knee down, head over the front knee, sweep the bat horizontally and roll it over." },
  { id: "paddle-scoop", name: "Paddle / scoop", group: "Sweep & improvised", footwork: "kneel", plane: "deflect", azimuth: -166, loft: 30, batSpeed: 5, restitution: 0.45, retention: 0.86, contactZ: -2.1, batDir: [-0.2, -0.75, -0.6], ideal: { lengths: ["full", "yorker", "good"], x: [-0.3, 0.3], height: [0.04, 0.85] }, hipOpen: 0.85, torsoPitch: 0.6, torsoRoll: -0.08, follow: "check", cue: "Get low and early, present an angled face and use the bowler's pace to lift it fine over the keeper's shoulder." },
  { id: "forward-defence", name: "Forward defence", group: "Defence & leave", footwork: "front", plane: "defensive", azimuth: 0, loft: -12, batSpeed: 1.2, restitution: 0.2, retention: 0.5, contactZ: -2.12, ideal: { lengths: ["full", "good", "yorker"], x: [-0.25, 0.32], height: [0.04, 0.85] }, hipOpen: 0.3, torsoPitch: 0.55, torsoRoll: 0.06, follow: "hold", cue: "Head and front knee over the ball, bat angled down beside the pad, soft hands let it die in front." },
  { id: "back-defence", name: "Back-foot defence", group: "Defence & leave", footwork: "back", plane: "defensive", azimuth: 6, loft: -12, batSpeed: 0.8, restitution: 0.2, retention: 0.5, contactZ: -0.9, ideal: { lengths: ["good", "short", "bouncer"], x: [-0.25, 0.32], height: [0.3, 1.45] }, hipOpen: 0.35, torsoPitch: 0.2, torsoRoll: 0.04, follow: "hold", cue: "Back and across, rise with the bounce, high top hand and loose bottom hand to play it down under the eyes." },
  { id: "leave", name: "Leave", group: "Defence & leave", footwork: "adaptive", plane: "leave", azimuth: 0, loft: 0, batSpeed: 0, restitution: 0, retention: 0, contactZ: -1.0, ideal: { lengths: ["yorker", "full", "good", "short", "bouncer"], x: [0.25, 2], height: [0, 3] }, hipOpen: 0.08, torsoPitch: 0.25, torsoRoll: 0, follow: "lift", cue: "Judge line and bounce, take a measured step and lift the hands high so the bat stays well out of the ball's path." }
];

export const shotById = (id: ShotId) => shots.find(shot => shot.id === id) ?? shots[0];
