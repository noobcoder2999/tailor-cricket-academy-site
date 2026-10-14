export type ReplayMode = "live" | "same-angle" | "director" | "tracking";
export const playbackRates = [1, 0.5, 0.25, 0.1] as const;
export type PlaybackRate = (typeof playbackRates)[number];

export type Clock = { t: number; playing: boolean; rate: number; start: number; end: number };

export const createClock = (start: number, end: number): Clock => ({ t: start, playing: false, rate: 1, start, end });

/** Advances simulation time; real dt is capped so a background tab does not jump the action. */
export function tick(clock: Clock, realDt: number): Clock {
  if (!clock.playing) return clock;
  const t = clock.t + Math.min(realDt, 0.1) * clock.rate;
  return t >= clock.end ? { ...clock, t: clock.end, playing: false } : { ...clock, t };
}
export const seek = (clock: Clock, t: number): Clock => ({ ...clock, t: Math.min(clock.end, Math.max(clock.start, t)) });
export const rewind = (clock: Clock, from?: number): Clock => ({ ...clock, t: from ?? clock.start, playing: true });
export const progress = (clock: Clock) => (clock.t - clock.start) / (clock.end - clock.start);

export const replayModes: { id: ReplayMode; label: string }[] = [
  { id: "same-angle", label: "Same angle" },
  { id: "director", label: "Multi-angle" },
  { id: "tracking", label: "Ball tracking" }
];
