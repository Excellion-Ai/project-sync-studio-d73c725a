import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  Plus,
  MoreVertical,
  Trash2,
  Copy,
  EyeOff,
  Pencil,
  RotateCcw,
  BookOpen,
  LayoutGrid,
  Settings,
  Moon,
  Sun,
  Search,
  CreditCard,
  Loader2,
  Clock,
  ChevronDown,
  ChevronRight,
  Paperclip,
  X,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
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

// ── Quick prompts ────────────────────────────────────────────

const QUICK_PROMPTS = [
  "Build a 6-week Python bootcamp with projects",
  "Create a personal branding masterclass",
  "Design a UX certification program",
  "Make a 30-day fitness challenge",
];

// ── Nav items ────────────────────────────────────────────────

const NAV_ITEMS = [
  { title: "Dashboard", icon: LayoutGrid, path: "/secret-builder-hub" },
  { title: "Courses", icon: BookOpen, path: "/secret-builder-hub" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

// ── Inner content (needs sidebar context) ────────────────────

function HubContent() {
  const navigate = useNavigate();
  const { state: sidebarState } = useSidebar();
  const collapsed = sidebarState === "collapsed";

  const [idea, setIdea] = useState("");
  const [projects, setProjects] = useState<BuilderProject[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [trashedCourses, setTrashedCourses] = useState<CourseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [showAllCourses, setShowAllCourses] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const stored = localStorage.getItem("builder-dark-mode");
    return stored ? stored === "true" : true;
  });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // ── Dark mode ──────────────────────────────────────────────

  useEffect(() => {
    localStorage.setItem("builder-dark-mode", String(isDarkMode));
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // ── Load data ──────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);
      setUserEmail(user.email ?? null);

      const [projRes, activeRes, trashedRes] = await Promise.all([
        supabase
          .from("builder_projects")
          .select("id, name, created_at, updated_at")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(20),
        supabase
          .from("courses")
          .select(
            "id, title, description, status, thumbnail_url, curriculum, updated_at, deleted_at, builder_project_id, type"
          )
          .eq("user_id", user.id)
          .is("deleted_at", null)
          .order("updated_at", { ascending: false })
          .limit(50),
        supabase
          .from("courses")
          .select(
            "id, title, description, status, thumbnail_url, curriculum, updated_at, deleted_at, builder_project_id, type"
          )
          .eq("user_id", user.id)
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
  }, [navigate]);

  // ── Handlers ───────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    if (!idea.trim() || !userId) return;

    setIsGenerating(true);
    try {
      const { data: proj, error } = await supabase
        .from("builder_projects")
        .insert({ name: idea.slice(0, 80), user_id: userId })
        .select("id")
        .single();

      if (error || !proj) throw error;

      localStorage.setItem("builder-initial-idea", idea);
      navigate(`/studio/${proj.id}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to create project.");
    } finally {
      setIsGenerating(false);
    }
  }, [idea, userId, navigate]);

  const handleDeleteCourse = useCallback(async (id: string) => {
    const { error } = await supabase
      .from("courses")
      .update({ deleted_at: new Date().toISOString() } as any)
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete course.");
      return;
    }

    setCourses((prev) => prev.filter((c) => c.id !== id));
    const deleted = courses.find((c) => c.id === id);
    if (deleted) {
      setTrashedCourses((prev) => [
        { ...deleted, deleted_at: new Date().toISOString() },
        ...prev,
      ]);
    }
    toast.success("Course moved to trash.");
  }, [courses]);

  const handleRestoreCourse = useCallback(async (id: string) => {
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
    if (restored) {
      setCourses((prev) => [{ ...restored, deleted_at: null }, ...prev]);
    }
    toast.success("Course restored.");
  }, [trashedCourses]);

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
        c.id === id ? { ...c, status: "draft" } : c
      )
    );
    toast.success("Course unpublished.");
  }, []);

  const addAttachment = useCallback(() => {
    if (attachments.length >= 10) {
      toast.error("Maximum 10 attachments allowed.");
      return;
    }
    const item: AttachmentItem = {
      id: crypto.randomUUID(),
      name: `file-${attachments.length + 1}.pdf`,
      type: "application/pdf",
    };
    setAttachments((prev) => [...prev, item]);
  }, [attachments]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }, []);

  // ── Helpers ────────────────────────────────────────────────

  const getModuleCount = (curriculum: any) => {
    if (Array.isArray(curriculum)) return curriculum.length;
    return 0;
  };

  const getLessonCount = (curriculum: any) => {
    if (!Array.isArray(curriculum)) return 0;
    return curriculum.reduce(
      (sum: number, mod: any) =>
        sum + (Array.isArray(mod?.lessons) ? mod.lessons.length : 0),
      0
    );
  };

  const visibleCourses = showAllCourses ? courses : courses.slice(0, 6);
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "U";

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex w-full">
      {/* ── Sidebar ──────────────────────────────────────── */}
      <Sidebar collapsible="icon">
        <SidebarContent>
          {/* Workspace header */}
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && <span className="truncate text-xs">Workspace</span>}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      onClick={() => navigate(item.path)}
                      className="hover:bg-muted/50"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <Separator />

          {/* Course list in sidebar */}
          {!collapsed && (
            <SidebarGroup>
              <SidebarGroupLabel>Your Courses</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {courses.slice(0, 8).map((c) => (
                    <SidebarMenuItem key={c.id}>
                      <SidebarMenuButton
                        onClick={() => {
                          const pid = c.builder_project_id;
                          if (pid) navigate(`/studio/${pid}`);
                          else toast.info("No project linked to this course.");
                        }}
                        className="hover:bg-muted/50 text-xs truncate"
                      >
                        <BookOpen className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{c.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {/* Trash */}
          {!collapsed && trashedCourses.length > 0 && (
            <SidebarGroup>
              <Collapsible>
                <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Trash ({trashedCourses.length})</span>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenu>
                    {trashedCourses.slice(0, 5).map((c) => (
                      <SidebarMenuItem key={c.id}>
                        <SidebarMenuButton className="text-xs text-muted-foreground truncate">
                          <span className="truncate">{c.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </CollapsibleContent>
              </Collapsible>
            </SidebarGroup>
          )}
        </SidebarContent>
      </Sidebar>

      {/* ── Main ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-14 shrink-0 flex items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="mr-1" />
            <span className="text-sm font-semibold">Course Builder</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Search className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </header>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="mx-auto w-full max-w-4xl px-6 py-10 space-y-10">
            {/* Hero */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">
                Let's build your next course
              </h1>
              <p className="text-muted-foreground">
                Describe your idea and AI will generate a complete course for
                you.
              </p>
            </div>

            {/* Input card */}
            <Card className="border-border/60">
              <CardContent className="p-4 space-y-3">
                <Textarea
                  placeholder="Describe your course idea... e.g. 'A 6-week Python bootcamp covering basics to web development with weekly projects'"
                  className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 shadow-none"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                />

                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {attachments.map((a) => (
                      <Badge
                        key={a.id}
                        variant="secondary"
                        className="gap-1 pr-1 text-xs"
                      >
                        <FileText className="h-3 w-3" />
                        {a.name}
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

                <div className="flex items-center justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={addAttachment}
                  >
                    <Paperclip className="mr-1 h-3.5 w-3.5" />
                    Attach
                  </Button>
                  <Button
                    size="sm"
                    disabled={!idea.trim() || isGenerating}
                    onClick={handleGenerate}
                  >
                    {isGenerating ? (
                      <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1 h-3.5 w-3.5" />
                    )}
                    Build with AI
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick prompts */}
            <div className="flex flex-wrap gap-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setIdea(prompt)}
                  className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Stripe Connect banner */}
            <Card className="border-dashed border-border/60 bg-muted/20">
              <CardContent className="flex items-center gap-4 p-4">
                <CreditCard className="h-8 w-8 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Accept payments for your courses</p>
                  <p className="text-xs text-muted-foreground">
                    Connect Stripe to sell courses and receive payouts directly.
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Connect Stripe
                </Button>
              </CardContent>
            </Card>

            {/* Your Courses */}
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : courses.length > 0 ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Your Courses</h2>
                  {courses.length > 6 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllCourses(!showAllCourses)}
                      className="text-xs"
                    >
                      {showAllCourses ? "Show less" : `View all (${courses.length})`}
                    </Button>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleCourses.map((course) => (
                    <Card
                      key={course.id}
                      className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-md border-border/60"
                      onClick={() => {
                        const pid = course.builder_project_id;
                        if (pid) navigate(`/studio/${pid}`);
                        else navigate(`/secret-builder`);
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="h-32 bg-muted/40 relative overflow-hidden">
                        {course.thumbnail_url ? (
                          <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <BookOpen className="h-8 w-8 text-muted-foreground/40" />
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
                          <h3 className="text-sm font-medium leading-tight line-clamp-2">
                            {course.title}
                          </h3>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              asChild
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenuItem
                                onClick={() => {
                                  const pid = course.builder_project_id;
                                  if (pid) navigate(`/studio/${pid}`);
                                }}
                              >
                                <Pencil className="mr-2 h-3.5 w-3.5" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toast.info("Duplicate coming soon.")
                                }
                              >
                                <Copy className="mr-2 h-3.5 w-3.5" />
                                Duplicate
                              </DropdownMenuItem>
                              {course.status === "published" && (
                                <DropdownMenuItem
                                  onClick={() => handleUnpublishCourse(course.id)}
                                >
                                  <EyeOff className="mr-2 h-3.5 w-3.5" />
                                  Unpublish
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteCourse(course.id)}
                              >
                                <Trash2 className="mr-2 h-3.5 w-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>
                            {getModuleCount(course.curriculum)} modules
                          </span>
                          <span>
                            {getLessonCount(course.curriculum)} lessons
                          </span>
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

            {/* Trash section */}
            {trashedCourses.length > 0 && (
              <Collapsible open={showTrash} onOpenChange={setShowTrash}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                  {showTrash ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Trash2 className="h-4 w-4" />
                  Trash ({trashedCourses.length})
                </CollapsibleTrigger>

                <CollapsibleContent className="mt-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Courses in trash are permanently deleted after 30 days.
                  </p>

                  <div className="space-y-2">
                    {trashedCourses.map((course) => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between rounded-md border border-border/60 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {course.title}
                          </p>
                          {course.deleted_at && (
                            <p className="text-[10px] text-muted-foreground">
                              Deleted{" "}
                              {new Date(course.deleted_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreCourse(course.id)}
                          >
                            <RotateCcw className="mr-1 h-3.5 w-3.5" />
                            Restore
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(course.id)}
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Delete Forever
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Permanent delete confirmation */}
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
    </div>
  );
}

// ── Page wrapper with SidebarProvider ─────────────────────────

const SecretBuilderHub = () => (
  <SidebarProvider>
    <HubContent />
  </SidebarProvider>
);

export default SecretBuilderHub;
