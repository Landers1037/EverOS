"use client";
import { useState, useEffect, useRef } from "react";
import { useDesktopStore } from "@/stores/useDesktopStore";
import { Sunrise, SunMedium, Sun } from "lucide-react";

const ICONS = [Sunrise, SunMedium, Sun] as const;
const ICON_DURATION_MS = 1000;
const FULL_CYCLE_MS = ICON_DURATION_MS * ICONS.length;

export function BootScreen() {
  const { completeBoot } = useDesktopStore();
  const [phase, setPhase] = useState<"logo" | "loading" | "fade">("logo");
  const [displayText, setDisplayText] = useState("");
  const [iconIdx, setIconIdx] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const fullText = "For EverOS";
  const mountedAt = useRef(Date.now());

  // Typing animation
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setPhase("loading");
      }
    }, 120);
    return () => clearInterval(interval);
  }, []);

  // Icon cycling animation — starts only after typing completes
  useEffect(() => {
    if (phase !== "loading") return;
    const interval = setInterval(() => {
      setIconIdx((prev) => (prev + 1) % ICONS.length);
      setAnimKey((prev) => prev + 1);
    }, ICON_DURATION_MS);
    return () => clearInterval(interval);
  }, [phase]);

  // Loading phase: wait for at least one full animation cycle
  useEffect(() => {
    if (phase !== "loading") return;
    const elapsed = Date.now() - mountedAt.current;
    const remaining = Math.max(0, FULL_CYCLE_MS - elapsed);

    const timer = setTimeout(() => {
      setPhase("fade");
      setTimeout(() => completeBoot(), 400);
    }, remaining + 1000);

    return () => clearTimeout(timer);
  }, [phase, completeBoot]);

  const IconComponent = ICONS[iconIdx];
  const textColor = "var(--text-primary)";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundColor: "var(--bg-base)",
        opacity: phase === "fade" ? 0 : 1,
        transition: "opacity 0.4s ease",
      }}
    >
      <div className="text-center flex flex-col items-center">
        {/* Icon + EverOS in a row */}
        <div className="flex items-center gap-4">
          {/* Animated icon — hidden until typing completes */}
          {phase !== "logo" && (
            <div className="h-16 w-16 flex items-center justify-center overflow-hidden">
              <div key={animKey} className="animate-rise-up">
                <IconComponent size={48} strokeWidth={1.5} color={textColor} />
              </div>
            </div>
          )}

          {/* EverOS text */}
          <h1
            className="text-6xl font-bold tracking-tight font-mono"
            style={{
              color: "var(--text-primary)",
              overflow: "hidden",
              whiteSpace: "nowrap",
              borderRight:
                phase === "loading"
                  ? "2px solid transparent"
                  : `2px solid var(--text-primary)`,
              animation: phase === "logo" ? "blink 0.8s step-end infinite" : "none",
              width: phase === "loading" ? "100%" : undefined,
            }}
          >
            {displayText}
          </h1>
        </div>

        {phase === "loading" && (
          <p
            className="mt-4 text-sm animate-pulse"
            style={{
              color: "var(--text-secondary)",
            }}
          >
            Loading system<span className="animate-pulse">...</span>
          </p>
        )}
      </div>
    </div>
  );
}