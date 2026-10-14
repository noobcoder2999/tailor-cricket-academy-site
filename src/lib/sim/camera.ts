import { add, clamp, lerpVec, normalize, sub, vec, type Vec3, length } from "./vec";

export type CameraId = "broadcast" | "behind" | "bowler-end" | "wicket" | "close-up" | "ball-follow";
export type CameraShot = { position: Vec3; target: Vec3; fov: number };
export type CameraContext = { ball: Vec3; ballVelocity: Vec3; batter: Vec3; hitInPlay: boolean };

export const cameras: { id: CameraId; label: string; hint: string }[] = [
  { id: "broadcast", label: "Broadcast", hint: "Long lens from high behind the bowler" },
  { id: "behind", label: "Behind batter", hint: "Low view down the pitch from behind the striker" },
  { id: "bowler-end", label: "Bowler end", hint: "Over the non-striker's stumps" },
  { id: "wicket", label: "Stump cam", hint: "Fixed in the striker's middle stump" },
  { id: "close-up", label: "Close-up", hint: "Face-on technique view from the off side" },
  { id: "ball-follow", label: "Ball follow", hint: "Tracks the ball, then the hit" }
];

/** Static framing for each camera; ball-follow adapts to the current ball state. */
export function cameraShot(id: CameraId, ctx: CameraContext): CameraShot {
  switch (id) {
    case "broadcast": {
      const follow = ctx.hitInPlay ? clamp(length(sub(ctx.ball, vec(0, 0, -1))) / 60) : 0;
      return { position: vec(1.2, 8.5 + follow * 14, -58 + follow * 8), target: lerpVec(vec(0, 0.8, -4), vec(ctx.ball.x, 0.5, ctx.ball.z), follow * 0.85), fov: 13 + follow * 22 };
    }
    case "behind": return { position: vec(-0.45, 1.85, 6.2), target: vec(0.05, 1.0, -18), fov: 38 };
    case "bowler-end": return { position: vec(-1.1, 2.3, -24.5), target: vec(0, 0.85, -0.6), fov: 30 };
    case "wicket": return { position: vec(0, 0.42, 0.22), target: vec(0, 1.25, -20), fov: 58 };
    case "close-up": return { position: vec(5.2, 1.35, -1.25), target: vec(-0.3, 0.95, -1.25), fov: 34 };
    case "ball-follow": {
      if (ctx.hitInPlay) {
        const dir = normalize(vec(ctx.ballVelocity.x, 0, ctx.ballVelocity.z));
        const position = add(ctx.ball, vec(-dir.x * 9 + 1.5, 3.2 + Math.max(0, ctx.ball.y * 0.4), -dir.z * 9));
        return { position: vec(position.x, Math.max(1.2, position.y), position.z), target: ctx.ball, fov: 42 };
      }
      return { position: vec(ctx.ball.x * 0.5 + 1.6, Math.max(1.4, ctx.ball.y + 0.7), ctx.ball.z - 4.6), target: add(ctx.ball, vec(0, 0, 2)), fov: 40 };
    }
  }
}

/** Frame-rate independent exponential damping toward a target framing. */
export function dampShot(current: CameraShot, target: CameraShot, dt: number, lambda = 4.5): CameraShot {
  const k = 1 - Math.exp(-lambda * Math.max(0, dt));
  return { position: lerpVec(current.position, target.position, k), target: lerpVec(current.target, target.target, k), fov: current.fov + (target.fov - current.fov) * k };
}

/** Multi-angle replay director: picks angles by phase, like a broadcast replay package. */
export function directorCamera(t: number, contactTime: number, hit: boolean): CameraId {
  if (t < -0.1) return "bowler-end";
  if (t < contactTime + 0.35) return "close-up";
  if (hit && t < contactTime + 2.6) return "ball-follow";
  return "broadcast";
}
