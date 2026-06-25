"use client";

import { useEffect, useState } from "react";

const messages = [
  "Loading your world…",
  "Brewing connections ☕",
  "Finding your vibe…",
  "Almost there 🫖",
  "Welcome to MITS-Mate!",
];

export default function LoadingScreen() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % messages.length);
        setFade(true);
      }, 300);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className=" fixed inset-0 z-50  items-center justify-center bg-[#0e0b1f]">

      {/* Floating orbs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-violet-600 opacity-20 blur-[80px] animate-pulse" />
      <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-pink-600 opacity-20 blur-[80px] animate-pulse delay-700" />
      <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-amber-500 opacity-15 blur-[80px] animate-pulse delay-1000" />

      {/* Floating particles */}
      <Particles />

      {/* Main content */}
      <div className="relative flex flex-col items-center gap-9">

        {/* Spinning ring + logo */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Conic gradient spinning ring */}
          <div
            className="absolute inset-0 rounded-full animate-spin"
            style={{
              background: "conic-gradient(from 0deg, #7c3aed, #ec4899, #f59e0b, #7c3aed)",
              padding: "2.5px",
            }}
          >
            <div className="w-full h-full rounded-full bg-[#0e0b1f]" />
          </div>

          {/* Inner circle */}
          <div className="relative z-10 w-[88px] h-[88px] rounded-full bg-gradient-to-br from-[#1e1a3f] to-[#2d1f5e] flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.4)] animate-pulse">
            <span className="text-4xl animate-bounce">☕</span>
          </div>
        </div>

        {/* Brand name */}
        <div className="text-center">
          <div className="flex items-baseline justify-center">
            <span
              className="text-4xl font-extrabold tracking-tight"
              style={{
                background: "linear-gradient(90deg,#a78bfa,#ec4899,#fb923c)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              MITS
            </span>
            <span className="text-4xl font-extrabold tracking-tight text-white">
              -Mate
            </span>
          </div>
          <p className="text-white/40 text-sm tracking-widest mt-1">
            vibe · connect · belong
          </p>
        </div>

        {/* Bouncing dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full animate-bounce"
              style={{
                background: ["#a78bfa", "#ec4899", "#fb923c"][i],
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        {/* Progress bar */}
        <div className="w-40 h-[3px] rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full animate-[progressFill_2.5s_ease-in-out_infinite]"
            style={{
              background: "linear-gradient(90deg,#7c3aed,#ec4899,#f59e0b)",
            }}
          />
        </div>

        {/* Cycling status text */}
        <p
          className="text-xs tracking-[2px] uppercase transition-opacity duration-300"
          style={{ color: "rgba(255,255,255,0.4)", opacity: fade ? 1 : 0 }}
        >
          {messages[msgIndex]}
        </p>
      </div>
    </div>
  );
}

function Particles() {
  const colors = ["#a78bfa", "#ec4899", "#fb923c", "#38bdf8", "#34d399"];
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 18 }).map((_, i) => (
        <span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full animate-[floatUp_4s_ease-in_infinite]"
          style={{
            left: `${Math.random() * 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${Math.random() * 4}s`,
            animationDuration: `${3 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
}