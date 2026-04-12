import { useState, useEffect } from "react";

interface GuidedPromptBuilderProps {
  onPromptChange: (prompt: string) => void;
  onGenerate: (prompt: string) => void;
  isGenerating?: boolean;
  onUploadClick?: () => void;
  hasAttachment?: boolean;
}

const AUDIENCE_OPTIONS = [
  "Busy moms", "Men over 40", "Beginners", "Athletes",
  "Bodybuilders", "Powerlifters", "Women who lift", "Busy professionals",
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
      className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
        selected
          ? "bg-primary/20 border-primary text-primary font-medium"
          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
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
  const [goals, setGoals] = useState<string[]>([]);
  const [duration, setDuration] = useState("");
  const [skipped, setSkipped] = useState(false);
  const [materialChoice, setMaterialChoice] = useState<"upload" | "skip" | null>(null);
  const [manualPrompt, setManualPrompt] = useState("");

  const prompt = buildPrompt(audiences, goals, duration);

  // Auto-set materialChoice to "upload" when an attachment is added externally
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
  }, [audiences, goals, duration, skipped]);

  function handleGenerate() {
    const final = manualPrompt.trim();
    if (final) onGenerate(final);
  }

  if (skipped) {
    return (
      <div className="flex flex-col gap-3">
        <textarea
          value={manualPrompt}
          onChange={(e) => { setManualPrompt(e.target.value); onPromptChange(e.target.value); }}
          rows={4}
          placeholder="Describe your course idea in detail..."
          className="w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 text-sm resize-none focus:outline-none focus:border-primary/60"
        />
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setSkipped(false)} className="text-xs text-muted-foreground hover:text-foreground underline">
            Use guided mode
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!manualPrompt.trim() || isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-medium text-sm rounded-xl transition-colors"
          >
            {isGenerating ? "Generating..." : "Generate course"}
          </button>
        </div>
      </div>
    );
  }

  const hasAudience = audiences.length > 0;
  const hasGoal = goals.length > 0;
  const hasDuration = !!duration;
  const hasMaterialChoice = materialChoice !== null;
  const currentStep = !hasAudience ? 1 : !hasGoal ? 2 : !hasDuration ? 3 : !hasMaterialChoice ? 4 : 5;

  return (
    <div className="flex flex-col gap-4">

      {/* Live prompt preview */}
      {hasAudience && (
        <div className="bg-muted/30 border border-border/60 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Your course brief</span>
          <p className="text-sm text-foreground leading-relaxed">
            {manualPrompt || <span className="text-muted-foreground/50 italic">Select options below to build your prompt…</span>}
          </p>
        </div>
      )}

      {/* Step 1: Audience (multi-select) */}
      <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <StepLabel number={1} text="Who are you coaching?" active={currentStep === 1} />
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={audiences.includes(opt)} onClick={() => setAudiences((prev) => toggleItem(prev, opt))} />
          ))}
        </div>
      </div>

      {/* Step 2: Goal (multi-select) */}
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

      {/* Step 3: Duration (single-select) */}
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
          <div className="flex flex-wrap items-start gap-2">
            <div className="flex flex-col items-start">
              <button
                type="button"
                onClick={() => {
                  setMaterialChoice("upload");
                  onUploadClick?.();
                }}
                className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                  materialChoice === "upload"
                    ? "bg-primary/20 border-primary text-primary font-medium"
                    : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                Upload a PDF
              </button>
              <span className="text-[10px] text-primary/70 font-medium mt-1 ml-2">3x better results</span>
            </div>
            <Chip label="Skip for now" selected={materialChoice === "skip"} onClick={() => setMaterialChoice("skip")} />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={() => setSkipped(true)} className="text-xs text-muted-foreground hover:text-foreground underline">
          Skip — type my own prompt
        </button>
        {currentStep === 5 && (
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground font-medium text-sm rounded-xl transition-colors animate-in fade-in zoom-in-95 duration-200"
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
