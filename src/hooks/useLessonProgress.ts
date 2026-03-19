import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { ModuleWithContent } from "@/types/course-pages";

interface ModuleProgress {
  moduleId: string;
  total: number;
  completed: number;
  percent: number;
}

export function useLessonProgress({
  courseId,
  modules,
}: {
  courseId: string | undefined;
  modules: ModuleWithContent[];
}) {
  const { user } = useAuth();
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  const allLessons = modules.flatMap((m) => m.lessons);
  const totalLessons = allLessons.length;
  const completedCount = completedLessons.size;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const moduleProgress: ModuleProgress[] = modules.map((mod) => {
    const total = mod.lessons.length;
    const completed = mod.lessons.filter((l) => completedLessons.has(l.id)).length;
    return {
      moduleId: mod.id,
      total,
      completed,
      percent: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const isLessonCompleted = useCallback(
    (lessonId: string) => completedLessons.has(lessonId),
    [completedLessons]
  );

  // Load enrollment + progress
  useEffect(() => {
    if (!user?.id || !courseId) {
      setIsLoading(false);
      return;
    }

    const load = async () => {
      setIsLoading(true);

      const { data: enrollment } = await supabase
        .from("enrollments")
        .select("id")
        .eq("course_id", courseId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!enrollment) {
        setIsLoading(false);
        return;
      }

      setEnrollmentId(enrollment.id);

      const { data: progress } = await supabase
        .from("lesson_progress")
        .select("lesson_id")
        .eq("enrollment_id", enrollment.id);

      if (progress) {
        setCompletedLessons(new Set(progress.map((p) => p.lesson_id)));
      }
      setIsLoading(false);
    };

    load();
  }, [user?.id, courseId]);

  const markLessonComplete = useCallback(
    async (lessonId: string) => {
      if (!enrollmentId) return;

      const { error } = await supabase.from("lesson_progress").insert({
        enrollment_id: enrollmentId,
        lesson_id: lessonId,
      });

      if (!error) {
        setCompletedLessons((prev) => new Set([...prev, lessonId]));

        // Update enrollment progress
        const newPercent =
          totalLessons > 0
            ? Math.round(((completedCount + 1) / totalLessons) * 100)
            : 0;

        await supabase
          .from("enrollments")
          .update({
            progress_percent: newPercent,
            last_lesson_id: lessonId,
            last_accessed_at: new Date().toISOString(),
            ...(newPercent >= 100 ? { completed_at: new Date().toISOString() } : {}),
          })
          .eq("id", enrollmentId);
      }
    },
    [enrollmentId, totalLessons, completedCount]
  );

  return {
    enrollmentId,
    completedLessons,
    progressPercent,
    moduleProgress,
    isLessonCompleted,
    markLessonComplete,
    isLoading,
    totalLessons,
    completedCount,
  };
}
