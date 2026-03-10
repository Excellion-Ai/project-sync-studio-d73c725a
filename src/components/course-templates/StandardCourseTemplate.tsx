import { useState } from "react";
import {
  Clock,
  BookOpen,
  GraduationCap,
  Check,
  Users,
  ChevronRight,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ExtendedCourse,
  LessonContent,
  getLayoutStyleConfig,
  formatSectionNumber,
} from "@/types/course-pages";

interface StandardCourseTemplateProps {
  course: ExtendedCourse;
  isPreview?: boolean;
  onUpdate?: (course: ExtendedCourse) => void;
  onEnroll?: () => void;
  isEnrolled?: boolean;
  isEnrolling?: boolean;
}

const lessonTypeIcon = (type: LessonContent["type"]) => {
  switch (type) {
    case "video":
    case "text_video":
      return <PlayCircle className="h-4 w-4 text-muted-foreground" />;
    case "quiz":
      return <HelpCircle className="h-4 w-4 text-muted-foreground" />;
    case "assignment":
      return <ClipboardList className="h-4 w-4 text-muted-foreground" />;
    default:
      return <FileText className="h-4 w-4 text-muted-foreground" />;
  }
};

const StandardCourseTemplate = ({
  course,
  isPreview = false,
  onUpdate,
  onEnroll,
  isEnrolled = false,
  isEnrolling = false,
}: StandardCourseTemplateProps) => {
  const style = getLayoutStyleConfig(course.layout_style ?? "creator");
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero ──────────────────────────────────────────── */}
      <section
        className="py-16 px-4"
        style={{
          background: `linear-gradient(135deg, ${style.primaryHex}22 0%, transparent 60%)`,
        }}
      >
        <div className={style.containerClass}>
          <h1 className={`text-4xl font-bold mb-3 ${style.headingClass}`}>
            {course.title}
          </h1>
          {course.tagline && (
            <p className="text-xl text-muted-foreground mb-4">{course.tagline}</p>
          )}
          {course.description && (
            <p className="text-muted-foreground max-w-2xl mb-6">
              {course.description}
            </p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-3 mb-8">
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <BookOpen className="h-3.5 w-3.5" />
              {course.modules.length} Modules
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <Clock className="h-3.5 w-3.5" />
              {totalLessons} Lessons
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <GraduationCap className="h-3.5 w-3.5" />
              {course.duration_weeks} Weeks
            </Badge>
          </div>

          {!isPreview && (
            <Button
              size="lg"
              onClick={onEnroll}
              disabled={isEnrolling}
              style={{ backgroundColor: style.primaryHex }}
              className="text-white hover:opacity-90"
            >
              {isEnrolling
                ? "Enrolling…"
                : isEnrolled
                ? "Continue Learning"
                : "Enroll Now"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        {/* Learning Outcomes */}
        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
          <Card className={style.cardClass}>
            <CardHeader>
              <CardTitle className={style.headingClass}>
                What You'll Learn
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {course.learningOutcomes.map((outcome, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check
                      className="h-4 w-4 mt-0.5 shrink-0"
                      style={{ color: style.primaryHex }}
                    />
                    <span className="text-sm text-foreground">{outcome}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Curriculum */}
        <Card className={style.cardClass}>
          <CardHeader>
            <CardTitle className={style.headingClass}>
              Course Curriculum
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {course.modules.map((mod, mIdx) => (
                <AccordionItem key={mod.id} value={mod.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 text-left">
                      <span
                        className="text-xs font-mono px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${style.primaryHex}22`,
                          color: style.primaryHex,
                        }}
                      >
                        {formatSectionNumber(mIdx)}
                      </span>
                      <span className="font-medium text-foreground">
                        {mod.title}
                      </span>
                      <Badge variant="outline" className="ml-auto mr-2 text-xs">
                        {mod.lessons.length} lessons
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {mod.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {mod.description}
                      </p>
                    )}
                    <ul className="space-y-2">
                      {mod.lessons.map((lesson, lIdx) => (
                        <li
                          key={lesson.id}
                          className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted/40 transition-colors"
                        >
                          {lessonTypeIcon(lesson.type)}
                          <span className="text-muted-foreground font-mono text-xs w-8">
                            {formatSectionNumber(mIdx, lIdx)}
                          </span>
                          <span className="flex-1 text-foreground">
                            {lesson.title}
                          </span>
                          {lesson.duration && (
                            <Badge variant="outline" className="text-xs">
                              {lesson.duration}
                            </Badge>
                          )}
                          {lesson.is_preview && (
                            <Badge
                              className="text-xs"
                              style={{
                                backgroundColor: `${style.primaryHex}22`,
                                color: style.primaryHex,
                              }}
                            >
                              Preview
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Bottom CTA */}
        {!isPreview && (
          <div className="text-center py-8">
            <Button
              size="lg"
              onClick={onEnroll}
              disabled={isEnrolling}
              style={{ backgroundColor: style.primaryHex }}
              className="text-white hover:opacity-90"
            >
              {isEnrolling
                ? "Enrolling…"
                : isEnrolled
                ? "Continue Learning"
                : "Enroll Now"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StandardCourseTemplate;
