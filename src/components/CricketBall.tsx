"use client";
import { useId } from "react";

export default function CricketBall() {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const leather = `${id}-leather`, sheen = `${id}-sheen`, grain = `${id}-grain`, clip = `${id}-clip`;
  return <svg className="real-cricket-ball" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id={leather} cx="30%" cy="24%" r="79%"><stop stopColor="#d75637" /><stop offset=".3" stopColor="#af291e" /><stop offset=".67" stopColor="#771710" /><stop offset="1" stopColor="#2b0908" /></radialGradient>
      <radialGradient id={sheen} cx="29%" cy="20%" r="68%"><stop stopColor="#ffe3be" stopOpacity=".28" /><stop offset=".45" stopColor="#ef7f51" stopOpacity=".03" /><stop offset="1" stopColor="#170604" stopOpacity=".34" /></radialGradient>
      <filter id={grain}><feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="3" seed="17" result="noise" /><feColorMatrix in="noise" type="saturate" values="0" /><feComponentTransfer><feFuncA type="linear" slope=".13" /></feComponentTransfer><feBlend in="SourceGraphic" mode="soft-light" /></filter>
      <clipPath id={clip}><circle cx="100" cy="100" r="97" /></clipPath>
    </defs>
    <g clipPath={`url(#${clip})`}>
      <circle cx="100" cy="100" r="97" fill={`url(#${leather})`} filter={`url(#${grain})`} />
      <g fill="none" transform="rotate(24 100 100)">
        <path d="M83 1C17 51 17 149 83 199" stroke="#360908" strokeWidth="19" opacity=".85" />
        <path d="M83 1C17 51 17 149 83 199" stroke="#c56343" strokeWidth="14" opacity=".65" />
        <path d="M83 1C17 51 17 149 83 199" stroke="#6c160f" strokeWidth="6" />
        <path d="M83 1C17 51 17 149 83 199" stroke="#e18b60" strokeWidth="1.1" opacity=".7" />
        {[-12, -8, -4, 4, 8, 12].map((offset, index) => <g key={offset} transform={`translate(${offset} 0)`} className="cricket-stitch-row">
          <path d="M83 1C17 51 17 149 83 199" stroke="#3a160c" strokeWidth="2.7" strokeDasharray="2.5 5.4" strokeDashoffset={index % 2 ? 2 : 0} strokeLinecap="round" />
          <path d="M82 0C16 50 16 148 82 198" stroke={index % 2 ? "#ddc89a" : "#f0dfb4"} strokeWidth="1.6" strokeDasharray="2.5 5.4" strokeDashoffset={index % 2 ? 2 : 0} strokeLinecap="round" />
        </g>)}
      </g>
      <path d="M147 16C168 60 170 128 145 175" stroke="#ee8c5b" strokeOpacity=".11" fill="none" strokeWidth=".8" />
      <circle cx="100" cy="100" r="97" fill={`url(#${sheen})`} />
    </g>
    <circle cx="100" cy="100" r="96.5" fill="none" stroke="#e08860" strokeOpacity=".25" />
  </svg>;
}
