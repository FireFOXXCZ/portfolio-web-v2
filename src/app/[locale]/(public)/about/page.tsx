"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Globe,
  Gamepad2,
  Moon,
  School,
  Bug,
  Flame,
  Terminal,
  Server,
  Code2,
} from "lucide-react";

// ─── Scramble hook ────────────────────────────────────────────────────────────
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*<>/\\|[]{}";

function useScramble(text: string, active: boolean): string {
  const [output, setOutput] = useState("");
  const tickRef = useRef(0);
  const resolvedRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    tickRef.current = 0;
    resolvedRef.current = 0;

    if (!active) {
      setOutput("");
      return;
    }

    intervalRef.current = setInterval(() => {
      tickRef.current++;
      if (tickRef.current % 2 === 0 && resolvedRef.current < text.length) {
        resolvedRef.current++;
      }
      const result = text
        .split("")
        .map((char, i) => {
          if (char === " ") return " ";
          if (i < resolvedRef.current) return char;
          return SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
        })
        .join("");
      setOutput(result);
      if (resolvedRef.current >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setOutput(text);
      }
    }, 28);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, text]);

  return output;
}

// ─── FlipCard ─────────────────────────────────────────────────────────────────
function FlipCard({
  icon: Icon,
  back,
  index,
}: {
  icon: React.ElementType;
  back: string;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const visRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const scrambled = useScramble(back, open);

  useEffect(() => {
    const el = visRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin({ x, y });
    setOpen((o) => !o);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -8, y: px * 8 });
  }

  const num = String(index + 1).padStart(2, "0");

  return (
    <div
      ref={visRef}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(28px) scale(0.9)",
        transition: `opacity 0.55s ease ${index * 70}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${index * 70}ms`,
      }}
    >
      <div
        ref={cardRef}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        role="button"
        aria-pressed={open}
        className={`group relative h-[148px] cursor-pointer overflow-hidden rounded-xl border bg-white dark:bg-[#0b0b0b] [transform-style:preserve-3d] transition-colors duration-200 ${
          open
            ? "border-orange-500/55"
            : "border-neutral-200 dark:border-white/[0.07]"
        }`}
        style={{
          transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: "transform 0.14s ease-out, border-color 0.25s ease, box-shadow 0.3s ease",
          boxShadow: open
            ? "0 0 0 1px rgba(249,115,22,0.15), 0 8px 32px -8px rgba(249,115,22,0.18)"
            : "none",
        }}
      >
        {/* Ambient corner glow */}
        <div className="pointer-events-none absolute -right-4 -top-4 h-24 w-24 rounded-full bg-orange-500/0 blur-2xl transition-all duration-500 group-hover:bg-orange-500/[0.12]" />

        {/* Scanline texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, currentColor 2px, currentColor 3px)",
          }}
        />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] px-3 py-2">
          <span className="font-mono text-[10px] font-semibold tracking-wider text-neutral-600">
            fact<span className="text-orange-500/70">.{num}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-[5px] w-[5px] rounded-full bg-neutral-800" />
            <span className="h-[5px] w-[5px] rounded-full bg-neutral-800" />
            <span
              className="h-[5px] w-[5px] rounded-full transition-colors duration-300"
              style={{ backgroundColor: open ? "#f97316" : "rgb(38,38,38)" }}
            />
          </span>
        </div>

        {/* Body */}
        <div className="relative flex h-[calc(100%-33px)] items-center justify-center px-4">
          {/* Icon layer */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-2.5"
            style={{
              opacity: open ? 0 : 1,
              transform: open ? "scale(0.82) translateY(-4px)" : "scale(1) translateY(0)",
              transition: "opacity 0.2s ease, transform 0.22s ease",
            }}
          >
            <Icon
              size={27}
              strokeWidth={1.6}
              className="text-orange-500 transition-transform duration-300 group-hover:-translate-y-0.5 dark:text-orange-400"
            />
            <span className="inline-flex items-center gap-1 font-mono text-[9px] font-bold tracking-[0.28em] text-neutral-600">
              CLICK
              <span className="inline-block h-[10px] w-[1.5px] animate-pulse bg-orange-500/60" />
            </span>
          </div>

          {/* Text layer — iris reveal + scramble */}
          <div
            className="absolute inset-0 flex items-center justify-center bg-neutral-50 dark:bg-[#0f0f0f] px-4 py-3 text-center"
            style={{
              clipPath: open
                ? `circle(150% at ${origin.x}% ${origin.y}%)`
                : `circle(0% at ${origin.x}% ${origin.y}%)`,
              transition: "clip-path 0.52s cubic-bezier(0.22,1,0.36,1)",
            }}
          >
            {/* Subtle orange tint behind text */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/[0.07] to-transparent" />
            <p
              className="relative font-mono text-[11.5px] font-medium leading-relaxed text-neutral-800 dark:text-neutral-200"
              style={{
                opacity: open ? 1 : 0,
                transition: "opacity 0.2s ease 0.1s",
              }}
            >
              {scrambled}
            </p>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-300"
          style={{ width: open ? "100%" : "0%" }}
        />
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-orange-500/30 to-transparent transition-all duration-300 group-hover:w-full"
          style={{ width: open ? "0%" : undefined }}
        />
      </div>
    </div>
  );
}

// ─── TimelineItem ─────────────────────────────────────────────────────────────
function TimelineItem({
  year,
  title,
  desc,
  index,
  accent,
  isLast,
}: {
  year: string;
  title: string;
  desc: string;
  index: number;
  accent?: boolean;
  isLast?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="group flex gap-5"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-16px)",
        transition: `opacity 0.5s ease ${index * 90}ms, transform 0.5s cubic-bezier(0.22,1,0.36,1) ${index * 90}ms`,
      }}
    >
      <div className="flex flex-shrink-0 flex-col items-center">
        <div
          className={`relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-bold tracking-wide transition-all duration-300 ${
            accent
              ? "border-orange-500 bg-orange-500/10 text-orange-500 shadow-[0_0_18px_-4px_rgba(249,115,22,0.45)]"
              : "border-neutral-300 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-950 text-neutral-500 dark:text-neutral-600 group-hover:border-neutral-400 dark:group-hover:border-neutral-700"
          }`}
        >
          {accent && (
            <span className="absolute inset-0 animate-ping rounded-full bg-orange-500/15" />
          )}
          <span className="relative">{year.slice(2)}</span>
        </div>
        {!isLast && (
          <div className="my-1 w-px flex-1 bg-gradient-to-b from-neutral-300 dark:from-neutral-800 via-neutral-200 dark:via-neutral-900 to-transparent" />
        )}
      </div>
      <div className={isLast ? "pb-1 pt-1" : "pb-10 pt-1"}>
        <span
          className={`font-mono text-[10px] font-semibold tracking-widest ${
            accent ? "text-orange-500" : "text-neutral-500 dark:text-neutral-700"
          }`}
        >
          {year}
        </span>
        <div className="mb-1.5 mt-1 text-[15px] font-semibold text-neutral-900 dark:text-neutral-100">
          {title}
        </div>
        <div className="max-w-[440px] text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-500">
          {desc}
        </div>
      </div>
    </div>
  );
}

// ─── SectionLabel ─────────────────────────────────────────────────────────────
function SectionLabel({ text }: { text: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="font-mono text-[10px] font-semibold tracking-[0.2em] text-neutral-500 dark:text-neutral-700">
        {text}
      </span>
      <span className="h-px flex-1 bg-gradient-to-r from-neutral-300 dark:from-neutral-800 to-transparent" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AboutPage() {
  const t = useTranslations("about");
  const [letterVisible, setLetterVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLetterVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const heroLetters = "FireFOXX".split("");

  const funFacts = [
    { icon: Globe,     back: t("facts.f1") },
    { icon: Gamepad2,  back: t("facts.f2") },
    { icon: Moon,      back: t("facts.f3") },
    { icon: School,    back: t("facts.f4") },
    { icon: Bug,       back: t("facts.f5") },
    { icon: Flame,     back: t("facts.f6") },
    { icon: Terminal,  back: t("facts.f7") },
    { icon: Server,    back: t("facts.f8") },
    { icon: Code2,     back: t("facts.f9") },
  ];

  const timeline = [
    { year: "2004", title: t("timeline.t1.title"), desc: t("timeline.t1.desc") },
    { year: "2021", title: t("timeline.t2.title"), desc: t("timeline.t2.desc"), accent: true },
    { year: "2022", title: t("timeline.t3.title"), desc: t("timeline.t3.desc") },
    { year: "2024", title: t("timeline.t4.title"), desc: t("timeline.t4.desc") },
    { year: "2025", title: t("timeline.t5.title"), desc: t("timeline.t5.desc"), accent: true },
    { year: "2026", title: t("timeline.t6.title"), desc: t("timeline.t6.desc"), accent: true },
    { year: "2026", title: t("timeline.t7.title"), desc: t("timeline.t7.desc"), accent: true },
  ];

  return (
    <main className="relative min-h-screen bg-white dark:bg-[#070707] font-sans text-neutral-900 dark:text-neutral-100">
      {/* Dot-grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Top vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-64"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% -10%, rgba(249,115,22,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-2xl px-6 pb-28 pt-16">

        {/* ── HERO ── */}
        <section className="mb-24">
          {/* Status badge */}
          <div className="mb-9">
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 dark:border-violet-500/20 bg-violet-500/10 dark:bg-violet-500/[0.07] px-3.5 py-1.5 font-mono text-[11px] text-violet-700 dark:text-violet-300">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-500 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-violet-500" />
              </span>
              {t("status")}
            </span>
          </div>

          {/* Greeting */}
          <p className="mb-3 font-mono text-[11px] font-semibold tracking-[0.22em] text-neutral-500 dark:text-neutral-700">
            {t("greeting")}
          </p>

          {/* Name */}
          <div className="mb-8 flex flex-wrap gap-0.5">
            {heroLetters.map((l, i) => (
              <span
                key={i}
                className={`inline-block text-[clamp(52px,10.5vw,84px)] font-extrabold leading-[0.9] tracking-tight transition-all duration-500 ${
                  i >= 4
                    ? "bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 bg-clip-text text-transparent"
                    : "text-neutral-900 dark:text-neutral-50"
                }`}
                style={{
                  opacity: letterVisible ? 1 : 0,
                  transform: letterVisible
                    ? "translateY(0) rotate(0deg) scale(1)"
                    : `translateY(44px) rotate(${(i % 2 === 0 ? 1 : -1) * 9}deg) scale(0.82)`,
                  transitionDelay: `${i * 52}ms`,
                  transitionTimingFunction: "cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                {l}
              </span>
            ))}
          </div>

          {/* Bio */}
          <p className="mb-9 max-w-[520px] text-[16px] leading-[1.75] text-neutral-600 dark:text-neutral-400">
            {t("bio")}
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-9">
            {[
              { num: "20", label: t("stats.age") },
              { num: "4+", label: t("stats.years") },
              { num: "∞",  label: t("stats.passion") },
            ].map((s) => (
              <div key={s.label} className="group">
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 bg-clip-text text-[26px] font-bold leading-none text-transparent transition-transform duration-200 group-hover:scale-105">
                  {s.num}
                </div>
                <div className="mt-1.5 font-mono text-[10px] tracking-wider text-neutral-500 dark:text-neutral-700">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── FUN FACTS ── */}
        <section className="mb-24">
          <SectionLabel text={t("factsLabel")} />
          <p className="-mt-2 mb-6 text-[13px] text-neutral-600 dark:text-neutral-500">
            {t("factsHint")}
          </p>
          <div className="grid grid-cols-3 gap-2.5">
            {funFacts.map((f, i) => (
              <FlipCard key={i} icon={f.icon} back={f.back} index={i} />
            ))}
          </div>
        </section>

        {/* ── TIMELINE ── */}
        <section className="mb-24">
          <SectionLabel text={t("timelineLabel")} />
          <p className="-mt-2 mb-9 text-[13px] text-neutral-700 dark:text-neutral-600">
            {t("timelineHint")}
          </p>
          {timeline.map((item, i) => (
            <TimelineItem
              key={i}
              {...item}
              index={i}
              isLast={i === timeline.length - 1}
            />
          ))}
        </section>

      </div>
    </main>
  );
}