import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Play,
  FileText,
  HelpCircle,
  ClipboardCheck,
  Clock,
  Check,
  ChevronRight,
  Monitor,
  Download,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ExtendedCourse,
  LessonContent,
  ModuleWithContent,
  calculateModuleDuration,
} from "@/types/course-pages";
import { cn } from "@/lib/utils";

interface CourseStudentViewProps {
  course: ExtendedCourse;
  selectedModuleId: string | null;
  selectedLessonId: string | null;
  onSelectModule: (moduleId: string | null) => void;
  onSelectLesson: (moduleId: string, lessonId: string) => void;
  onBack: () => void;
}

const lessonIcon = (type: LessonContent["type"]) => {
  switch (type) {
    case "video":
    case "text_video":
      return <Play className="h-4 w-4" />;
    case "quiz":
      return <HelpCircle className="h-4 w-4" />;
    case "assignment":
      return <ClipboardCheck className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

const CourseStudentView = ({
  course,
  selectedModuleId,
  selectedLessonId,
  onSelectModule,
  onSelectLesson,
  onBack,
}: CourseStudentViewProps) => {
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const currentModule = course.modules.find((m) => m.id === selectedModuleId);
  const currentLesson = currentModule?.lessons.find((l) => l.id === selectedLessonId);
  const currentModuleIdx = course.modules.findIndex((m) => m.id === selectedModuleId);

  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons.size / totalLessons) * 100) : 0;

  const markComplete = (lessonId: string) => {
    setCompletedLessons((prev) => new Set(prev).add(lessonId));
  };

  // ── View 3: Lesson View ──
  if (currentModule && currentLesson) {
    const lessonIdx = currentModule.lessons.findIndex((l) => l.id === currentLesson.id);
    const prevLesson = lessonIdx > 0 ? currentModule.lessons[lessonIdx - 1] : null;
    const nextLesson = lessonIdx < currentModule.lessons.length - 1 ? currentModule.lessons[lessonIdx + 1] : null;

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="flex h-[calc(100vh-4rem)]">
          {/* Sidebar */}
          <ScrollArea className="w-64 border-r border-border shrink-0">
            <div className="p-3">
              <Button variant="ghost" size="sm" className="mb-2 w-full justify-start" onClick={() => onSelectModule(currentModule.id)}>
                <ArrowLeft className="h-3 w-3 mr-1" /> {currentModule.title}
              </Button>
              <div className="space-y-0.5">
                {currentModule.lessons.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => onSelectLesson(currentModule.id, l.id)}
                    className={cn(
                      "w-full flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded transition-colors",
                      l.id === currentLesson.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {completedLessons.has(l.id) ? (
                      <Check className="h-3 w-3 shrink-0 text-emerald-500" />
                    ) : (
                      lessonIcon(l.type)
                    )}
                    <span className="truncate flex-1">{l.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </ScrollArea>

          {/* Main */}
          <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto p-6 space-y-6">
              <div>
                <Badge variant="outline" className="mb-2 text-xs">{currentLesson.type}</Badge>
                <h1 className="text-2xl font-bold text-foreground">{currentLesson.title}</h1>
                {currentLesson.duration && (
                  <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {currentLesson.duration}
                  </p>
                )}
              </div>

              {/* Type-specific content */}
              {(currentLesson.type === "video" || currentLesson.type === "text_video") && (
                <Card className="border-border/50">
                  <div className="aspect-video bg-muted/30 flex items-center justify-center rounded-t-lg">
                    <Monitor className="h-10 w-10 text-muted-foreground/40" />
                  </div>
                  <CardContent className="pt-4 space-y-3">
                    {currentLesson.description && <p className="text-sm text-muted-foreground">{currentLesson.description}</p>}
                    {currentLesson.resources && currentLesson.resources.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-foreground mb-2">Resources</p>
                        {currentLesson.resources.map((r, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Download className="h-3 w-3" /> {r.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {currentLesson.type === "text" && (
                <Card className="border-border/50">
                  <CardContent className="pt-4 space-y-4">
                    <p className="text-xs text-muted-foreground">~{Math.ceil((currentLesson.content_markdown?.length ?? 500) / 1000)} min read</p>
                    <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {currentLesson.content_markdown || currentLesson.description || "Lesson content goes here…"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Key Takeaways</p>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li className="flex items-start gap-1.5"><Check className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500" />Core concepts covered</li>
                        <li className="flex items-start gap-1.5"><Check className="h-3 w-3 mt-0.5 shrink-0 text-emerald-500" />Practical application ready</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {currentLesson.type === "quiz" && (
                <Card className="border-border/50">
                  <CardContent className="pt-4 space-y-4 text-center">
                    <HelpCircle className="h-10 w-10 text-primary mx-auto" />
                    <h3 className="text-lg font-semibold text-foreground">Knowledge Check</h3>
                    <p className="text-sm text-muted-foreground">
                      {currentLesson.quiz_questions?.length ?? 0} questions · Pass score: {currentLesson.passing_score ?? 70}%
                    </p>
                    <Button>Start Quiz</Button>
                  </CardContent>
                </Card>
              )}

              {currentLesson.type === "assignment" && (
                <Card className="border-border/50">
                  <CardContent className="pt-4 space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Assignment</h3>
                    <p className="text-sm text-muted-foreground">{currentLesson.assignment_brief || currentLesson.description || "Complete the assignment."}</p>
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Requirements</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Follow the assignment brief</li>
                        <li>• Submit before the deadline</li>
                      </ul>
                    </div>
                    <Button>Submit Assignment</Button>
                  </CardContent>
                </Card>
              )}

              {/* Bottom nav */}
              <Separator />
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!prevLesson}
                  onClick={() => prevLesson && onSelectLesson(currentModule.id, prevLesson.id)}
                >
                  <ArrowLeft className="h-3 w-3 mr-1" /> Previous
                </Button>
                <Button
                  size="sm"
                  variant={completedLessons.has(currentLesson.id) ? "secondary" : "default"}
                  onClick={() => markComplete(currentLesson.id)}
                >
                  {completedLessons.has(currentLesson.id) ? (
                    <><Check className="h-3 w-3 mr-1" /> Completed</>
                  ) : (
                    "Mark Complete"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!nextLesson}
                  onClick={() => nextLesson && onSelectLesson(currentModule.id, nextLesson.id)}
                >
                  Next <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // ── View 2: Module Overview ──
  if (currentModule) {
    const prevModule = currentModuleIdx > 0 ? course.modules[currentModuleIdx - 1] : null;
    const nextModule = currentModuleIdx < course.modules.length - 1 ? course.modules[currentModuleIdx + 1] : null;
    const duration = calculateModuleDuration(currentModule.lessons);

    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Button variant="ghost" size="sm" onClick={() => onSelectModule(null)}>
            <ArrowLeft className="h-3 w-3 mr-1" /> Back to Course
          </Button>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{currentModule.title}</h1>
              {currentModule.is_first && <Badge variant="secondary">Start Here</Badge>}
              {currentModule.is_last && <Badge variant="secondary">Final Module</Badge>}
            </div>
            <div className="flex gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {currentModule.lessons.length} lessons</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {duration}</span>
            </div>
          </div>

          {currentModule.description && (
            <p className="text-sm text-muted-foreground">{currentModule.description}</p>
          )}

          <div className="space-y-2">
            {currentModule.lessons.map((lesson) => (
              <Card
                key={lesson.id}
                className="border-border/40 hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => onSelectLesson(currentModule.id, lesson.id)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="text-muted-foreground">{lessonIcon(lesson.type)}</div>
                  <span className="flex-1 text-sm text-foreground">{lesson.title}</span>
                  {lesson.duration && (
                    <Badge variant="outline" className="text-xs">{lesson.duration}</Badge>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              size="sm"
              disabled={!prevModule}
              onClick={() => prevModule && onSelectModule(prevModule.id)}
            >
              <ArrowLeft className="h-3 w-3 mr-1" /> Previous Module
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!nextModule}
              onClick={() => nextModule && onSelectModule(nextModule.id)}
            >
              Next Module <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ── View 1: Course Overview ──
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">{course.title}</h1>
          {course.description && <p className="text-sm text-muted-foreground">{course.description}</p>}
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <div className="space-y-3">
          {course.modules.map((mod, idx) => (
            <Card
              key={mod.id}
              className="border-border/40 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => onSelectModule(mod.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{mod.title}</h3>
                      {idx === 0 && <Badge variant="secondary" className="text-[10px]">Start Here</Badge>}
                      {idx === course.modules.length - 1 && <Badge variant="secondary" className="text-[10px]">Final Module</Badge>}
                    </div>
                    {mod.description && <p className="text-xs text-muted-foreground line-clamp-2">{mod.description}</p>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 ml-3">
                    <BookOpen className="h-3 w-3" /> {mod.lessons.length}
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseStudentView;
