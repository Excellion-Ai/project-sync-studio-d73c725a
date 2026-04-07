import { useState, useEffect, useCallback, useRef } from "react";
import excellionLogo from "@/assets/excellion-logo.png";
import { useNavigate, Navigate } from "react-router-dom";
import {
  Sparkles,
  MoreVertical,
  Trash2,
  Copy,
  EyeOff,
  Pencil,
  RotateCcw,
  BookOpen,
  Settings,
  Search,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  Paperclip,
  X,
  FileText,
  Zap,
  Send,
  ExternalLink,
  Headphones,
  BarChart3,
  BookOpenCheck,
  FolderOpen,
  GraduationCap,
  Dumbbell,
  ChefHat,
  Languages,
  Briefcase,
  CreditCard,
  Eye,
  Globe,
  Menu,
  LogOut,
  Mic,
  MicOff,
  Palette,
  Code,
  Camera,
  Music,
  Heart,
  Lightbulb,
  TrendingUp,
  Users,
  Star,
  ArrowRight,
  Plus,
  Share2,
  Link,
  Instagram,
  Check,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { AI } from "@/services/ai";

// ── Types ────────────────────────────────────────────────────

interface BuilderProject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface CourseItem {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  thumbnail_url: string | null;
  curriculum: any;
  updated_at: string | null;
  deleted_at: string | null;
  builder_project_id: string | null;
  type: string | null;
  slug: string;
  subdomain: string | null;
  published_at: string | null;
  total_students: number | null;
  layout_template: string | null;
  design_config: any;
  tagline: string | null;
}

interface AttachmentItem {
  id: string;
  name: string;
  type: string;
  file?: File;
}

// ── Quick prompts ────────────────────────────────────────────

const QUICK_PROMPTS = [
  { label: "6-week fat loss program", icon: Dumbbell },
  { label: "Home workout plan for beginners", icon: Heart },
  { label: "Strength training fundamentals", icon: Dumbbell },
  { label: "Yoga & mobility course", icon: Heart },
  { label: "Nutrition & meal prep guide", icon: GraduationCap },
  { label: "HIIT & cardio bootcamp", icon: Dumbbell },
  { label: "Bodybuilding for beginners", icon: Dumbbell },
  { label: "Mindset & fitness habits", icon: Heart },
];

// ── Template cards ───────────────────────────────────────────

// Templates removed — replaced by saved courses grid

// ── Sidebar nav items ────────────────────────────────────────

const NAV_ITEMS = [
  { title: "Excellion Homepage", icon: ExternalLink, path: "/" },
  { title: "Expert Support", icon: Headphones, path: "/contact" },
  { title: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
  { title: "Resources", icon: BookOpenCheck, path: "/courses" },
  { title: "Billing", icon: CreditCard, path: "/billing" },
];

const SETTINGS_ITEMS = [
  { title: "Profile", path: "/settings/profile" },
  { title: "Billing", path: "/settings/billing" },
  { title: "Notifications", path: "/settings/notifications" },
  { title: "Workspace", path: "/settings/workspace" },
  { title: "Domains", path: "/settings/domains" },
  { title: "Appearance", path: "/settings/appearance" },
];

// ── VoiceBotPlaceholder ──────────────────────────────────────

function VoiceBotPlaceholder({ onClose }: { onClose: () => void }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div
        className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300",
          isListening
            ? "bg-primary/20 ring-4 ring-primary/30 animate-pulse"
            : "bg-muted"
        )}
      >
        {isListening ? (
          <Mic className="w-10 h-10 text-primary" />
        ) : (
          <MicOff className="w-10 h-10 text-muted-foreground" />
        )}
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">
          {isListening ? "Listening..." : "Voice Build Assist"}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          {isListening
            ? "Speak your course idea and we'll help you build it"
            : "Click the microphone to describe your course idea by voice"}
        </p>
      </div>

      {transcript && (
        <div className="w-full max-w-md p-3 rounded-lg bg-muted text-sm">
          {transcript}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant={isListening ? "destructive" : "default"}
          size="lg"
          className="gap-2"
          onClick={() => {
            if (isListening) {
              setIsListening(false);
              setTranscript("Voice input captured. Processing your idea...");
              setTimeout(() => {
                toast.info("Voice Build Assist is coming soon!");
                onClose();
              }, 1500);
            } else {
              setIsListening(true);
              setTranscript("");
            }
          }}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" /> Stop
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" /> Start Listening
            </>
          )}
        </Button>
        <Button variant="outline" size="lg" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground">
        Voice Build Assist is in beta. Results may vary.
      </p>
    </div>
  );
}

// ── Sidebar Content (shared between desktop and mobile) ──────

interface SidebarContentProps {
  courses: CourseItem[];
  trashedCourses: CourseItem[];
  onNavigate: (path: string) => void;
  onRestoreCourse: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onSignOut: () => void;
}

function SidebarInner({
  courses,
  trashedCourses,
  onNavigate,
  onRestoreCourse,
  onPermanentDelete,
  onSignOut,
}: SidebarContentProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(true);
  const [trashOpen, setTrashOpen] = useState(false);

  return (
    <div className="flex flex-col h-full bg-[hsl(0_0%_3%)]">
      {/* Brand */}
      <div className="p-5 pb-4">
        <button
          onClick={() => onNavigate("/")}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
          <img
            src={excellionLogo}
            alt="Excellion"
            className="h-10 w-10 rounded-full object-cover"
          />
          <div className="text-left">
            <p className="text-sm font-semibold text-foreground">Excellion</p>
            <p className="text-xs text-muted-foreground">Course Studio</p>
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="px-3">
        <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
          <Search className="h-4 w-4" />
          <span>Search</span>
          <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Settings collapsible */}
      <div className="px-3 mt-1">
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2.5">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                settingsOpen && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1 space-y-0.5 pl-2">
            {SETTINGS_ITEMS.map((item) => (
              <button
                key={item.title}
                onClick={() => onNavigate(item.path)}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              >
                {item.title}
              </button>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <Separator className="my-3" />

      {/* Nav links */}
      <nav className="px-3 space-y-0.5">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.title}
            onClick={() => onNavigate(item.path)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <item.icon className="h-4 w-4" />
            <span>{item.title}</span>
          </button>
        ))}
      </nav>

      <Separator className="my-3" />

      {/* Courses Folder */}
      <div className="px-3 flex-1 min-h-0 overflow-hidden">
        <Collapsible open={coursesOpen} onOpenChange={setCoursesOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2.5">
              <FolderOpen className="h-4 w-4" />
              <span>Courses</span>
              {courses.length > 0 && (
                <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">
                  {courses.length}
                </span>
              )}
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                coursesOpen && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="max-h-48 mt-1">
              <div className="space-y-0.5 pl-2">
                {courses.slice(0, 15).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      const pid = c.builder_project_id;
                      if (pid) onNavigate(`/studio/${pid}`);
                      else toast.info("No project linked to this course.");
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate text-xs">{c.title}</span>
                    {c.status === "published" && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </button>
                ))}
                {courses.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    No courses yet
                  </p>
                )}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>

        {/* Trash */}
        <Collapsible open={trashOpen} onOpenChange={setTrashOpen}>
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors mt-0.5">
            <div className="flex items-center gap-2.5">
              <Trash2 className="h-4 w-4" />
              <span>Trash</span>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform",
                trashOpen && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ScrollArea className="max-h-32 mt-1">
              <div className="space-y-0.5 pl-2">
                {trashedCourses.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm text-muted-foreground group"
                  >
                    <span className="truncate text-xs">{c.title}</span>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onRestoreCourse(c.id)}
                        className="text-[10px] hover:text-foreground"
                        title="Restore"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onPermanentDelete(c.id)}
                        className="text-[10px] hover:text-destructive"
                        title="Delete forever"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {trashedCourses.length === 0 && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">
                    Trash is empty
                  </p>
                )}
              </div>
            </ScrollArea>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Bottom section */}
      <div className="mt-auto border-t border-border">
        {/* Upgrade to Pro */}
        <div className="p-3">
          <button
            onClick={() => onNavigate("/billing")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
              color: "hsl(var(--primary-foreground))",
              boxShadow: "0 0 16px hsl(var(--primary) / 0.3), 0 0 4px hsl(var(--primary) / 0.2)",
            }}
          >
            <Sparkles className="h-4 w-4" />
            <span>Upgrade to Pro</span>
          </button>
        </div>

        <Separator />

        {/* Sign out */}
        <div className="p-3">
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Course Card Component ────────────────────────────────────

interface CourseCardProps {
  course: CourseItem;
  onEdit: (course: CourseItem) => void;
  onPreview: (course: CourseItem) => void;
  onDuplicate: (course: CourseItem) => void;
  onPublish: (course: CourseItem) => void;
  onUnpublish: (course: CourseItem) => void;
  onDelete: (course: CourseItem) => void;
  onShare: (course: CourseItem) => void;
}

function CourseCard({
  course,
  onEdit,
  onPreview,
  onDuplicate,
  onPublish,
  onUnpublish,
  onDelete,
  onShare,
}: CourseCardProps) {
  const getModuleCount = (curriculum: any) =>
    Array.isArray(curriculum) ? curriculum.length : 0;
  const getLessonCount = (curriculum: any) => {
    if (!Array.isArray(curriculum)) return 0;
    return curriculum.reduce(
      (sum: number, mod: any) =>
        sum + (Array.isArray(mod?.lessons) ? mod.lessons.length : 0),
      0
    );
  };

  const isPublished = course.status === "published";
  const moduleCount = getModuleCount(course.curriculum);
  const lessonCount = getLessonCount(course.curriculum);

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:shadow-[var(--shadow-glow-sm)] border-border/60 bg-card"
      onClick={() => onEdit(course)}
    >
      {/* Thumbnail / Mini Preview */}
      <div className="h-36 relative overflow-hidden">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (() => {
          const dc = course.design_config as any;
          const primary = dc?.colors?.primary || "#d4a853";
          const bg = dc?.colors?.background || "#0a0a0a";
          const accent = dc?.colors?.accent || "#f59e0b";
          const textColor = dc?.colors?.text || "#ffffff";
          const firstModule = Array.isArray(course.curriculum) ? course.curriculum[0] : null;
          const moduleTitle = firstModule?.title || firstModule?.name || "";
          const lessonTitles = (firstModule?.lessons || []).slice(0, 3).map((l: any) => l?.title || l?.name || "");

          return (
            <div
              className="h-full w-full p-3 flex flex-col justify-between"
              style={{ background: `linear-gradient(135deg, ${bg} 0%, ${bg}ee 60%, ${primary}22 100%)` }}
            >
              {/* Mini hero */}
              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-wider mb-1 truncate"
                  style={{ color: primary }}
                >
                  {course.tagline || course.type || "Course"}
                </div>
                <div
                  className="text-xs font-semibold leading-tight line-clamp-2"
                  style={{ color: textColor }}
                >
                  {course.title}
                </div>
              </div>
              {/* Mini curriculum preview */}
              {moduleTitle && (
                <div className="space-y-0.5 mt-auto">
                  <div className="text-[9px] font-medium truncate" style={{ color: accent }}>
                    {moduleTitle}
                  </div>
                  {lessonTitles.map((lt: string, i: number) => (
                    <div
                      key={i}
                      className="text-[8px] truncate pl-2 opacity-60"
                      style={{ color: textColor }}
                    >
                      • {lt}
                    </div>
                  ))}
                </div>
              )}
              {/* Accent bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: `linear-gradient(90deg, ${primary}, ${accent})` }}
              />
            </div>
          );
        })()}

        {/* Status badge */}
        <Badge
          variant={isPublished ? "default" : "secondary"}
          className={cn(
            "absolute top-2.5 left-2.5 text-[10px]",
            isPublished && "bg-emerald-600 text-white hover:bg-emerald-700"
          )}
        >
          {isPublished ? "Published" : "Draft"}
        </Badge>

        {/* Hover overlay with quick actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(course);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreview(course);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Preview</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(course);
                  }}
                >
                  <Share2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-3.5 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-medium leading-tight line-clamp-2">
            {course.title}
          </h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
              <DropdownMenuItem onClick={() => onEdit(course)}>
                <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPreview(course)}>
                <Eye className="mr-2 h-3.5 w-3.5" /> Preview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(course)}>
                <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isPublished ? (
                <DropdownMenuItem onClick={() => onUnpublish(course)}>
                  <EyeOff className="mr-2 h-3.5 w-3.5" /> Unpublish
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onPublish(course)}>
                  <Globe className="mr-2 h-3.5 w-3.5" /> Publish
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(course)}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {course.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {course.total_students ?? 0} students enrolled
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{moduleCount} modules</span>
          <span className="text-border">·</span>
          <span>{lessonCount} lessons</span>
        </div>

        {isPublished && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              const url = `${window.location.origin}/course/${course.slug}`;
              navigator.clipboard.writeText(url);
              toast.success("Link copied!");
            }}
          >
            <Link className="h-3 w-3" />
            Copy Link
          </Button>
        )}

        {course.updated_at && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(course.updated_at).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main HubContent ──────────────────────────────────────────

function HubContent() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  // Core state
  const [idea, setIdea] = useState(
    () => localStorage.getItem("builder-initial-idea") || ""
  );
  const [guidedMode, setGuidedMode] = useState(false);
  const [guidedQ1, setGuidedQ1] = useState("");
  const [guidedQ2, setGuidedQ2] = useState("");
  const [guidedQ3, setGuidedQ3] = useState("");
  const [autoTriggered, setAutoTriggered] = useState(false);
  const [projects, setProjects] = useState<BuilderProject[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [trashedCourses, setTrashedCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [showAllCourses, setShowAllCourses] = useState(false);

  // Dialogs
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showBuildAssist, setShowBuildAssist] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [publishedCourse, setPublishedCourse] = useState<CourseItem | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load data ──────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [projRes, activeRes, trashedRes] = await Promise.all([
        supabase
          .from("builder_projects")
          .select("id, name, created_at, updated_at")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(50),
        supabase
          .from("courses")
          .select(
            "id, title, description, status, thumbnail_url, curriculum, updated_at, deleted_at, builder_project_id, type, slug, subdomain, published_at, total_students, layout_template, design_config, tagline"
          )
          .eq("user_id", userId)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .limit(50),
        supabase
          .from("courses")
          .select(
            "id, title, description, status, thumbnail_url, curriculum, updated_at, deleted_at, builder_project_id, type, slug, subdomain, published_at, total_students, layout_template, design_config, tagline"
          )
          .eq("user_id", userId)
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false })
          .limit(50),
      ]);

      if (projRes.data) setProjects(projRes.data);
      if (activeRes.data) setCourses(activeRes.data as CourseItem[]);
      if (trashedRes.data) setTrashedCourses(trashedRes.data as CourseItem[]);
      setIsLoading(false);
    };
    load();
  }, [userId]);

  // Check for ?published= param to show celebration modal
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const publishedSlug = params.get("published");
    if (publishedSlug && courses.length > 0) {
      const course = courses.find((c) => c.slug === publishedSlug);
      if (course) {
        setPublishedCourse(course);
        // Clean the URL
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [courses]);

  // ── Handlers ───────────────────────────────────────────────

  const handleGenerate = useCallback(async (overrideIdea?: string) => {
    const prompt = overrideIdea || idea;
    if (!prompt.trim() || !userId) return;
    setIsGenerating(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired. Please sign in again.");
        navigate("/auth");
        return;
      }

      const { data: proj, error } = await supabase
        .from("builder_projects")
        .insert({ name: prompt.slice(0, 80), user_id: session.user.id })
        .select("id")
        .single();
      if (error || !proj) throw error;

      localStorage.setItem("builder-initial-idea", prompt);
      localStorage.setItem("last-project-id", proj.id);
      navigate(`/studio/${proj.id}`, { state: { initialIdea: prompt } });
    } catch (err) {
      console.error("handleGenerate error:", err);
      toast.error("Failed to create project.");
    } finally {
      setIsGenerating(false);
    }
  }, [idea, userId, navigate]);

  // Template generation removed — users start from prompts or saved courses

  // Auto-trigger generation if idea came from home page
  useEffect(() => {
    if (autoTriggered || !idea.trim() || !userId || isLoading || isGenerating)
      return;
    const fromHome = localStorage.getItem("builder-initial-idea");
    if (fromHome) {
      setAutoTriggered(true);
      localStorage.removeItem("builder-initial-idea");
      handleGenerate();
    }
  }, [idea, userId, isLoading, isGenerating, autoTriggered, handleGenerate]);

  const handleDeleteCourse = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("courses")
        .update({ deleted_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) {
        toast.error("Failed to delete course.");
        return;
      }
      const deleted = courses.find((c) => c.id === id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      if (deleted)
        setTrashedCourses((prev) => [
          { ...deleted, deleted_at: new Date().toISOString() },
          ...prev,
        ]);
      toast.success("Course moved to trash.");
    },
    [courses]
  );

  const handleRestoreCourse = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("courses")
        .update({ deleted_at: null } as any)
        .eq("id", id);
      if (error) {
        toast.error("Failed to restore course.");
        return;
      }
      const restored = trashedCourses.find((c) => c.id === id);
      setTrashedCourses((prev) => prev.filter((c) => c.id !== id));
      if (restored)
        setCourses((prev) => [{ ...restored, deleted_at: null }, ...prev]);
      toast.success("Course restored.");
    },
    [trashedCourses]
  );

  const handleConfirmDeleteCourse = useCallback((id: string) => {
    setDeleteTarget(id);
  }, []);

  const handlePermanentDelete = useCallback(
    async (id: string) => {
      const target = trashedCourses.find((c) => c.id === id);
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) {
        toast.error("Failed to permanently delete course.");
        return;
      }
      if (target?.builder_project_id) {
        await supabase
          .from("builder_projects")
          .delete()
          .eq("id", target.builder_project_id);
      }
      setTrashedCourses((prev) => prev.filter((c) => c.id !== id));
      setDeleteTarget(null);
      toast.success("Course permanently deleted.");
    },
    [trashedCourses]
  );

  const handleUnpublishCourse = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("courses")
      .update({
        status: "draft",
        published_at: null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", id);
    if (error) {
      toast.error("Failed to unpublish.");
      return;
    }
    setCourses((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, status: "draft", published_at: null }
          : c
      )
    );
    toast.success("Course unpublished.");
  }, []);

  const handlePublishCourse = useCallback(
    async (course: CourseItem) => {
      if (!course.builder_project_id) {
        toast.info("Open in studio to publish.");
        return;
      }
      navigate(`/studio/${course.builder_project_id}`);
    },
    [navigate]
  );

  const handleDuplicateProject = useCallback(
    async (course: CourseItem) => {
      if (!userId) return;
      try {
        const { data: proj, error } = await supabase
          .from("builder_projects")
          .insert({
            name: `${course.title} (Copy)`,
            user_id: userId,
          })
          .select("id")
          .single();
        if (error || !proj) throw error;

        // Duplicate course row
        const { data: origCourse } = await supabase
          .from("courses")
          .select("*")
          .eq("id", course.id)
          .single();

        if (origCourse) {
          const slug = `${origCourse.slug}-copy-${Date.now().toString(36)}`;
          await supabase.from("courses").insert({
            title: `${origCourse.title} (Copy)`,
            description: origCourse.description,
            curriculum: origCourse.curriculum,
            design_config: origCourse.design_config,
            layout_template: origCourse.layout_template,
            section_order: origCourse.section_order,
            page_sections: origCourse.page_sections,
            user_id: userId,
            builder_project_id: proj.id,
            slug,
            status: "draft",
            type: origCourse.type,
            instructor_name: origCourse.instructor_name,
            instructor_bio: origCourse.instructor_bio,
          } as any);
        }

        toast.success("Course duplicated!");
        // Reload courses
        const { data: refreshed } = await supabase
          .from("courses")
          .select(
            "id, title, description, status, thumbnail_url, curriculum, updated_at, deleted_at, builder_project_id, type, slug, subdomain, published_at, total_students, layout_template, design_config, tagline"
          )
          .eq("user_id", userId)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .limit(50);
        if (refreshed) setCourses(refreshed as CourseItem[]);
      } catch (err) {
        console.error("Duplicate error:", err);
        toast.error("Failed to duplicate course.");
      }
    },
    [userId]
  );

  const handleEditCourse = useCallback(
    (course: CourseItem) => {
      const pid = course.builder_project_id;
      if (pid) navigate(`/studio/${pid}`);
      else toast.info("No studio project linked.");
    },
    [navigate]
  );

  const handlePreviewCourse = useCallback(
    (course: CourseItem) => {
      if (course.subdomain) {
        window.open(`/course/${course.subdomain}`, "_blank");
      } else if (course.builder_project_id) {
        navigate(`/studio/${course.builder_project_id}`);
      }
    },
    [navigate]
  );

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/");
  }, [navigate]);

  // File attachments
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (attachments.length + files.length > 10) {
      toast.error("Maximum 10 attachments.");
      return;
    }
    const newAttachments: AttachmentItem[] = files.map((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      type: f.type,
      file: f,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && idea.trim()) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Sync guided fields into the main idea box in real time
  const buildGuidedPrompt = useCallback((q1: string, q2: string, q3: string) => {
    const parts = [
      q1.trim() && `Course about: ${q1.trim()}`,
      q2.trim() && `Target audience: ${q2.trim()}`,
      q3.trim() && `Transformation: ${q3.trim()}`,
    ].filter(Boolean).join(". ");
    setIdea(parts);
  }, []);

  const updateGuided = (field: 1 | 2 | 3, value: string) => {
    const next1 = field === 1 ? value : guidedQ1;
    const next2 = field === 2 ? value : guidedQ2;
    const next3 = field === 3 ? value : guidedQ3;
    if (field === 1) setGuidedQ1(value);
    if (field === 2) setGuidedQ2(value);
    if (field === 3) setGuidedQ3(value);
    buildGuidedPrompt(next1, next2, next3);
  };

  const visibleCourses = showAllCourses ? courses : courses.slice(0, 6);

  const sidebarProps: SidebarContentProps = {
    courses,
    trashedCourses,
    onNavigate: (path: string) => {
      setMobileSidebarOpen(false);
      navigate(path);
    },
    onRestoreCourse: handleRestoreCourse,
    onPermanentDelete: (id: string) => setDeleteTarget(id),
    onSignOut: handleSignOut,
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* ── Desktop Sidebar ───────────────────────────────── */}
      <aside className="hidden lg:flex w-[300px] shrink-0 border-r border-border flex-col h-screen sticky top-0">
        <SidebarInner {...sidebarProps} />
      </aside>

      {/* ── Mobile Sidebar via Sheet ──────────────────────── */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[300px]">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <SidebarInner {...sidebarProps} />
        </SheetContent>
      </Sheet>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between border-b border-border px-4 py-3 sticky top-0 z-20 bg-background/95 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <img
              src={excellionLogo}
              alt="Excellion"
              className="h-7 w-7 rounded-full"
            />
            <span className="font-semibold text-sm">Excellion</span>
          </div>
          <Button
            size="sm"
            className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs"
            onClick={() => {
              const textarea = document.querySelector('textarea');
              textarea?.focus();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            New Course
          </Button>
        </div>

        <div className="mx-auto w-full max-w-[960px] px-4 sm:px-8 py-10 sm:py-16 space-y-10">
          {/* ── Hero heading ──────────────────────────────── */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Let's build your next course
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto">
              Describe what you want. Excellion generates a full course you can
              edit, customize, and publish.
            </p>
          </div>

          {/* ── Input Card ─────────────────────────────── */}
          <Card className="border-border/60 bg-card">
            <CardContent className="p-0">
              {/* Guided mode toggle */}
              <div className="px-5 pt-4 pb-2">
                <button
                  onClick={() => setGuidedMode(!guidedMode)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5 font-medium"
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                  {guidedMode ? "Switch to freeform" : "Need help? Use guided mode"}
                </button>
              </div>

              {/* Guided questions */}
              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: guidedMode ? "300px" : "0px",
                  opacity: guidedMode ? 1 : 0,
                }}
              >
                <div className="px-5 pb-3 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">What's your course about?</label>
                    <Input
                      placeholder="e.g. 6-week fat loss program, booty building, macro tracking"
                      value={guidedQ1}
                      onChange={(e) => updateGuided(1, e.target.value)}
                      className="bg-muted/30 h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Who is it for?</label>
                    <Input
                      placeholder="e.g. busy moms, beginners, women over 40"
                      value={guidedQ2}
                      onChange={(e) => updateGuided(2, e.target.value)}
                      className="bg-muted/30 h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">What's the #1 transformation they'll experience?</label>
                    <Input
                      placeholder="e.g. lose 10 pounds, build a home workout habit, understand their macros"
                      value={guidedQ3}
                      onChange={(e) => updateGuided(3, e.target.value)}
                      className="bg-muted/30 h-9 text-sm"
                    />
                  </div>
                  <Separator />
                </div>
              </div>

              {/* Main textarea */}
              <Textarea
                placeholder="Describe your course idea in detail..."
                className="min-h-[120px] resize-none border-0 bg-transparent px-5 pt-3 pb-3 text-sm focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/60"
                value={idea}
                onChange={(e) => {
                  setIdea(e.target.value);
                  if (guidedMode) {
                    setGuidedQ1("");
                    setGuidedQ2("");
                    setGuidedQ3("");
                    setGuidedMode(false);
                  }
                }}
                onKeyDown={handleKeyDown}
              />

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-5 pb-2">
                  {attachments.map((a) => (
                    <Badge
                      key={a.id}
                      variant="secondary"
                      className="gap-1 pr-1 text-xs"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">{a.name}</span>
                      <button
                        onClick={() => removeAttachment(a.id)}
                        className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <Separator />

              {/* Bottom toolbar */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.doc,.docx,.txt,.csv,.json,.md"
                    onChange={handleFileSelect}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Attach files</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <Button
                  disabled={!idea.trim() || isGenerating}
                  onClick={() => handleGenerate()}
                  className="h-9 px-5 gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Generate</span>
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center pb-4">
                The more specific you are, the better your course will be.
              </p>
            </CardContent>
          </Card>

          {/* ── Quick prompts ─────────────────────────────── */}
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => setIdea(prompt.label)}
                className="flex items-center gap-2 rounded-full border border-border px-3.5 py-2 text-xs sm:text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground hover:border-primary/30"
              >
                <prompt.icon className="h-3.5 w-3.5" />
                {prompt.label}
              </button>
            ))}
          </div>

          {/* ── Your Courses ──────────────────────────────── */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : courses.length > 0 ? (
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Your Courses
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs"
                    onClick={() => {
                      const textarea = document.querySelector('textarea');
                      textarea?.focus();
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New Course
                  </Button>
                  {courses.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllCourses(!showAllCourses)}
                      className="text-xs text-muted-foreground"
                    >
                      {showAllCourses
                        ? "Show less"
                        : `View all (${courses.length})`}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    onEdit={handleEditCourse}
                    onPreview={handlePreviewCourse}
                    onDuplicate={handleDuplicateProject}
                    onPublish={handlePublishCourse}
                    onUnpublish={(c) => handleUnpublishCourse(c.id)}
                    onDelete={(c) => handleDeleteCourse(c.id)}
                    onShare={(c) => {
                      const url = `${window.location.origin}/course/${c.slug}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Link copied!");
                    }}
                  />
                ))}
              </div>
            </section>
          ) : (
            !isLoading && (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
                  <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    No courses yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Describe your idea above to get started.
                  </p>
                </div>
              </div>
            )
          )}
          {/* ── Trashed Courses ───────────────────────────── */}
          {trashedCourses.length > 0 && (
            <section className="space-y-4 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Trash2 className="h-4 w-4" />
                <h3 className="text-sm font-medium">
                  Recently Deleted ({trashedCourses.length})
                </h3>
              </div>
              <div className="space-y-2">
                {trashedCourses.slice(0, 5).map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 px-4 py-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <BookOpen className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm truncate text-muted-foreground">
                          {course.title}
                        </p>
                        {course.deleted_at && (
                          <p className="text-[10px] text-muted-foreground/60">
                            Deleted{" "}
                            {new Date(course.deleted_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleRestoreCourse(course.id)}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(course.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* ── Permanent Delete Dialog ────────────────────────── */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The course and all associated data
              will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handlePermanentDelete(deleteTarget)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Build Assist Dialog ────────────────────────────── */}
      <Dialog open={showBuildAssist} onOpenChange={setShowBuildAssist}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Build Assist
            </DialogTitle>
            <DialogDescription>
              Use your voice to describe your course idea. Our AI will help
              structure it.
            </DialogDescription>
          </DialogHeader>
          <VoiceBotPlaceholder onClose={() => setShowBuildAssist(false)} />
        </DialogContent>
      </Dialog>

      {/* ── Post-Publish Celebration Modal ──────────────────── */}
      <Dialog open={!!publishedCourse} onOpenChange={(o) => { if (!o) { setPublishedCourse(null); setLinkCopied(false); } }}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="text-5xl mb-2">🎉</div>
            <DialogTitle className="text-xl">Your course is live!</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {publishedCourse?.title} is now published and ready for students.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground break-all">
              <Globe className="h-4 w-4 shrink-0 text-primary" />
              <span className="flex-1 text-left">{publishedCourse ? `${window.location.origin}/course/${publishedCourse.slug}` : ""}</span>
            </div>
            <Button
              className="w-full gap-2"
              onClick={() => {
                if (publishedCourse) {
                  navigator.clipboard.writeText(`${window.location.origin}/course/${publishedCourse.slug}`);
                  setLinkCopied(true);
                  toast.success("Link copied!");
                  setTimeout(() => setLinkCopied(false), 2000);
                }
              }}
            >
              {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {linkCopied ? "Copied!" : "Copy Link"}
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => {
                if (publishedCourse) {
                  const url = `${window.location.origin}/course/${publishedCourse.slug}`;
                  const igUrl = `https://www.instagram.com/?url=${encodeURIComponent(url)}`;
                  window.open(igUrl, "_blank");
                }
              }}
            >
              <Instagram className="h-4 w-4" />
              Share to Instagram
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Page wrapper with Auth Guard ─────────────────────────────

const SecretBuilderHub = () => {
  const { user, loading } = useAuth();
  const ALLOWED_EMAIL = "excellionai@gmail.com";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.email !== ALLOWED_EMAIL) {
    return <Navigate to="/#waitlist" replace />;
  }

  return <HubContent />;
};

export default SecretBuilderHub;
