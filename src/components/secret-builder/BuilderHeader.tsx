import { useState } from "react";
import {
  Monitor,
  Tablet,
  Smartphone,
  Settings,
  Loader2,
  Cloud,
  CloudOff,
  Wand2,
  MoreVertical,
  Rocket,
  ArrowLeft,
  Sparkles,
  Palette,
  Code2,
  GraduationCap,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import EditableText from "./EditableText";
import { DesignConfig, CourseLayoutStyle } from "@/types/course-pages";

type PreviewMode = "desktop" | "tablet" | "mobile";
type SaveStatus = "saved" | "saving" | "unsaved";

interface BuilderHeaderProps {
  projectName: string;
  onTitleUpdate: (title: string) => void;
  saveStatus: SaveStatus;
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  hasCourse: boolean;
  isPublished: boolean;
  isPublishing: boolean;
  isUnpublishing: boolean;
  onPublish: () => void;
  onUnpublish: () => void;
  onRefine: () => void;
  onOpenSettings: () => void;
  onOpenPublishSettings: () => void;
  onDesignUpdate?: (config: DesignConfig) => void;
  currentDesignConfig?: DesignConfig;
}

const COLOR_FIELDS: { key: string; label: string }[] = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondary" },
  { key: "accent", label: "Accent" },
  { key: "background", label: "Background" },
  { key: "cardBackground", label: "Card BG" },
  { key: "text", label: "Text" },
  { key: "textMuted", label: "Muted Text" },
];

const FONT_OPTIONS = [
  "Inter", "DM Sans", "Playfair Display", "Poppins",
  "Space Grotesk", "Montserrat", "Lora", "Merriweather",
];

const DEFAULT_COLORS: NonNullable<DesignConfig["colors"]> = {
  primary: "#d4a853",
  secondary: "#1a1a1a",
  accent: "#f59e0b",
  background: "#0a0a0a",
  cardBackground: "#111111",
  text: "#ffffff",
  textMuted: "#9ca3af",
};

const TEMPLATE_PRESETS: { value: CourseLayoutStyle; label: string; desc: string; icon: typeof Flame; color: string; colors: Partial<NonNullable<DesignConfig["colors"]>> }[] = [
  { value: "creator", label: "Creator", desc: "Warm, personal brand", icon: Flame, color: "text-amber-400", colors: { primary: "#d4a853", accent: "#f59e0b" } },
  { value: "technical", label: "Technical", desc: "Structured, code-friendly", icon: Code2, color: "text-indigo-400", colors: { primary: "#10b981", accent: "#06b6d4" } },
  { value: "academic", label: "Academic", desc: "Formal, certificate-focused", icon: GraduationCap, color: "text-blue-400", colors: { primary: "#3b82f6", accent: "#6366f1" } },
  { value: "visual", label: "Visual", desc: "Image-heavy, creative", icon: Palette, color: "text-rose-400", colors: { primary: "#8b5cf6", accent: "#ec4899" } },
];

const BuilderHeader = ({
  projectName,
  onTitleUpdate,
  saveStatus,
  previewMode,
  onPreviewModeChange,
  hasCourse,
  isPublished,
  isPublishing,
  isUnpublishing,
  onPublish,
  onUnpublish,
  onRefine,
  onOpenSettings,
  onOpenPublishSettings,
  onDesignUpdate,
  currentDesignConfig,
}: BuilderHeaderProps) => {
  const navigate = useNavigate();
  const [refineOpen, setRefineOpen] = useState(false);

  const config = currentDesignConfig ?? {};
  const colors = { ...DEFAULT_COLORS, ...config.colors };
  const fonts = { heading: "Inter", body: "Inter", ...config.fonts };

  const updateColor = (key: string, value: string) => {
    onDesignUpdate?.({ ...config, colors: { ...colors, [key]: value } });
  };

  const updateFont = (field: "heading" | "body", value: string) => {
    onDesignUpdate?.({ ...config, fonts: { ...fonts, [field]: value } });
  };

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
        {/* Left */}
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/secret-builder-hub")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <EditableText
              value={projectName}
              onSave={onTitleUpdate}
              className="text-sm font-semibold text-foreground"
            />
          </div>

          <Badge
            variant="outline"
            className={cn(
              "text-[10px] uppercase tracking-wider font-medium",
              saveStatus === "saved" && "text-emerald-400 border-emerald-500/30",
              saveStatus === "saving" && "text-amber-400 border-amber-500/30",
              saveStatus === "unsaved" && "text-muted-foreground border-border"
            )}
          >
            {saveStatus === "saving" ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : saveStatus === "saved" ? (
              <Cloud className="mr-1 h-3 w-3" />
            ) : (
              <CloudOff className="mr-1 h-3 w-3" />
            )}
            {saveStatus}
          </Badge>
        </div>

        {/* Center — Preview mode toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5">
          {([
            { mode: "desktop" as const, icon: Monitor },
            { mode: "tablet" as const, icon: Tablet },
            { mode: "mobile" as const, icon: Smartphone },
          ]).map(({ mode, icon: Icon }) => (
            <Button
              key={mode}
              size="icon"
              variant={previewMode === mode ? "secondary" : "ghost"}
              className={cn(
                "h-7 w-7 transition-colors",
                previewMode === mode && "bg-primary/10 text-primary"
              )}
              onClick={() => onPreviewModeChange(mode)}
            >
              <Icon className="h-3.5 w-3.5" />
            </Button>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {hasCourse && (
            <Button
              size="sm"
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setRefineOpen(true)}
            >
              <Wand2 className="mr-1.5 h-3.5 w-3.5" />
              Refine
            </Button>
          )}

          {hasCourse && (
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-glow-sm"
              disabled={isPublishing || isUnpublishing}
              onClick={isPublished ? onUnpublish : onPublish}
            >
              {isPublishing || isUnpublishing ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Rocket className="mr-1.5 h-3.5 w-3.5" />
              )}
              {isPublished ? "Unpublish" : "Publish"}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onOpenSettings}>
                <Settings className="mr-2 h-4 w-4" />
                Course Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenPublishSettings}>
                <Rocket className="mr-2 h-4 w-4" />
                Publish Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Duplicate Course</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Refine Sheet */}
      <Sheet open={refineOpen} onOpenChange={setRefineOpen}>
        <SheetContent side="right" className="w-[360px] sm:w-[400px] p-0">
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <Wand2 className="h-4 w-4 text-primary" />
              Refine Design
            </SheetTitle>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-80px)] px-5 py-4">
            <div className="space-y-6">
              {/* Colors */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-semibold text-foreground">Colors</Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {COLOR_FIELDS.map(({ key, label }) => (
                    <div key={key} className="flex items-center gap-2.5">
                      <input
                        type="color"
                        value={(colors as any)[key] || "#000000"}
                        onChange={(e) => updateColor(key, e.target.value)}
                        className="h-8 w-8 rounded-md border border-border cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        <p className="text-xs text-foreground font-mono">{(colors as any)[key]}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">Typography</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Heading Font</p>
                    <Select value={fonts.heading} onValueChange={(v) => updateFont("heading", v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Body Font</p>
                    <Select value={fonts.body} onValueChange={(v) => updateFont("body", v)}>
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{FONT_OPTIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Layout */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">Layout</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Spacing</p>
                    <Select
                      value={config.spacing || "normal"}
                      onValueChange={(v) => onDesignUpdate?.({ ...config, spacing: v as DesignConfig["spacing"] })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="compact">Compact</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="spacious">Spacious</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Border Radius</p>
                    <Select
                      value={config.borderRadius || "medium"}
                      onValueChange={(v) => onDesignUpdate?.({ ...config, borderRadius: v as DesignConfig["borderRadius"] })}
                    >
                      <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Hero Style */}
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Hero Style</p>
                <Select
                  value={config.heroStyle || "gradient"}
                  onValueChange={(v) => onDesignUpdate?.({ ...config, heroStyle: v })}
                >
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gradient">Gradient</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="split">Split</SelectItem>
                    <SelectItem value="centered">Centered</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Template Presets */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold text-foreground">Template Presets</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATE_PRESETS.map(({ value, label, desc, icon: Icon, color, colors: presetColors }) => (
                    <button
                      key={value}
                      onClick={() => {
                        onDesignUpdate?.({
                          ...config,
                          colors: { ...colors, ...presetColors },
                        });
                      }}
                      className={cn(
                        "flex items-start gap-2 p-3 rounded-lg border text-left transition-all",
                        "border-border hover:border-primary/30 hover:bg-primary/5"
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
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default BuilderHeader;
