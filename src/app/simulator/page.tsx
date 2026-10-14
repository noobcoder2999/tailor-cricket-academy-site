import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import BattingSimulator from "../../components/simulator/BattingSimulator";
import "./simulator.css";

export const metadata: Metadata = {
  title: "Batting lab — interactive batting simulator",
  description: "Choose a delivery and a stroke, then watch a fictional academy batter respond in a broadcast-style 3D simulation with replays and multiple camera angles."
};

export default function SimulatorPage() {
  return <><Header /><main id="main-content" className="sim-page">
    <header className="sim-intro">
      <p className="eyebrow">BATTING LAB · INTERACTIVE SIMULATOR</p>
      <h1>Read the ball.<br /><em>Choose the stroke.</em></h1>
      <p>Set the bowler&apos;s type, pace, line and length, pick one of eighteen strokes, then bowl. The batter reacts to where the ball actually is — tracking, trigger, footwork, weight transfer, rotation, swing and follow-through — and the bat&apos;s angle at impact decides where the ball goes.</p>
    </header>
    <BattingSimulator />
  </main><Footer /></>;
}
