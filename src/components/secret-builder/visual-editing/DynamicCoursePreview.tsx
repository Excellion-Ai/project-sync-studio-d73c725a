import { useMemo } from "react";
import { ExtendedCourse, getLayoutStyleConfig } from "@/types/course-pages";
import CourseLandingPreview from "@/components/secret-builder/CourseLandingPreview";

interface DynamicCoursePreviewProps {
  course: ExtendedCourse;
  onUpdate?: (course: ExtendedCourse) => void;
  onEnrollClick?: () => void;
}

/**
 * Wraps CourseLandingPreview with live CSS custom property injection
 * from the course's design_config for real-time design updates.
 */
const DynamicCoursePreview = ({
  course,
  onUpdate,
  onEnrollClick,
}: DynamicCoursePreviewProps) => {
  const cssVars = useMemo(() => {
    const dc = course.design_config;
    if (!dc?.colors) return {};
    const vars: Record<string, string> = {};
    if (dc.colors.primary) vars["--course-primary"] = dc.colors.primary;
    if (dc.colors.secondary) vars["--course-secondary"] = dc.colors.secondary;
    if (dc.colors.accent) vars["--course-accent"] = dc.colors.accent;
    if (dc.colors.background) vars["--course-bg"] = dc.colors.background;
    if (dc.colors.cardBackground) vars["--course-card-bg"] = dc.colors.cardBackground;
    if (dc.colors.text) vars["--course-text"] = dc.colors.text;
    if (dc.colors.textMuted) vars["--course-text-muted"] = dc.colors.textMuted;

    // Spacing
    const spacingMap = { compact: "0.75rem", normal: "1rem", spacious: "1.5rem" };
    if (dc.spacing) vars["--course-spacing"] = spacingMap[dc.spacing] || "1rem";

    // Border radius
    const radiusMap = { none: "0", small: "0.25rem", medium: "0.5rem", large: "1rem" };
    if (dc.borderRadius) vars["--course-radius"] = radiusMap[dc.borderRadius] || "0.5rem";

    return vars;
  }, [course.design_config]);

  // Load Google Fonts dynamically
  useMemo(() => {
    const fonts = course.design_config?.fonts;
    if (!fonts) return;
    const families = [fonts.heading, fonts.body].filter(
      (f) => f && f !== "Inter"
    );
    if (families.length === 0) return;

    const id = "dynamic-course-fonts";
    let link = document.getElementById(id) as HTMLLinkElement | null;
    const href = `https://fonts.googleapis.com/css2?${families
      .map((f) => `family=${encodeURIComponent(f!)}:wght@400;500;600;700`)
      .join("&")}&display=swap`;

    if (!link) {
      link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      document.head.appendChild(link);
    }
    link.href = href;
  }, [course.design_config?.fonts]);

  const fontStyles: React.CSSProperties = {};
  if (course.design_config?.fonts?.body) {
    fontStyles.fontFamily = `"${course.design_config.fonts.body}", sans-serif`;
  }

  return (
    <div
      style={{ ...cssVars, ...fontStyles } as React.CSSProperties}
      className="min-h-full"
    >
      <CourseLandingPreview
        course={course}
        onUpdate={onUpdate}
        onEnrollClick={onEnrollClick}
      />
    </div>
  );
};

export default DynamicCoursePreview;
