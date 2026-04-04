"use client";

import { useEffect, useMemo, useState } from "react";

type ThemeMode = "default" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "ui.theme.mode";

function resolveTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "light" || mode === "dark") return mode;
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const resolved = resolveTheme(mode);

  root.dataset.theme = resolved;
  root.classList.toggle("dark", resolved === "dark");
}

export default function ThemeSwitcher() {
  const [mode, setMode] = useState<ThemeMode>("default");

  const options = useMemo(
    () => [
      { value: "default", label: "Default" },
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ] as const,
    [],
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial: ThemeMode = stored === "light" || stored === "dark" || stored === "default" ? stored : "default";
    setMode(initial);
    applyTheme(initial);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (mode === "default") applyTheme("default");
    };

    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode]);

  const onModeChange = (nextMode: ThemeMode) => {
    setMode(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
    applyTheme(nextMode);
  };

  return (
    <div className="flex items-center">
      <select
        aria-label="Theme mode"
        value={mode}
        onChange={(event) => onModeChange(event.target.value as ThemeMode)}
        className="rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-slate-300 outline-none cursor-pointer transition-colors appearance-none"
        style={{ backgroundImage: "none" }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-slate-900 text-slate-200">
            {option.label === "Default" ? "🌗 Auto" : option.label === "Light" ? "☀️ Light" : "🌙 Dark"}
          </option>
        ))}
      </select>
    </div>
  );
}
