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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import EditableText from "./EditableText";

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
}

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
}: BuilderHeaderProps) => {
  const navigate = useNavigate();

  return (
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
            onClick={onRefine}
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
  );
};

export default BuilderHeader;
