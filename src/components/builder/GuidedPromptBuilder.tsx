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
          ? "bg-amber-500/20 border-amber-500 text-amber-200 font-medium"
          : "border-white/20 text-white/60 hover:border-white/40 hover:text-white/80"
      }`}
    >
      {label}
    </button>
  );
}

export function GuidedPromptBuilder({ onPromptChange, onGenerate, isGenerating = false }: GuidedPromptBuilderProps) {
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("");
  const [customAudience, setCustomAudience] = useState("");
  const [customGoal, setCustomGoal] = useState("");
  const [skipped, setSkipped] = useState(false);
  const [manualPrompt, setManualPrompt] = useState("");

  const prompt = buildPrompt(audience, goal, duration);

  useEffect(() => {
    setManualPrompt(prompt);
    onPromptChange(prompt);
  }, [audience, goal, duration]);

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
          className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-white/30 text-sm resize-none focus:outline-none focus:border-amber-500/60"
        />
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setSkipped(false)} className="text-xs text-white/40 hover:text-white/60 underline">
            Use guided mode
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!manualPrompt.trim() || isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-medium text-sm rounded-xl transition-colors"
          >
            {isGenerating ? "Generating..." : "Generate course"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Live prompt preview — appears once audience is picked */}
      {audience && (
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          <span className="text-xs text-white/30 uppercase tracking-wider block mb-1.5">Your course brief</span>
          <textarea
            value={manualPrompt}
            onChange={(e) => { setManualPrompt(e.target.value); onPromptChange(e.target.value); }}
            rows={2}
            className="w-full bg-transparent text-white/80 text-sm resize-none focus:outline-none leading-relaxed"
          />
        </div>
      )}

      {/* Step 1: Audience */}
      <div className="flex flex-col gap-2">
        <span className="text-xs text-white/40 uppercase tracking-wider">Who are you coaching?</span>
        <div className="flex flex-wrap gap-2">
          {AUDIENCE_OPTIONS.map((opt) => (
            <Chip key={opt} label={opt} selected={audience === opt} onClick={() => { setAudience(opt); setCustomAudience(""); }} />
          ))}
        </div>
        <input
          type="text"
          value={customAudience}
          onChange={(e) => { setCustomAudience(e.target.value); if (e.target.value.trim()) setAudience(e.target.value.trim()); }}
          placeholder="Or describe your audience..."
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50"
        />
      </div>

      {/* Step 2: Goal */}
      {audience && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-white/40 uppercase tracking-wider">What's the transformation?</span>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((opt) => (
              <Chip key={opt.value} label={opt.label} selected={goal === opt.value} onClick={() => { setGoal(opt.value); setCustomGoal(""); }} />
            ))}
          </div>
          <input
            type="text"
            value={customGoal}
            onChange={(e) => { setCustomGoal(e.target.value); if (e.target.value.trim()) setGoal(e.target.value.trim()); }}
            placeholder="Or describe the exact result..."
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      )}

      {/* Step 3: Duration */}
      {goal && (
        <div className="flex flex-col gap-2">
          <span className="text-xs text-white/40 uppercase tracking-wider">How long?</span>
          <div className="flex flex-wrap gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <Chip key={opt} label={opt} selected={duration === opt} onClick={() => setDuration(opt)} />
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <button type="button" onClick={() => setSkipped(true)} className="text-xs text-white/30 hover:text-white/50 underline">
          Skip — type my own prompt
        </button>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!audience || isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black font-medium text-sm rounded-xl transition-colors"
        >
          {isGenerating ? "Generating..." : "Generate course"}
          {!isGenerating && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          )}
        </button>
      </div>

    </div>
  );
}

export default GuidedPromptBuilder;
