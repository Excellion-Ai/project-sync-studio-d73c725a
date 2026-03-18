import { useState, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
}

interface AttachmentItem {
  id: string;
  name: string;
  type: string;
}

// ── Quick prompts with icons ─────────────────────────────────

const QUICK_PROMPTS = [
  { label: "Beginner coding bootcamp", icon: GraduationCap },
  { label: "Fitness coaching program", icon: Dumbbell },
  { label: "Online cooking class", icon: ChefHat },
  { label: "Language learning course", icon: Languages },
  { label: "Business coaching program", icon: Briefcase },
];

// ── Sidebar nav items ────────────────────────────────────────

const NAV_ITEMS = [
  { title: "Excellion Homepage", icon: ExternalLink, path: "/" },
  { title: "Expert Support", icon: Headphones, path: "/settings/support" },
  { title: "Analytics", icon: BarChart3, path: "/dashboard/analytics" },
  { title: "Resources", icon: BookOpenCheck, path: "/courses" },
];

// ── Inner content ────────────────────────────────────────────

function HubContent() {
  const navigate = useNavigate();

  const [idea, setIdea] = useState(() => localStorage.getItem("builder-initial-idea") || "");
  const [autoTriggered, setAutoTriggered] = useState(false);
  const [projects, setProjects] = useState<BuilderProject[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [trashedCourses, setTrashedCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [trashOpen, setTrashOpen] = useState(false);

  // ── Load data ──────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      setUserId(user.id);

      const [projRes, activeRes, trashedRes] = await Promise.all([
        supabase.from("builder_projects").select("id, name, created_at, updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(20),
        supabase.from("courses").select("id, title, description, status, thumbnail_url, curriculum, updated_at, deleted_at, builder_project_id, type").eq("user_id", user.id).is("deleted_at", null).order("updated_at", { ascending: false }).limit(50),
        supabase.from("courses").select("id, title, description, status, thumbnail_url, curriculum, updated_at, deleted_at, builder_project_id, type").eq("user_id", user.id).not("deleted_at", "is", null).order("deleted_at", { ascending: false }).limit(50),
      ]);

      if (projRes.data) setProjects(projRes.data);
      if (activeRes.data) setCourses(activeRes.data as CourseItem[]);
      if (trashedRes.data) setTrashedCourses(trashedRes.data as CourseItem[]);
      setIsLoading(false);
    };
    load();
  }, [navigate]);

  // ── Handlers ───────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!idea.trim() || !userId) return;
    setIsGenerating(true);
    try {
      const { data: proj, error } = await supabase.from("builder_projects").insert({ name: idea.slice(0, 80), user_id: userId }).select("id").single();
      if (error || !proj) throw error;
      localStorage.setItem("builder-initial-idea", idea);
      navigate(`/studio/${proj.id}`, { state: { initialIdea: idea } });
    } catch (err) {
      console.error(err);
      toast.error("Failed to create project.");
    } finally {
      setIsGenerating(false);
    }
  }, [idea, userId, navigate]);

  // Auto-trigger generation if idea came from home page
  useEffect(() => {
    if (autoTriggered || !idea.trim() || !userId || isLoading || isGenerating) return;
    const fromHome = localStorage.getItem("builder-initial-idea");
    if (fromHome) {
      setAutoTriggered(true);
      localStorage.removeItem("builder-initial-idea");
      handleGenerate();
    }
  }, [idea, userId, isLoading, isGenerating, autoTriggered, handleGenerate]);

  const handleDeleteCourse = useCallback(async (id: string) => {
    const { error } = await supabase.from("courses").update({ deleted_at: new Date().toISOString() } as any).eq("id", id);
    if (error) { toast.error("Failed to delete course."); return; }
    setCourses((prev) => prev.filter((c) => c.id !== id));
    const deleted = courses.find((c) => c.id === id);
    if (deleted) setTrashedCourses((prev) => [{ ...deleted, deleted_at: new Date().toISOString() }, ...prev]);
    toast.success("Course moved to trash.");
  }, [courses]);

  const handleRestoreCourse = useCallback(async (id: string) => {
    const { error } = await supabase.from("courses").update({ deleted_at: null } as any).eq("id", id);
    if (error) { toast.error("Failed to restore course."); return; }
    const restored = trashedCourses.find((c) => c.id === id);
    setTrashedCourses((prev) => prev.filter((c) => c.id !== id));
    if (restored) setCourses((prev) => [{ ...restored, deleted_at: null }, ...prev]);
    toast.success("Course restored.");
  }, [trashedCourses]);

  const handlePermanentDelete = useCallback(async (id: string) => {
    const target = trashedCourses.find((c) => c.id === id);
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) { toast.error("Failed to permanently delete course."); return; }
    if (target?.builder_project_id) await supabase.from("builder_projects").delete().eq("id", target.builder_project_id);
    setTrashedCourses((prev) => prev.filter((c) => c.id !== id));
    setDeleteTarget(null);
    toast.success("Course permanently deleted.");
  }, [trashedCourses]);

  const handleUnpublishCourse = useCallback(async (id: string) => {
    const { error } = await supabase.from("courses").update({ status: "draft", published_at: null, updated_at: new Date().toISOString() } as any).eq("id", id);
    if (error) { toast.error("Failed to unpublish."); return; }
    setCourses((prev) => prev.map((c) => c.id === id ? { ...c, status: "draft" } : c));
    toast.success("Course unpublished.");
  }, []);

  const addAttachment = useCallback(() => {
    if (attachments.length >= 10) { toast.error("Maximum 10 attachments allowed."); return; }
    const item: AttachmentItem = { id: crypto.randomUUID(), name: `file-${attachments.length + 1}.pdf`, type: "application/pdf" };
    setAttachments((prev) => [...prev, item]);
  }, [attachments]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ── Helpers ────────────────────────────────────────────────

  const getModuleCount = (curriculum: any) => Array.isArray(curriculum) ? curriculum.length : 0;
  const getLessonCount = (curriculum: any) => {
    if (!Array.isArray(curriculum)) return 0;
    return curriculum.reduce((sum: number, mod: any) => sum + (Array.isArray(mod?.lessons) ? mod.lessons.length : 0), 0);
  };

  const visibleCourses = showAllCourses ? courses : courses.slice(0, 6);

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <aside className="w-[300px] shrink-0 border-r border-border flex flex-col h-screen sticky top-0 bg-[hsl(0_0%_3%)]">
        {/* Brand */}
        <div className="p-5 pb-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={excellionLogo} alt="Excellion" className="h-10 w-10 rounded-full object-cover" />
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground">Excellion</p>
              <p className="text-xs text-muted-foreground">Builder</p>
            </div>
          </button>
        </div>

        {/* Settings collapsible */}
        <div className="px-3">
          <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm text-foreground hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <span>Settings</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", settingsOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-1 space-y-0.5 pl-2">
              {["Profile", "Billing", "Notifications", "Workspace"].map((item) => (
                <button
                  key={item}
                  onClick={() => navigate(`/settings/${item.toLowerCase()}`)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  {item}
                </button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Search */}
        <div className="px-3 mt-2">
          <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <Search className="h-4 w-4" />
            <span>Search</span>
            <kbd className="ml-auto rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">⌘K</kbd>
          </button>
        </div>

        <Separator className="my-3" />

        {/* Nav links */}
        <nav className="px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </button>
          ))}
        </nav>

        <Separator className="my-3" />

        {/* Courses Folder */}
        <div className="px-3 flex-1 min-h-0">
          <Collapsible open={coursesOpen} onOpenChange={setCoursesOpen}>
            <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2.5">
                <FolderOpen className="h-4 w-4" />
                <span>Courses Folder</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", coursesOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ScrollArea className="max-h-40 mt-1">
                <div className="space-y-0.5 pl-2">
                  {courses.slice(0, 10).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        const pid = c.builder_project_id;
                        if (pid) navigate(`/studio/${pid}`);
                        else toast.info("No project linked.");
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors truncate"
                    >
                      <BookOpen className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{c.title}</span>
                    </button>
                  ))}
                  {courses.length === 0 && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">No courses yet</p>
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
                {trashedCourses.length > 0 && (
                  <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium">{trashedCourses.length}</span>
                )}
              </div>
              <ChevronDown className={cn("h-4 w-4 transition-transform", trashOpen && "rotate-180")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-0.5 pl-2 mt-1">
                {trashedCourses.slice(0, 5).map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-md px-3 py-1.5 text-sm text-muted-foreground group">
                    <span className="truncate text-xs">{c.title}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleRestoreCourse(c.id)} className="text-[10px] hover:text-foreground">Restore</button>
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Upgrade to Pro */}
        <div className="p-3 mt-auto border-t border-border">
          <button
            onClick={() => navigate("/billing")}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Upgrade to Pro</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[900px] px-8 py-16 space-y-10">
          {/* Hero heading */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Let's build your next course
            </h1>
            <p className="text-muted-foreground text-base max-w-lg mx-auto">
              Describe what you want. Excellion generates a full course you can edit and publish.
            </p>
          </div>

          {/* Input card */}
          <Card className="border-border/60 bg-card">
            <CardContent className="p-0">
              <Textarea
                placeholder="Describe your course idea..."
                className="min-h-[140px] resize-none border-0 bg-transparent px-5 pt-5 pb-3 text-sm focus-visible:ring-0 shadow-none placeholder:text-muted-foreground/60"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />

              {/* Attachments */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-5 pb-2">
                  {attachments.map((a) => (
                    <Badge key={a.id} variant="secondary" className="gap-1 pr-1 text-xs">
                      <FileText className="h-3 w-3" />
                      {a.name}
                      <button onClick={() => removeAttachment(a.id)} className="ml-0.5 rounded-sm hover:bg-muted-foreground/20 p-0.5">
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
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={addAttachment}>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-foreground gap-1.5">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">Build Assist</span>
                  </Button>
                </div>
                <Button
                  disabled={!idea.trim() || isGenerating}
                  onClick={handleGenerate}
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
            </CardContent>
          </Card>

          {/* Quick prompts */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt.label}
                onClick={() => setIdea(prompt.label)}
                className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground hover:border-primary/30"
              >
                <prompt.icon className="h-4 w-4" />
                {prompt.label}
              </button>
            ))}
          </div>

          {/* Your Courses */}
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : courses.length > 0 ? (
            <section className="space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Your Courses</h2>
                {courses.length > 6 && (
                  <Button variant="ghost" size="sm" onClick={() => setShowAllCourses(!showAllCourses)} className="text-xs text-muted-foreground">
                    {showAllCourses ? "Show less" : `View all (${courses.length})`}
                  </Button>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleCourses.map((course) => (
                  <Card
                    key={course.id}
                    className="group cursor-pointer overflow-hidden transition-all hover:shadow-[var(--shadow-glow-sm)] border-border/60 bg-card"
                    onClick={() => {
                      const pid = course.builder_project_id;
                      if (pid) navigate(`/studio/${pid}`);
                      else navigate(`/secret-builder`);
                    }}
                  >
                    <div className="h-32 bg-muted/30 relative overflow-hidden">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <BookOpen className="h-8 w-8 text-muted-foreground/30" />
                        </div>
                      )}
                      <Badge
                        variant={course.status === "published" ? "default" : "secondary"}
                        className="absolute top-2 left-2 text-[10px]"
                      >
                        {course.status ?? "draft"}
                      </Badge>
                    </div>

                    <CardContent className="p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-medium leading-tight line-clamp-2">{course.title}</h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem onClick={() => { const pid = course.builder_project_id; if (pid) navigate(`/studio/${pid}`); }}>
                              <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info("Duplicate coming soon.")}>
                              <Copy className="mr-2 h-3.5 w-3.5" /> Duplicate
                            </DropdownMenuItem>
                            {course.status === "published" && (
                              <DropdownMenuItem onClick={() => handleUnpublishCourse(course.id)}>
                                <EyeOff className="mr-2 h-3.5 w-3.5" /> Unpublish
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteCourse(course.id)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{getModuleCount(course.curriculum)} modules</span>
                        <span>{getLessonCount(course.curriculum)} lessons</span>
                      </div>
                      {course.updated_at && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(course.updated_at).toLocaleDateString()}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No courses yet. Describe your idea above to get started!
            </div>
          )}
        </div>
      </main>

      {/* Permanent delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The course and all associated data will be permanently removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteTarget && handlePermanentDelete(deleteTarget)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Forever</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── Page wrapper with Auth Guard ─────────────────────────────

const SecretBuilderHub = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setAuthChecked(true);
    });
  }, []);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/#waitlist" replace />;

  return <HubContent />;
};

export default SecretBuilderHub;
