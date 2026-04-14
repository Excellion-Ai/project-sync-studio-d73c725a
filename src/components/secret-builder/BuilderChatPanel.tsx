import { useState, useEffect, useMemo, useRef } from "react";
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
  MessageSquare,
  Wand2,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { CourseLayoutStyle } from "@/types/course-pages";
import {
  CourseOptions,
  GenerationStep,
  AttachmentItem,
} from "./CourseBuilderPanel";
import AttachmentMenu from "./attachments/AttachmentMenu";
import type { AttachmentMenuHandle } from "./attachments/AttachmentMenu";
import GuidedPromptBuilder from "@/components/builder/GuidedPromptBuilder";

// ── Types ─────────────────────────────────────────────────────

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface BuilderChatPanelProps {
  idea: string;
  onIdeaChange: (idea: string) => void;
  onGenerate: (options: CourseOptions) => void;
  isGenerating: boolean;
  steps: GenerationStep[];
  messages: Message[];
  attachments: AttachmentItem[];
  onAddAttachment: (item: AttachmentItem) => void;
  onRemoveAttachment: (id: string) => void;
  onRefinePrompt?: (prompt: string) => void;
  isRefining?: boolean;
  hasCourse?: boolean;
  onAddMessage?: (msg: Message) => void;
}

// ── Template detection ────────────────────────────────────────

const TEMPLATE_KEYWORDS: Record<CourseLayoutStyle, string[]> = {
  creator: ["coach", "coaching", "personal brand", "influencer", "creator", "marketing", "fitness trainer", "life", "mindset", "wellness"],
  technical: ["programming", "coding", "developer", "python", "javascript", "data", "ml", "api", "software", "engineering", "database", "devops"],
  academic: ["certification", "degree", "professional", "legal", "medical", "research", "mba", "accounting", "compliance", "thesis"],
  visual: ["design", "photography", "video", "ui", "ux", "figma", "animation", "fashion", "illustration", "3d", "creative"],
};

const TEMPLATES: { value: CourseLayoutStyle; label: string; desc: string; icon: typeof Code2; color: string }[] = [
  { value: "creator", label: "Creator", desc: "Warm, personal brand feel", icon: Flame, color: "text-amber-400" },
  { value: "technical", label: "Technical", desc: "Structured, code-friendly", icon: Code2, color: "text-indigo-400" },
  { value: "academic", label: "Academic", desc: "Formal, certificate-focused", icon: GraduationCap, color: "text-blue-400" },
  { value: "visual", label: "Visual", desc: "Image-heavy, creative", icon: Palette, color: "text-rose-400" },
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
    if (score > bestScore) { bestScore = score; best = style; }
  }
  return best;
}

// ── Component ─────────────────────────────────────────────────

const REFINE_SUGGESTIONS = [
  "Change the colors to white and red",
  "Make the layout more minimal and modern",
  "Add a testimonials section after the curriculum",
  "Rename Module 1 to 'Getting Started'",
  "Change the font to Poppins",
];

const BuilderChatPanel = ({
  idea,
  onIdeaChange,
  onGenerate,
  isGenerating,
  steps,
  messages,
  attachments,
  onAddAttachment,
  onRemoveAttachment,
  onRefinePrompt,
  isRefining,
  hasCourse,
  onAddMessage,
}: BuilderChatPanelProps) => {
  const [activeTab, setActiveTab] = useState<"build" | "help">("build");
  const [showOptions, setShowOptions] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [pendingBrandStyle, setPendingBrandStyle] = useState<CourseOptions["brandStyle"]>(undefined);
  const [helpInput, setHelpInput] = useState("");
  const [helpMessages, setHelpMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [courseOptions, setCourseOptions] = useState<CourseOptions>({
    difficulty: "beginner",
    duration_weeks: 6,
    includeQuizzes: true,
    includeAssignments: true,
    template: "creator",
  });

  const detected = useMemo(() => detectTemplate(idea), [idea]);

  useEffect(() => {
    if (!hasCourse && idea.length > 10) {
      setCourseOptions((prev) => ({ ...prev, template: detected }));
    }
  }, [detected, idea, hasCourse]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, helpMessages]);

  const updateOption = <K extends keyof CourseOptions>(key: K, val: CourseOptions[K]) =>
    setCourseOptions((prev) => ({ ...prev, [key]: val }));

  const handleChatSubmit = () => {
    if (hasCourse) {
      const text = chatInput.trim();
      if (!text || !onRefinePrompt) return;
      onAddMessage?.({ id: crypto.randomUUID(), role: "user", content: text });
      onRefinePrompt(text);
      setChatInput("");
    } else {
      if (!idea.trim()) return;
      onGenerate({ ...courseOptions, brandStyle: pendingBrandStyle });
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      {/* Tab header */}
      <div className="shrink-0 border-b border-border p-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="w-full bg-background/50">
            <TabsTrigger value="build" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Build
            </TabsTrigger>
            <TabsTrigger value="help" className="flex-1 gap-1.5 text-xs data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <HelpCircle className="h-3.5 w-3.5" />
              Help
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab content */}
      {activeTab === "build" && (
        <BuildTab
          idea={hasCourse ? chatInput : idea}
          onIdeaChange={hasCourse ? setChatInput : onIdeaChange}
          onSubmit={handleChatSubmit}
          isGenerating={isGenerating}
          isRefining={isRefining}
          steps={steps}
          messages={messages}
          attachments={attachments}
          onAddAttachment={onAddAttachment}
          onRemoveAttachment={onRemoveAttachment}
          showOptions={showOptions}
          setShowOptions={setShowOptions}
          courseOptions={courseOptions}
          updateOption={updateOption}
          messagesEndRef={messagesEndRef}
          hasCourse={hasCourse}
          setPendingBrandStyle={setPendingBrandStyle}
        />
      )}

      {activeTab === "help" && (
        <HelpTab
          helpInput={helpInput}
          setHelpInput={setHelpInput}
          messages={helpMessages}
          messagesEndRef={messagesEndRef}
        />
      )}
    </div>
  );
};

// ── Build Tab ─────────────────────────────────────────────────

interface BuildTabProps {
  idea: string;
  onIdeaChange: (idea: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  isRefining?: boolean;
  steps: GenerationStep[];
  messages: Array<{ id: string; role: "user" | "assistant"; content: string }>;
  attachments: AttachmentItem[];
  onAddAttachment: (item: AttachmentItem) => void;
  onRemoveAttachment: (id: string) => void;
  showOptions: boolean;
  setShowOptions: (v: boolean) => void;
  courseOptions: CourseOptions;
  updateOption: <K extends keyof CourseOptions>(key: K, val: CourseOptions[K]) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  hasCourse?: boolean;
  setPendingBrandStyle: (style: CourseOptions["brandStyle"]) => void;
}

const BuildTab = ({
  idea, onIdeaChange, onSubmit, isGenerating, isRefining, steps, messages,
  attachments, onAddAttachment, onRemoveAttachment, showOptions, setShowOptions,
  courseOptions, updateOption, messagesEndRef, hasCourse, setPendingBrandStyle,
}: BuildTabProps) => {
  const isBusy = isGenerating || !!isRefining;
  const attachMenuRef = useRef<AttachmentMenuHandle>(null);

  return (
    <>
      {/* Messages / Progress / Examples */}
      <ScrollArea className="flex-1 px-4 py-3">
        {isGenerating && steps.length > 0 ? (
          <div className="space-y-3 py-4">
            <p className="text-xs font-medium text-primary mb-3">Generating your course…</p>
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-3 text-sm">
                {step.status === "in_progress" && (
                  <div className="h-5 w-5 rounded-full border-2 border-primary flex items-center justify-center">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  </div>
                )}
                {step.status === "complete" && (
                  <div className="h-5 w-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <Check className="h-3 w-3 text-emerald-400" />
                  </div>
                )}
                {step.status === "error" && (
                  <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center">
                    <X className="h-3 w-3 text-destructive" />
                  </div>
                )}
                {step.status === "pending" && (
                  <div className="h-5 w-5 rounded-full border border-border" />
                )}
                <span className={cn(
                  "transition-colors",
                  step.status === "in_progress" && "text-foreground font-medium",
                  step.status === "complete" && "text-muted-foreground",
                  step.status === "pending" && "text-muted-foreground/40",
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
                  "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  msg.role === "user"
                    ? "ml-auto bg-primary/15 text-foreground border border-primary/20"
                    : "mr-auto bg-muted text-foreground border border-border"
                )}
              >
                {msg.content}
              </div>
            ))}
            {isRefining && (
              <div className="mr-auto flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                Applying changes…
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : hasCourse ? (
          <div className="py-6 space-y-4">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Wand2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Tell me what to change</h3>
              <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
                Type any change — colors, layout, content, modules — and it will update instantly.
              </p>
            </div>
            <div className="space-y-2">
              {REFINE_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => onIdeaChange(s)}
                  className="w-full text-left text-xs px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-8 space-y-5">
            <div className="text-center space-y-2">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto shadow-glow-sm">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Create Your Course</h3>
              <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
                Describe your course idea and AI will generate the full curriculum, lessons, and design.
              </p>
            </div>
            <div className="space-y-2">
              {EXAMPLE_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => onIdeaChange(prompt)}
                  className="w-full text-left text-xs px-3 py-2.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-primary/5 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </ScrollArea>

      {/* Auto-detected template chip (only before course exists) */}
      {!hasCourse && idea.length > 10 && (
        <div className="px-4 py-2 border-t border-border">
          <div className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            {(() => {
              const t = TEMPLATES.find((t) => t.value === courseOptions.template);
              const Icon = t?.icon ?? BookOpen;
              return (
                <>
                  <Icon className={cn("h-4 w-4", t?.color ?? "text-primary")} />
                  <span className="text-xs font-medium text-foreground">{t?.label} Template</span>
                  <Badge variant="outline" className="ml-auto text-[9px] px-1.5 py-0 border-primary/30 text-primary">
                    Auto
                  </Badge>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Options collapsible (only before course exists) */}
      {!hasCourse && (
        <div className="px-4 border-t border-border">
          <Collapsible open={showOptions} onOpenChange={setShowOptions}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 w-full py-2.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
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
                  min={1} max={12} step={1}
                />
              </div>
              {/* Toggles */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-foreground">Include Quizzes</Label>
                <Switch checked={courseOptions.includeQuizzes} onCheckedChange={(v) => updateOption("includeQuizzes", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-foreground">Include Assignments</Label>
                <Switch checked={courseOptions.includeAssignments} onCheckedChange={(v) => updateOption("includeAssignments", v)} />
              </div>
              {/* Template cards */}
              <div className="space-y-2">
                <Label className="text-xs text-foreground">Template</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map(({ value, label, desc, icon: Icon, color }) => (
                    <button
                      key={value}
                      onClick={() => updateOption("template", value)}
                      className={cn(
                        "flex items-start gap-2 p-2.5 rounded-lg border text-left transition-all",
                        courseOptions.template === value
                          ? "border-primary bg-primary/5 shadow-glow-sm"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", color)} />
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
      )}

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

        {/* AttachmentMenu for GuidedPromptBuilder step 4 file picker */}
        {!hasCourse && (
          <AttachmentMenu ref={attachMenuRef} onAdd={onAddAttachment} disabled={isBusy} />
        )}

        {hasCourse ? (
          <>
            <div className="relative">
              <Textarea
                value={idea}
                onChange={(e) => onIdeaChange(e.target.value)}
                placeholder="Tell me what to change…"
                rows={2}
                className="resize-none text-sm pr-20 bg-background border-border focus:border-primary/50 focus:ring-primary/20"
                disabled={isBusy}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && idea.trim()) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
              />
              <div className="absolute bottom-2 right-2 flex flex-col items-center gap-1">
                <AttachmentMenu onAdd={onAddAttachment} disabled={isBusy} />
                <Button
                  size="icon"
                  className="h-7 w-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm"
                  onClick={onSubmit}
                  disabled={isBusy || !idea.trim()}
                >
                  {isBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">Enter to send</p>
          </>
        ) : (
          <GuidedPromptBuilder
            onPromptChange={onIdeaChange}
            onGenerate={(prompt, brandStyle) => { onIdeaChange(prompt); setPendingBrandStyle(brandStyle); setTimeout(() => onSubmit(), 0); }}
            isGenerating={isBusy}
            hasAttachment={attachments.length > 0}
            onUploadClick={() => attachMenuRef.current?.openFilePicker()}
          />
        )}
      </div>
    </>
  );
};

// ── Help Tab ──────────────────────────────────────────────────

const HelpTab = ({
  helpInput,
  setHelpInput,
  messages,
  messagesEndRef,
}: {
  helpInput: string;
  setHelpInput: (v: string) => void;
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}) => (
  <>
    <ScrollArea className="flex-1 px-4 py-3">
      {messages.length === 0 ? (
        <div className="py-8 text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <MessageSquare className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
          <p className="text-xs text-muted-foreground max-w-[240px] mx-auto">
            Ask questions about course creation, get suggestions, or troubleshoot issues.
          </p>
        </div>
      ) : (
        <div className="space-y-3 py-2">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm",
                msg.role === "user"
                  ? "ml-auto bg-primary/15 text-foreground border border-primary/20"
                  : "mr-auto bg-muted text-foreground border border-border"
              )}
            >
              {msg.content}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </ScrollArea>
    <div className="px-4 pb-3 pt-2 border-t border-border">
      <div className="relative">
        <Textarea
          value={helpInput}
          onChange={(e) => setHelpInput(e.target.value)}
          placeholder="Ask anything about your course…"
          rows={2}
          className="resize-none text-sm pr-12 bg-background border-border focus:border-primary/50"
        />
        <Button
          size="icon"
          className="absolute bottom-2 right-2 h-7 w-7 bg-primary text-primary-foreground hover:bg-primary/90"
          disabled={!helpInput.trim()}
        >
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  </>
);

export default BuilderChatPanel;
