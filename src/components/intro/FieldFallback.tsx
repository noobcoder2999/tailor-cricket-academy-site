"use client";
import { ballAt, fieldLabels, trajectoryPoints, type Technique } from "../../lib/cricket";

export default function FieldFallback({ technique, progress, role }: { technique: Technique | null; progress: number; role: "batsman" | "bowler" }) {
  const point = technique ? ballAt(technique, progress) : { x: 0, y: 0, z: -19 };
  const project = (x: number, z: number) => `${250 + x * 4},${265 + z * 4}`;
  const trail = technique ? trajectoryPoints(technique, progress).map(p => project(p.x, p.z)).join(" ") : "";
  const guide = technique ? trajectoryPoints(technique).map(p => project(p.x, p.z)).join(" ") : "";
  const bowlerZ = role === "bowler" ? -40 + Math.min(progress / 0.28, 1) * 22 : -20;
  const batAngle = progress < 0.22 ? -35 : progress < 0.32 ? 60 : -70;
  return <svg viewBox="0 0 500 535" className="field-svg" role="img" aria-label={`Right-handed cricket field. Off side left, leg side right.${technique ? ` ${technique.name}: ${technique.zone}.` : ""}`}>
    <defs>
      <radialGradient id="grass"><stop stopColor="#47724e" /><stop offset="1" stopColor="#173f2d" /></radialGradient>
      <pattern id="stripes" width="500" height="55" patternUnits="userSpaceOnUse"><rect width="500" height="27.5" fill="#83a66b" opacity=".065" /></pattern>
      <radialGradient id="ball"><stop offset="0" stopColor="#e47760" /><stop offset=".6" stopColor="#ad372f" /><stop offset="1" stopColor="#651b1e" /></radialGradient>
      <clipPath id="field-clip"><ellipse cx="250" cy="265" rx="223" ry="250" /></clipPath>
    </defs>
    <ellipse cx="250" cy="265" rx="237" ry="261" fill="#102c24" />
    <ellipse cx="250" cy="265" rx="224" ry="250" fill="url(#grass)" stroke="#d7d9ad" strokeWidth="1.5" />
    <rect width="500" height="535" fill="url(#stripes)" clipPath="url(#field-clip)" />
    <ellipse cx="250" cy="265" rx="117" ry="135" fill="none" stroke="#cbd4b1" strokeDasharray="3 7" opacity=".5" />
    <rect x="230" y="185" width="40" height="168" rx="3" fill="#b4a579" />
    <rect x="238" y="190" width="24" height="157" fill="#c5b38c" />
    <path d="M222 199h56M222 333h56M230 188v25M270 188v25M230 320v25M270 320v25" stroke="#f0ede2" strokeWidth="2" />
    <text x="250" y="150" textAnchor="middle" className="field-caption">BOWLER&apos;S END</text>
    <text x="250" y="380" textAnchor="middle" className="field-caption">RIGHT-HANDED STRIKER</text>
    <text x="101" y="272" textAnchor="middle" className="side-label">OFF SIDE</text><text x="401" y="272" textAnchor="middle" className="side-label">LEG SIDE</text>
    {technique?.role === "batsman" && <path d={`M250 337 L${project(technique.end.x - 7, technique.end.z)} L${project(technique.end.x + 7, technique.end.z)} Z`} fill="#e1c68a" opacity=".16" />}
    {guide && <polyline points={guide} stroke="#f1d99a" opacity=".3" strokeWidth="2" strokeDasharray="5 5" fill="none" />}
    {trail && <polyline data-testid="ball-trail" points={trail} stroke="#e9cc85" strokeWidth="2.5" strokeLinecap="round" fill="none" />}
    {fieldLabels.map(label => <g key={label.name}><rect x={250 + label.x * 4 - (label.name.length * 3.5 + 6)} y={265 + label.z * 4 - 10} width={label.name.length * 7 + 12} height="21" rx="10" fill={technique?.zone === label.name ? "#ddc790" : "#102e25"} opacity=".94" /><text x={250 + label.x * 4} y={265 + label.z * 4 + 4} textAnchor="middle" fill={technique?.zone === label.name ? "#102e25" : "#f1eddf"} fontSize="12" fontFamily="Arial, sans-serif">{label.name}</text></g>)}
    <g transform={`translate(249,${265 + bowlerZ * 4})`}><ellipse rx="6" ry="9" fill="#eae4d3" /><circle cy="-8" r="4" fill="#b78d6f" /><path d={`M-4 -2l${progress > 0.23 && progress < 0.34 ? "-10 -12" : "-6 8"}M4 -2l7 7`} stroke="#eae4d3" strokeWidth="3" /><path d="M-3 8l-2 8M3 8l3 8" stroke="#ddd7c8" strokeWidth="4" /></g>
    <g transform={`translate(260,337) ${technique?.id === "sweep" && progress > 0.2 ? "scale(1 .65)" : ""}`}><ellipse rx="7" ry="10" fill="#eee8d7" /><circle cy="-6" r="6" fill="#132e24" /><path d="M-3 7l-3 9M3 7l3 9" stroke="#e9e2cf" strokeWidth="4" /><g transform={`rotate(${technique?.role === "batsman" ? batAngle : -35})`}><path d="M-5 1l-8 14" stroke="#d6bd88" strokeWidth="5" /></g></g>
    <path d="M246 349v-8M250 349v-8M254 349v-8M245 341h10M246 192v-8M250 192v-8M254 192v-8" stroke="#eee2bd" strokeWidth="1.8" />
    {technique && <><ellipse cx={250 + point.x * 4} cy={265 + point.z * 4} rx={4 + point.y * 0.13} ry="2.5" fill="#081d16" opacity=".6" /><circle data-testid="svg-ball" data-x={point.x.toFixed(2)} data-z={point.z.toFixed(2)} cx={250 + point.x * 4} cy={265 + point.z * 4 - point.y * 1.5} r={5 + point.y * 0.08} fill="url(#ball)" stroke="#e6b59a" strokeWidth=".5" /></>}
  </svg>;
}
