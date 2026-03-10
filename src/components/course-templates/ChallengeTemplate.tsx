import {
  Flame,
  Check,
  ChevronRight,
  Calendar,
  Target,
  Trophy,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExtendedCourse, LessonContent } from "@/types/course-pages";

interface ChallengeTemplateProps {
  course: ExtendedCourse;
  isPreview?: boolean;
  onUpdate?: (course: ExtendedCourse) => void;
  onEnroll?: () => void;
  isEnrolled?: boolean;
  isEnrolling?: boolean;
}

const ChallengeTemplate = ({
  course,
  isPreview = false,
  onEnroll,
  isEnrolled = false,
  isEnrolling = false,
}: ChallengeTemplateProps) => {
  // Flatten lessons as sequential days
  const days: { day: number; lesson: LessonContent; moduleName: string }[] = [];
  course.modules.forEach((mod) => {
    mod.lessons.forEach((lesson) => {
      days.push({ day: days.length + 1, lesson, moduleName: mod.title });
    });
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section
        className="py-16 px-4"
        style={{
          background: "linear-gradient(135deg, #ea580c22 0%, #dc262622 50%, transparent 80%)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
            <Flame className="h-3 w-3 mr-1" /> Challenge
          </Badge>
          <h1 className="text-4xl font-bold mb-3 text-foreground">{course.title}</h1>
          {course.tagline && <p className="text-xl text-muted-foreground mb-4">{course.tagline}</p>}
          {course.description && <p className="text-muted-foreground max-w-2xl mb-6">{course.description}</p>}

          <div className="flex flex-wrap gap-3 mb-8">
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <Calendar className="h-3.5 w-3.5" /> {days.length} Days
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <Target className="h-3.5 w-3.5" /> {days.length} Daily Tasks
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <Trophy className="h-3.5 w-3.5" /> Completion Certificate
            </Badge>
          </div>

          {!isPreview && (
            <Button size="lg" onClick={onEnroll} disabled={isEnrolling} className="bg-orange-600 hover:bg-orange-700 text-white">
              {isEnrolling ? "Joining…" : isEnrolled ? "Continue Challenge" : "Start Challenge"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-10">
        {/* Progress tracker */}
        {isEnrolled && !isPreview && (
          <Card className="border-orange-500/20 bg-orange-950/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="font-semibold text-foreground">Day 1 of {days.length}</span>
              </div>
              <Progress value={Math.round((1 / days.length) * 100)} className="h-2" />
            </CardContent>
          </Card>
        )}

        {/* Daily schedule */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Daily Schedule</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {days.map(({ day, lesson, moduleName }) => (
              <Card key={day} className="border-border/50 hover:border-orange-500/30 transition-colors">
                <CardContent className="pt-5">
                  <Badge variant="outline" className="mb-2 text-orange-400 border-orange-500/30 text-xs">
                    Day {day}
                  </Badge>
                  <h3 className="font-medium text-foreground text-sm mb-1">{lesson.title}</h3>
                  <p className="text-xs text-muted-foreground">{moduleName}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Outcomes */}
        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-foreground">By the End</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {course.learningOutcomes.map((o, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 shrink-0 text-orange-500" />
                  <span className="text-sm text-foreground">{o}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        {!isPreview && (
          <div className="text-center py-8">
            <Button size="lg" onClick={onEnroll} disabled={isEnrolling} className="bg-orange-600 hover:bg-orange-700 text-white">
              {isEnrolling ? "Joining…" : isEnrolled ? "Continue Challenge" : "Start Challenge"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeTemplate;
