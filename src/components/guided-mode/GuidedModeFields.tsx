import { useState, useRef } from "react";
import { Upload, Link as LinkIcon, X } from "lucide-react";

const DURATION_OPTIONS = ["1 week", "4 weeks", "6 weeks", "8 weeks", "90 days", "Self-paced"];
const FORMAT_OPTIONS = ["Video", "Written", "Audio", "Mixed"];
const PRICE_OPTIONS = ["Free", "$27–$47", "$97–$147", "$197+"];
const EXPERIENCE_OPTIONS = ["Yes", "No"];

interface ChipGroupProps {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

function ChipGroup({ label, options, value, onChange }: ChipGroupProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? "" : opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              value === opt
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-muted/20 border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface GuidedState {
  topic: string;
  audience: string;
  transformation: string;
  duration: string;
  format: string;
  price: string;
  taughtBefore: string;
  hasExisting: boolean;
  existingLink: string;
  existingFile: File | null;
}

export const EMPTY_GUIDED: GuidedState = {
  topic: "",
  audience: "",
  transformation: "",
  duration: "",
  format: "",
  price: "",
  taughtBefore: "",
  hasExisting: false,
  existingLink: "",
  existingFile: null,
};

export function buildPromptFromGuided(s: GuidedState): string {
  const parts = [
    s.topic.trim() && `Course about: ${s.topic.trim()}`,
    s.audience.trim() && `Target audience: ${s.audience.trim()}`,
    s.transformation.trim() && `Transformation: ${s.transformation.trim()}`,
    s.duration && `Duration: ${s.duration}`,
    s.format && `Format: ${s.format}`,
    s.price && `Price point: ${s.price}`,
    s.taughtBefore && `Taught before: ${s.taughtBefore}`,
    s.existingLink.trim() && `Reference: ${s.existingLink.trim()}`,
    s.existingFile && `Reference file: ${s.existingFile.name}`,
  ].filter(Boolean);
  return parts.join(". ");
}

interface GuidedModeFieldsProps {
  state: GuidedState;
  onChange: (next: GuidedState) => void;
  /** Variant styling — "hero" for dark bg, "card" for dashboard */
  variant?: "hero" | "card";
}

export default function GuidedModeFields({ state, onChange, variant = "card" }: GuidedModeFieldsProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof GuidedState>(key: K, value: GuidedState[K]) => {
    onChange({ ...state, [key]: value });
  };

  const inputClass =
    variant === "hero"
      ? "w-full bg-muted/20 border border-primary/10 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/30 transition-colors font-body"
      : "w-full bg-muted/30 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/30 transition-colors";

  return (
    <div className="space-y-3">
      {/* Q1 */}
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">What's your course about?</label>
        <input
          placeholder="e.g. 6-week fat loss program, booty building, macro tracking"
          value={state.topic}
          onChange={(e) => set("topic", e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Q2 */}
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">Who is it for?</label>
        <input
          placeholder="e.g. busy moms, beginners, women over 40"
          value={state.audience}
          onChange={(e) => set("audience", e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Q3 */}
      <div className="space-y-1">
        <label className="text-[11px] font-medium text-muted-foreground">What's the #1 transformation they'll experience?</label>
        <input
          placeholder="e.g. lose 10 pounds, build a home workout habit, understand their macros"
          value={state.transformation}
          onChange={(e) => set("transformation", e.target.value)}
          className={inputClass}
        />
      </div>

      {/* Duration chips */}
      <ChipGroup
        label="How long is your course?"
        options={DURATION_OPTIONS}
        value={state.duration}
        onChange={(v) => set("duration", v)}
      />

      {/* Format chips */}
      <ChipGroup
        label="What format will your lessons be?"
        options={FORMAT_OPTIONS}
        value={state.format}
        onChange={(v) => set("format", v)}
      />

      {/* Price chips */}
      <ChipGroup
        label="What's your price point?"
        options={PRICE_OPTIONS}
        value={state.price}
        onChange={(v) => set("price", v)}
      />

      {/* Taught before */}
      <ChipGroup
        label="Have you taught this before?"
        options={EXPERIENCE_OPTIONS}
        value={state.taughtBefore}
        onChange={(v) => set("taughtBefore", v)}
      />

      {/* Existing content */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-medium text-muted-foreground">
          Do you have an existing PDF, Google Doc, or notes?
        </label>
        <div className="flex gap-2">
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set("hasExisting", opt === "Yes")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                (opt === "Yes" ? state.hasExisting : !state.hasExisting)
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-muted/20 border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>

        {state.hasExisting && (
          <div className="space-y-2 pt-1 animate-in fade-in slide-in-from-top-1 duration-200">
            {/* File upload */}
            <div className="flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.csv,.md"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) set("existingFile", f);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  state.existingFile
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-muted/20 border-border/40 text-muted-foreground hover:border-primary/30"
                }`}
              >
                <Upload className="w-3 h-3" />
                {state.existingFile ? state.existingFile.name : "Upload file"}
              </button>
              {state.existingFile && (
                <button
                  type="button"
                  onClick={() => set("existingFile", null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            {/* Link */}
            <div className="flex items-center gap-2">
              <LinkIcon className="w-3 h-3 text-muted-foreground shrink-0" />
              <input
                placeholder="Paste a Google Doc or link here"
                value={state.existingLink}
                onChange={(e) => set("existingLink", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-primary/10" />
    </div>
  );
}
