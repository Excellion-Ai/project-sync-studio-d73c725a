import { useState, useEffect, useMemo } from "react";
import {
  Sparkles,
  Loader2,
  Check,
  X,
  ChevronDown,
  Paperclip,
  Send,
  Code2,
  Palette,
  GraduationCap,
  Flame,
  BookOpen,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { CourseLayoutStyle } from "@/types/course-pages";

export interface CourseOptions {
  difficulty: "beginner" | "intermediate" | "advanced";
  duration_weeks: number;
  includeQuizzes: boolean;
  includeAssignments: boolean;
  template: CourseLayoutStyle;
}

export interface GenerationStep {
  id: string;
  label: string;
  status: "pending" | "in_progress" | "complete" | "error";
}

export interface AttachmentItem {
  id: string;
  name: string;
  type: string;
  content?: string;
  url?: string;
  mimeType?: string;
  size?: number;
}

interface CourseBuilderPanelProps {
  idea: string;
  onIdeaChange: (idea: string) => void;
  onGenerate: (options: CourseOptions) => void;
  isGenerating: boolean;
  steps: GenerationStep[];
  messages: Array<{ id: string; role: "user" | "assistant"; content: string }>;
  attachments: AttachmentItem[];
  onAddAttachment: (item: AttachmentItem) => void;
  onRemoveAttachment: (id: string) => void;
}

const TEMPLATE_KEYWORDS: Record<CourseLayoutStyle, string[]> = {
  creator: ["coach", "coaching", "personal brand", "influencer", "creator", "marketing", "fitness trainer", "life", "mindset", "wellness"],
  technical: ["programming", "coding", "developer", "python", "javascript", "data", "ml", "api", "software", "engineering", "database", "devops"],
  academic: ["certification", "degree", "professional", "legal", "medical", "research", "mba", "accounting", "compliance", "thesis"],
  visual: ["design", "photography", "video", "ui", "ux", "figma", "animation", "fashion", "illustration", "3d", "creative"],
};

const TEMPLATES: { value: CourseLayoutStyle; label: string; desc: string; icon: typeof Code2 }[] = [
  { value: "creator", label: "Creator", desc: "Warm, personal brand feel", icon: Flame },
  { value: "technical", label: "Technical", desc: "Structured, code-friendly", icon: Code2 },
  { value: "academic", label: "Academic", desc: "Formal, certificate-focused", icon: GraduationCap },
  { value: "visual", label: "Visual", desc: "Image-heavy, creative", icon: Palette },
];

const EXAMPLE_PROMPTS = [
  "Build a 6-week Python bootcamp with weekly projects",
  "Create a personal branding masterclass for coaches",
  "Design a UX certification course with quizzes",
  "Make a 30-day fitness challenge with daily videos",
];

function detectTemplate(text: string): CourseLayoutStyle {
  const lower = text.toLowerCase();
  let best: CourseLayoutStyle = "creator";
  let bestScore = 0;

  for (const [style, keywords] of Object.entries(TEMPLATE_KEYWORDS) as [CourseLayoutStyle, string[]][]) {
    const score = keywords.filter((k) => lower.includes(k)).length;
    if (score > bestScore) {
      bestScore = score;
      best = style;
    }
  }
  return best;
}

const CourseBuilderPanel = ({
  idea,
  onIdeaChange,
  onGenerate,
  isGenerating,
  steps,
  messages,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
}: CourseBuilderPanelProps) => {
  const [showOptions, setShowOptions] = useState(false);
  const [courseOptions, setCourseOptions] = useState<CourseOptions>({
    difficulty: "beginner",
    duration_weeks: 6,
    includeQuizzes: true,
    includeAssignments: true,
    template: "creator",
  });

  const detected = useMemo(() => detectTemplate(idea), [idea]);

  useEffect(() => {
    if (idea.length > 10) {
      setCourseOptions((prev) => ({ ...prev, template: detected }));
    }
  }, [detected, idea]);

  const updateOption = <K extends keyof CourseOptions>(key: K, val: CourseOptions[K]) =>
    setCourseOptions((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="flex flex-col h-full">
      {/* Messages / Progress / Examples */}
      <ScrollArea className="flex-1 px-4 py-3">
        {isGenerating && steps.length > 0 ? (
          <div className="space-y-2 py-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2 text-sm">
                {step.status === "in_progress" && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                {step.status === "complete" && <Check className="h-4 w-4 text-emerald-500" />}
                {step.status === "error" && <X className="h-4 w-4 text-destructive" />}
                {step.status === "pending" && <div className="h-4 w-4 rounded-full border border-border" />}
                <span className={cn(
                  step.status === "in_progress" && "text-foreground font-medium",
                  step.status === "complete" && "text-muted-foreground",
                  step.status === "pending" && "text-muted-foreground/50",
                  step.status === "error" && "text-destructive",
                )}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-3 py-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[90%] rounded-lg px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto bg-muted text-foreground"
                )}
              >
                {msg.content}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Describe your course idea to get started</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onIdeaChange(prompt)}
                  className="text-left text-xs px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Auto-detected template */}
      {idea.length > 10 && (
        <div className="px-4 py-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Auto-detected course style:
          </p>
          <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5">
            {(() => {
              const t = TEMPLATES.find((t) => t.value === courseOptions.template);
              const Icon = t?.icon ?? BookOpen;
              return (
                <>
                  <Icon className="h-4 w-4 text-primary" />
                  <div>
                    <span className="text-xs font-medium text-foreground">{t?.label}</span>
                    <Badge variant="outline" className="ml-1.5 text-[10px] px-1 py-0">Auto-detected</Badge>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Options */}
      <div className="px-4 border-t border-border">
        <Collapsible open={showOptions} onOpenChange={setShowOptions}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Settings2 className="h-3.5 w-3.5" />
              Course Options
              <ChevronDown className={cn("h-3.5 w-3.5 ml-auto transition-transform", showOptions && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pb-3">
            {/* Difficulty */}
            <div className="space-y-2">
              <Label className="text-xs text-foreground">Difficulty</Label>
              <RadioGroup
                value={courseOptions.difficulty}
                onValueChange={(v) => updateOption("difficulty", v as CourseOptions["difficulty"])}
                className="flex gap-2"
              >
                {(["beginner", "intermediate", "advanced"] as const).map((d) => (
                  <Label
                    key={d}
                    className={cn(
                      "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border cursor-pointer transition-colors",
                      courseOptions.difficulty === d
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-primary/40"
                    )}
                  >
                    <RadioGroupItem value={d} className="sr-only" />
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label className="text-xs text-foreground">Duration: {courseOptions.duration_weeks} weeks</Label>
              <Slider
                value={[courseOptions.duration_weeks]}
                onValueChange={([v]) => updateOption("duration_weeks", v)}
                min={1}
                max={12}
                step={1}
              />
            </div>

            {/* Toggles */}
            <div className="flex items-center justify-between">
              <Label className="text-xs text-foreground">Include Quizzes</Label>
              <Switch
                checked={courseOptions.includeQuizzes}
                onCheckedChange={(v) => updateOption("includeQuizzes", v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs text-foreground">Include Assignments</Label>
              <Switch
                checked={courseOptions.includeAssignments}
                onCheckedChange={(v) => updateOption("includeAssignments", v)}
              />
            </div>

            {/* Template cards */}
            <div className="space-y-2">
              <Label className="text-xs text-foreground">Template</Label>
              <div className="grid grid-cols-2 gap-2">
                {TEMPLATES.map(({ value, label, desc, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => updateOption("template", value)}
                    className={cn(
                      "flex items-start gap-2 p-2 rounded-md border text-left transition-colors",
                      courseOptions.template === value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/40"
                    )}
                  >
                    <Icon className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-xs font-medium text-foreground">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Input area */}
      <div className="px-4 pb-3 pt-2 border-t border-border space-y-2">
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {attachments.map((a) => (
              <Badge key={a.id} variant="secondary" className="gap-1 text-xs pr-1">
                <Paperclip className="h-3 w-3" />
                {a.name}
                <button onClick={() => onRemoveAttachment(a.id)} className="ml-0.5 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Textarea
          value={idea}
          onChange={(e) => onIdeaChange(e.target.value)}
          placeholder="Describe your course idea…"
          rows={3}
          className="resize-none text-sm"
          disabled={isGenerating}
        />

        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isGenerating}>
            <Paperclip className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => onGenerate(courseOptions)}
            disabled={isGenerating || !idea.trim()}
            className="gap-1.5"
          >
            {isGenerating ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            ) : (
              <><Sparkles className="h-4 w-4" /> Generate Course</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseBuilderPanel;
