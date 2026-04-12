import { useState, useEffect } from "react";

interface GuidedPromptBuilderProps {
  onPromptChange: (prompt: string) => void;
  onGenerate: (prompt: string) => void;
  isGenerating?: boolean;
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

function buildPrompt(audience: string, goal: string, duration: string): string {
  if (!audience) return "";
  let p = `Create a`;
  if (duration) p += ` ${duration}`;
  p += ` fitness course for ${audience}`;
  if (goal) p += ` with the goal of: ${goal}`;
  p += `.`;
  if (audience && goal && duration) {
    p += ` Deliver a complete course outline, full module structure, detailed lesson plans, and coaching notes per module.`;
  }
  return p;
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

export function GuidedPromptBuilder({ onPromptChange, onGenerate, isGenerating = false }: GuidedPromptBuilderProps) {
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("");
  const [skipped, setSkipped] = useState(false);
  const [manualPrompt, setManualPrompt] = useState("");

  const prompt = buildPrompt(audience, goal, duration);

  useEffect(() => {
    if (!skipped) {
      setManualPrompt(prompt);
      onPromptChange(prompt);
    }
  }, [audience, goal, duration, skipped]);

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

  const currentStep = !audience ? 1 : !goal ? 2 : !duration ? 3 : 4;

  return (
    <div className="flex flex-col gap-4">

      {audience && (
        <div className="bg-muted/30 border border-border/60 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1">Your course brief</span>
          <p className="text-sm text-foreground leading-relaxed">
            {manualPrompt || <span className="text-muted-foreground/50 italic">Select options below to build your prompt…</span>}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <StepLabel number={1} text="Who are you coaching?" active={currentStep === 1} />
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={audience === opt} onClick={() => setAudience(audience === opt ? "" : opt)} />
          ))}
        </div>
      </div>

      {audience && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <StepLabel number={2} text="What's the transformation?" active={currentStep === 2} />
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((opt) => (
              <Chip key={opt.value} label={opt.label} selected={goal === opt.value} onClick={() => setGoal(goal === opt.value ? "" : opt.value)} />
            ))}
          </div>
        </div>
      )}

      {goal && (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <StepLabel number={3} text="How long?" active={currentStep === 3} />
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} selected={duration === opt} onClick={() => setDuration(duration === opt ? "" : opt)} />
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={() => setSkipped(true)} className="text-xs text-muted-foreground hover:text-foreground underline">
          Skip — type my own prompt
        </button>
        {currentStep === 4 && (
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
