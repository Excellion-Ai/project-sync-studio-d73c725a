import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExtendedCourse } from "@/types/course-pages";
import CoursePreviewTabs from "./CoursePreviewTabs";

type PreviewMode = "desktop" | "tablet" | "mobile";

interface BuilderPreviewAreaProps {
  courseSpec: ExtendedCourse | null;
  previewMode: PreviewMode;
  isPublished: boolean;
  isPublishing: boolean;
  onCourseUpdate: (course: ExtendedCourse) => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onRefine: () => void;
  onOpenSettings: () => void;
  onOpenPublishSettings: () => void;
  logoUrl?: string;
  onUpdateLogo?: (url: string | undefined) => void;
}

const BuilderPreviewArea = ({
  courseSpec,
  previewMode,
  isPublished,
  isPublishing,
  onCourseUpdate,
  onPublish,
  onUnpublish,
  onRefine,
  onOpenSettings,
  onOpenPublishSettings,
  logoUrl,
  onUpdateLogo,
}: BuilderPreviewAreaProps) => {
  const previewClass =
    previewMode === "tablet"
      ? "max-w-[768px]"
      : previewMode === "mobile"
        ? "max-w-[390px]"
        : "";

  if (!courseSpec) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-sm">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto shadow-glow-sm">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Course Preview</h3>
            <p className="text-sm text-muted-foreground">
              Your course will appear here once generated. Describe your idea in the left panel to begin.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ArrowRight className="h-3.5 w-3.5" />
            <span>Type your idea and press Generate</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-background/50">
      <div className={cn("mx-auto h-full transition-all duration-300", previewClass)}>
        <CoursePreviewTabs
          course={courseSpec}
          onUpdate={onCourseUpdate}
          onPublish={isPublished ? onUnpublish : onPublish}
          onUnpublish={onUnpublish}
          onRefine={onRefine}
          onOpenSettings={onOpenSettings}
          onOpenPublishSettings={onOpenPublishSettings}
          isPublishing={isPublishing}
          isPublished={isPublished}
          isVisualEditMode={true}
          isCreatorView={true}
          logoUrl={logoUrl}
          onUpdateLogo={onUpdateLogo}
        />
      </div>
    </div>
  );
};

export default BuilderPreviewArea;
