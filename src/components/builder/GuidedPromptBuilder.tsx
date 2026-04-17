import { useState, useEffect } from "react";

export type BrandStylePreset = "dark-bold" | "clean-minimal" | "bright-energetic" | "soft-calm" | "custom";

export interface BrandStyle {
  preset: BrandStylePreset;
  customPrimary?: string;
  customAccent?: string;
}

export const BRAND_STYLE_CONFIGS: Record<Exclude<BrandStylePreset, "custom">, { primary: string; accent: string; background: string; cardBackground: string; text: string; textMuted: string }> = {
  "dark-bold": { primary: "#C9A84C", accent: "#f5c542", background: "#0a0a0a", cardBackground: "#111111", text: "#ffffff", textMuted: "#9ca3af" },
  "clean-minimal": { primary: "#111111", accent: "#555555", background: "#ffffff", cardBackground: "#f5f5f5", text: "#111111", textMuted: "#6b7280" },
  "bright-energetic": { primary: "#ef4444", accent: "#f97316", background: "#0f0f0f", cardBackground: "#1a1a1a", text: "#ffffff", textMuted: "#9ca3af" },
  "soft-calm": { primary: "#7c9885", accent: "#b8c9b8", background: "#0e1210", cardBackground: "#151a17", text: "#e8efe8", textMuted: "#8a9b8f" },
};

interface GuidedPromptBuilderProps {
  onPromptChange: (prompt: string) => void;
  onGenerate: (prompt: string, brandStyle?: BrandStyle) => void;
  isGenerating?: boolean;
  onUploadClick?: () => void;
  hasAttachment?: boolean;
}

const AUDIENCE_OPTIONS = [
  "Beginners", "Busy professionals", "Women who lift",
  "Men over 40", "Weight loss clients", "Athletes",
  "Busy moms", "Powerlifters", "Bodybuilders",
];

const GOAL_OPTIONS = [
  { label: "Lose 10-15lbs", value: "lose 10-15lbs of body fat" },
  { label: "Gain muscle", value: "gain 8-12lbs of lean muscle" },
  { label: "Get stronger", value: "add 50lbs to their main lifts" },
  { label: "Fix nutrition", value: "improve nutrition and eating habits" },
  { label: "Build a habit", value: "build a consistent training habit" },
  { label: "Competition prep", value: "get stage-ready for competition" },
  { label: "Home fitness", value: "get fit at home with no equipment" },
  { label: "Injury recovery", value: "recover from injury and rebuild strength" },
];

const DURATION_OPTIONS = ["4-week", "6-week", "8-week", "12-week", "90-day", "Self-paced"];

const STYLE_OPTIONS: { key: BrandStylePreset; label: string; desc: string; swatches: [string, string] }[] = [
  { key: "dark-bold", label: "Dark & Bold", desc: "Dark background, gold accents", swatches: ["#0a0a0a", "#C9A84C"] },
  { key: "clean-minimal", label: "Clean & Minimal", desc: "White background, simple", swatches: ["#ffffff", "#111111"] },
  { key: "bright-energetic", label: "Bright & Energetic", desc: "Vibrant colors, bold fonts", swatches: ["#0f0f0f", "#ef4444"] },
  { key: "soft-calm", label: "Soft & Calm", desc: "Muted tones, pastel accents", swatches: ["#0e1210", "#7c9885"] },
];

function joinList(items: string[]): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(", ") + " and " + items[items.length - 1];
}

function buildPrompt(audiences: string[], goals: string[], duration: string): string {
  if (audiences.length === 0) return "";
  const audienceStr = joinList(audiences);
  const goalStr = joinList(goals);
  let p = `Create a`;
  if (duration) p += ` ${duration}`;
  p += ` fitness course for ${audienceStr}`;
  if (goalStr) p += ` with the goal of: ${goalStr}`;
  p += `.`;
  if (audiences.length > 0 && goals.length > 0 && duration) {
    p += ` Deliver a complete course outline, full module structure, detailed lesson plans, and coaching notes per module.`;
  }
  return p;
}

function toggleItem<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] w-full px-3 py-2 rounded-lg text-sm border transition-all touch-manipulation ${
        selected
          ? "bg-primary/20 border-primary text-primary font-medium"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground active:bg-muted/40"
      }`}
    >
      {label}
    </button>
  );
}

function StepLabel({ number, text, active }: { number: number; text: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span
        className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-colors ${
          active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {number}
      </span>
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{text}</span>
    </div>
  );
}

export function GuidedPromptBuilder({ onPromptChange, onGenerate, isGenerating = false, onUploadClick, hasAttachment = false }: GuidedPromptBuilderProps) {
  const [audiences, setAudiences] = useState<string[]>([]);
  const [customAudience, setCustomAudience] = useState("");
  const [goals, setGoals] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [skipped, setSkipped] = useState(false);
  const [materialChoice, setMaterialChoice] = useState<"upload" | "skip" | null>(null);
  const [brandPreset, setBrandPreset] = useState<BrandStylePreset | null>(null);
  const [customPrimary, setCustomPrimary] = useState("#C9A84C");
  const [customAccent, setCustomAccent] = useState("#f5c542");
  const [manualPrompt, setManualPrompt] = useState("");

  const effectiveAudiences = customAudience.trim() ? [customAudience.trim()] : audiences;
  const prompt = buildPrompt(effectiveAudiences, goals, duration);

  useEffect(() => {
    if (hasAttachment && materialChoice !== "upload") {
      setMaterialChoice("upload");
    }
  }, [hasAttachment]);

  useEffect(() => {
    if (!skipped) {
      setManualPrompt(prompt);
      onPromptChange(prompt);
    }
  }, [audiences, customAudience, goals, duration, skipped]);

  function getBrandStyle(): BrandStyle | undefined {
    if (!brandPreset) return undefined;
    if (brandPreset === "custom") return { preset: "custom", customPrimary, customAccent };
    return { preset: brandPreset };
  }

  function handleGenerate() {
    const final = manualPrompt.trim();
    if (final) onGenerate(final, getBrandStyle());
  }

  if (skipped) {
    return (
      <div className="flex flex-col gap-3">
        <textarea
          value={manualPrompt}
          onChange={(e) => { setManualPrompt(e.target.value); onPromptChange(e.target.value); }}
          rows={4}
          placeholder="Describe your course idea in detail..."
          className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 text-base sm:text-sm resize-none focus:outline-none focus:border-primary/60"
        />
        <div className="sticky bottom-0 z-10 -mx-4 px-4 py-3 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-border/40 flex items-center justify-between gap-3 sm:static sm:mx-0 sm:px-0 sm:py-0 sm:bg-transparent sm:backdrop-blur-none sm:border-t-0">
          <button type="button" onClick={() => setSkipped(false)} className="text-xs text-muted-foreground hover:text-foreground underline shrink-0">
            Use guided mode
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!manualPrompt.trim() || isGenerating}
            className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-medium text-sm rounded-xl transition-colors touch-manipulation"
          >
            {isGenerating ? "Generating..." : "Generate course"}
          </button>
        </div>
      </div>
    );
  }

  const hasAudience = audiences.length > 0 || !!customAudience.trim();
  const hasGoal = goals.length > 0;
  const hasDuration = !!duration;
  const hasMaterialChoice = materialChoice !== null;
  const hasBrandStyle = brandPreset !== null;
  const currentStep = !hasAudience ? 1 : !hasGoal ? 2 : !hasDuration ? 3 : !hasMaterialChoice ? 4 : !hasBrandStyle ? 5 : 6;

  return (
    <div className="flex flex-col gap-4 max-w-full overflow-x-hidden">

      {/* Live prompt preview */}
      {hasAudience && (
        <div className="bg-muted/30 border border-border/60 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Your course brief</span>
          <p className="text-sm text-foreground leading-relaxed">
            {manualPrompt || <span className="text-muted-foreground/50 italic">Select options below to build your prompt…</span>}
          </p>
        </div>
      )}

      {/* Step 1: Audience */}
      <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <StepLabel number={1} text="Who are you coaching?" active={currentStep === 1} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {AUDIENCE_OPTIONS.map((opt) => (
            <Chip
              key={opt}
              label={opt}
              selected={!customAudience && audiences.includes(opt)}
              onClick={() => { setCustomAudience(""); setAudiences((prev) => toggleItem(prev, opt)); }}
            />
          ))}
        </div>
        <input
          type="text"
          value={customAudience}
          onChange={(e) => { setCustomAudience(e.target.value); if (e.target.value) setAudiences([]); }}
          placeholder="Or describe your niche..."
          className="w-full min-h-[44px] bg-muted/30 border border-border rounded-lg px-4 py-2.5 text-base sm:text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/60 transition-colors"
        />
      </div>

      {/* Step 2: Goal */}
      {hasAudience && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <StepLabel number={2} text="What's the transformation?" active={currentStep === 2} />
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((opt) => (
              <Chip key={opt.value} label={opt.label} selected={goals.includes(opt.value)} onClick={() => setGoals((prev) => toggleItem(prev, opt.value))} />
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Duration */}
      {hasGoal && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <StepLabel number={3} text="How long?" active={currentStep === 3} />
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} selected={duration === opt} onClick={() => setDuration(duration === opt ? "" : opt)} />
            ))}
          </div>
        </div>
      )}

      {/* Step 4: Material upload */}
      {hasDuration && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <StepLabel number={4} text="Got existing material?" active={currentStep === 4} />
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch gap-2">
            <button
              type="button"
              onClick={() => { setMaterialChoice("upload"); onUploadClick?.(); }}
              className={`min-h-[56px] flex-1 sm:flex-initial flex flex-col items-center justify-center gap-0.5 px-4 py-3 rounded-xl text-sm border transition-all touch-manipulation ${
                materialChoice === "upload"
                  ? "bg-primary/20 border-primary text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground active:bg-muted/40"
              }`}
            >
              <span className="flex items-center gap-2 font-medium">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Upload a PDF
              </span>
              <span className="text-[10px] text-primary/70 font-medium">3x better results</span>
            </button>
            <button
              type="button"
              onClick={() => setMaterialChoice("skip")}
              className={`min-h-[56px] flex-1 sm:flex-initial px-4 py-3 rounded-xl text-sm border transition-all touch-manipulation ${
                materialChoice === "skip"
                  ? "bg-primary/20 border-primary text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground active:bg-muted/40"
              }`}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Brand style */}
      {hasMaterialChoice && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <StepLabel number={5} text="Your brand style" active={currentStep === 5} />
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setBrandPreset(s.key)}
                className={`min-h-[56px] flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all touch-manipulation ${
                  brandPreset === s.key
                    ? "bg-primary/20 border-primary text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground active:bg-muted/40"
                }`}
              >
                <span className="flex gap-0.5 shrink-0">
                  <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: s.swatches[0] }} />
                  <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: s.swatches[1] }} />
                </span>
                <span className="flex flex-col items-start leading-tight min-w-0">
                  <span className="text-xs font-medium truncate">{s.label}</span>
                  <span className="text-[10px] opacity-60 truncate">{s.desc}</span>
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setBrandPreset("custom")}
              className={`min-h-[56px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all touch-manipulation col-span-2 sm:col-span-1 ${
                brandPreset === "custom"
                  ? "bg-primary/20 border-primary text-primary font-medium"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground active:bg-muted/40"
              }`}
            >
              <span className="flex gap-0.5 shrink-0">
                <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: customPrimary }} />
                <span className="w-3 h-3 rounded-full border border-white/20" style={{ background: customAccent }} />
              </span>
              <span className="text-xs font-medium">Custom</span>
            </button>
          </div>
          {brandPreset === "custom" && (
            <div className="flex flex-wrap items-center gap-4 mt-1 animate-in fade-in duration-200">
              <label className="flex items-center gap-2 text-xs text-muted-foreground min-h-[44px]">
                Primary
                <input type="color" value={customPrimary} onChange={(e) => setCustomPrimary(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
              </label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground min-h-[44px]">
                Accent
                <input type="color" value={customAccent} onChange={(e) => setCustomAccent(e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent" />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Actions — sticky to card bottom on mobile so CTA stays reachable */}
      <div className="sticky bottom-0 z-10 -mx-4 px-4 py-3 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-border/40 flex items-center justify-between gap-3 sm:static sm:mx-0 sm:px-0 sm:py-1 sm:pt-1 sm:bg-transparent sm:backdrop-blur-none sm:border-t-0">
        <button type="button" onClick={() => setSkipped(true)} className="text-xs text-muted-foreground hover:text-foreground underline shrink-0 py-2">
          Skip — type my own prompt
        </button>
        {currentStep === 6 && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="min-h-[44px] flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-medium text-sm rounded-xl transition-colors animate-in fade-in zoom-in-95 duration-200 touch-manipulation"
          >
            {isGenerating ? "Generating..." : "Generate course"}
            {!isGenerating && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            )}
          </button>
        )}
      </div>

    </div>
  );
}

export default GuidedPromptBuilder;
