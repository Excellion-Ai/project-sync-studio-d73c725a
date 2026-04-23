import { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import CourseStudentView from "@/components/secret-builder/CourseStudentView";
import type { ExtendedCourse, ModuleWithContent } from "@/types/course-pages";

const LearnPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<ExtendedCourse | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !user) return;

    const load = async () => {
      setIsLoading(true);

      const { data: row, error: fetchErr } = await supabase
        .from("courses")
        .select("id, title, description, tagline, curriculum, design_config, layout_template, meta, section_order, page_sections, thumbnail_url, instructor_name, instructor_bio, type")
        .or(`slug.eq.${slug},subdomain.eq.${slug}`)
        .is("deleted_at", null)
        .limit(1)
        .maybeSingle();

      if (fetchErr || !row) {
        setError("Course not found.");
        setIsLoading(false);
        return;
      }

      // Verify enrollment
      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", row.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!enrollment) {
        setError("not_enrolled");
        setIsLoading(false);
        return;
      }

      const modules: ModuleWithContent[] = Array.isArray(row.curriculum)
        ? (row.curriculum as any[]).map((mod: any, i: number) => ({
            id: mod.id || `mod-${i}`,
            title: mod.title || `Module ${i + 1}`,
            description: mod.description || "",
            is_first: i === 0,
            is_last: i === (row.curriculum as any[]).length - 1,
            lessons: (mod.lessons || []).map((les: any, j: number) => ({
              id: les.id || `mod-${i}-les-${j}`,
              title: les.title || `Lesson ${j + 1}`,
              duration: les.duration || "20m",
              type: les.type || "text",
              description: les.description || "",
              content_markdown: les.content_markdown || "",
              video_url: les.video_url,
              quiz_questions: les.quiz_questions,
              passing_score: les.passing_score,
              assignment_brief: les.assignment_brief,
            })),
          }))
        : [];

      const meta = (row.meta as any) || {};
      const mapped: ExtendedCourse = {
        id: row.id,
        title: row.title,
        description: row.description || "",
        tagline: row.tagline || "",
        difficulty: meta.difficulty || "beginner",
        duration_weeks: meta.duration_weeks || 6,
        layout_style: (row.layout_template || "creator") as ExtendedCourse["layout_style"],
        learningOutcomes: [],
        modules,
        pages: (row.page_sections as any) || {},
        section_order: Array.isArray(row.section_order) ? (row.section_order as string[]) : [],
        design_config: (row.design_config as any) || {},
        thumbnail: row.thumbnail_url || "",
      };

      setCourse(mapped);
      setCourseId(row.id);

      // Auto-select first lesson
      if (modules.length > 0 && modules[0].lessons.length > 0) {
        setSelectedModuleId(modules[0].id);
        setSelectedLessonId(modules[0].lessons[0].id);
      }

      setIsLoading(false);
    };

    load();
  }, [slug, user]);

  // Auth guard
  if (ready && !user) {
    return <Navigate to={`/auth?redirect=/learn/${slug}`} replace />;
  }

  if (isLoading || !ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error === "not_enrolled") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-heading font-bold text-foreground mb-2">Not Enrolled</h1>
          <p className="text-sm text-muted-foreground font-body mb-6">
            You need to enroll in this course before accessing lessons.
          </p>
          <button
            type="button"
            onClick={() => navigate(`/course/${slug}`, { replace: true })}
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm touch-manipulation"
          >
            View Course
          </button>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center">
          <h1 className="text-xl font-heading font-bold text-foreground mb-2">Course Not Found</h1>
          <p className="text-sm text-muted-foreground font-body mb-6">{error}</p>
          <button
            type="button"
            onClick={() => navigate("/my-courses", { replace: true })}
            className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm touch-manipulation"
          >
            My Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CourseStudentView
        course={course}
        selectedModuleId={selectedModuleId}
        selectedLessonId={selectedLessonId}
        onSelectModule={setSelectedModuleId}
        onSelectLesson={(modId, lesId) => {
          setSelectedModuleId(modId);
          setSelectedLessonId(lesId);
        }}
        onBack={() => navigate(`/course/${slug}`)}
      />
    </div>
  );
};

export default LearnPage;
