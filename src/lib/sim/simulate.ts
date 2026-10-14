import { planBatting, type BattingControl, type BattingPlan } from "./batting";
import { planBowler, type BowlerPlan } from "./bowler";
import { planDelivery, type DeliveryInput, type DeliveryPlan } from "./delivery";
import { PITCH, azimuthOf, integrateHit, sampleAt, type BallSample, type HitFlight } from "./physics";
import type { ShotId } from "./shots";
import { distance, vec } from "./vec";

export type Outcome = { headline: string; runs: number | null; detail: string; region: string | null; carry: number | null; bowled: boolean };
export type Simulation = {
  delivery: DeliveryPlan; batting: BattingPlan; bowler: BowlerPlan;
  /** After contact (or the ball passing the batter): hit flight, carry to keeper, or stop at the stumps. */
  after: HitFlight; bowled: boolean;
  start: number; end: number; outcome: Outcome;
};

export function simulate(input: DeliveryInput, shot: ShotId, control: BattingControl): Simulation {
  const delivery = planDelivery(input);
  const batting = planBatting(delivery, shot, control);
  const bowler = planBowler(delivery.type);
  const contact = batting.kind !== "missed" && batting.kind !== "left";
  const bowled = !contact && delivery.analysis.wouldHitStumps;
  let after: HitFlight;
  if (batting.hit) after = batting.hit;
  else {
    const last = delivery.samples[delivery.samples.length - 1];
    if (bowled) {
      const atStumps = delivery.samples.find(s => s.p.z >= -0.05) ?? last;
      after = { samples: [{ ...atStumps, t: 0, v: vec(atStumps.v.x * 0.2, 0.6, -2) }, { t: 0.35, p: vec(atStumps.p.x, 0.04, atStumps.p.z - 0.5), v: vec() }], firstBounce: null, boundary: null, rest: vec(atStumps.p.x, 0.04, atStumps.p.z - 0.5), maxHeight: atStumps.p.y, duration: 0.35 };
    } else {
      const raw = integrateHit(last.p, last.v, 2.5);
      const keeper = raw.samples.findIndex(s => s.p.z > 14);
      const samples = keeper > 0 ? raw.samples.slice(0, keeper + 1) : raw.samples;
      after = { ...raw, samples, boundary: null, rest: samples[samples.length - 1].p, duration: samples[samples.length - 1].t };
    }
  }
  const handoff = batting.hit ? batting.tc : bowled ? (delivery.samples.find(s => s.p.z >= -0.05) ?? delivery.samples[delivery.samples.length - 1]).t : delivery.samples[delivery.samples.length - 1].t;
  const start = bowler.start;
  const end = Math.max(batting.tc + 2.8, handoff + Math.min(after.duration, 5.5) + 0.6);
  return { delivery, batting, bowler, after, bowled, start, end, outcome: describe(batting, after, bowled, delivery) };
}

/** When the ball leaves the delivery path: bat contact, hitting the stumps, or passing the batter. */
export function handoffTime(sim: Pick<Simulation, "delivery" | "batting" | "bowled">): number {
  const d = sim.delivery.samples;
  return sim.batting.hit ? sim.batting.tc : sim.bowled ? (d.find(s => s.p.z >= -0.05) ?? d[d.length - 1]).t : d[d.length - 1].t;
}

/** Ball position over the whole clip; before release it is carried by the bowler (see bowlingHand). */
export function ballAt(sim: Simulation, t: number): BallSample & { phase: "hand" | "delivery" | "after" } {
  const d = sim.delivery.samples;
  const handoff = handoffTime(sim);
  if (t < 0) return { ...d[0], t, phase: "hand" };
  if (t <= handoff) return { ...sampleAt(d, t), phase: "delivery" };
  const s = sampleAt(sim.after.samples, t - handoff);
  return { ...s, t, phase: "after" };
}

export const contactTime = (sim: Simulation) => sim.batting.tc;

export function regionFor(azimuth: number): string {
  const a = Math.abs(azimuth), off = azimuth >= 0;
  if (a < 12) return "straight down the ground";
  const bands: [number, string, string][] = [
    [38, "mid-off", "mid-on"], [68, "cover", "mid-wicket"], [100, "point", "square leg"],
    [128, "backward point", "backward square leg"], [158, off ? "third man" : "fine leg", "fine leg"], [181, "very fine, behind the keeper", "very fine, behind the keeper"]
  ];
  const band = bands.find(([limit]) => a < limit)!;
  return off ? band[1] : band[2];
}

function describe(b: BattingPlan, after: HitFlight, bowled: boolean, delivery: DeliveryPlan): Outcome {
  if (bowled) return { headline: b.kind === "left" ? "Bowled — left a straight one" : "Bowled", runs: 0, detail: b.kind === "left" ? "The ball was going on to hit the stumps; leaving it was a misjudgement of line." : "Beaten by the movement; the ball hit the stumps.", region: null, carry: null, bowled: true };
  if (b.kind === "left") return { headline: "Well left", runs: 0, detail: delivery.analysis.heightAtStumps > PITCH.stumpHeight + 0.05 ? "Ball passed over the stumps." : "Ball passed outside the line of the stumps.", region: null, carry: null, bowled: false };
  if (b.kind === "missed") return { headline: "Played and missed", runs: 0, detail: "No bat contact. LBW is not adjudicated in this simulator.", region: null, carry: null, bowled: false };
  const out = b.outgoing!;
  const travelled = Math.round(distance(after.samples[0].p, after.rest));
  const region = travelled < 4 ? null : regionFor(azimuthOf(out));
  const carry = after.firstBounce ? Math.round(distance(after.samples[0].p, after.firstBounce.p)) : null;
  let runs: number;
  if (after.boundary) runs = after.boundary.aerial ? 6 : 4;
  else runs = travelled < 15 ? 0 : travelled < 32 ? 1 : travelled < 48 ? 2 : 3;
  const headlines: Record<string, string> = {
    middled: after.boundary ? (after.boundary.aerial ? "SIX" : "FOUR") : "Middled", mistimed: "Mistimed", defended: "Solid defence",
    "edge-outside": "Outside edge", "edge-inside": "Inside edge", "top-edge": "Top edge"
  };
  const aerialRisk = after.maxHeight > 1.6 && carry !== null && carry > 12 && !after.boundary?.aerial ? " Airborne — catchable if a fielder is there." : "";
  return {
    headline: after.boundary && b.kind === "mistimed" ? (after.boundary.aerial ? "SIX (mistimed)" : "FOUR (mistimed)") : headlines[b.kind],
    runs, region, carry,
    detail: `${region ? `${travelled} m toward ${region}` : "Dropped dead at the batter's feet"}${carry && region ? `, carry ${carry} m` : ""}. Exit ${Math.round(Math.hypot(out.x, out.y, out.z) * 3.6)} km/h.${aerialRisk} Runs are an estimate; fielders are not simulated.`,
    bowled: false
  };
}
