import { ExtendedCourse } from "@/types/course-pages";
import StandardCourseTemplate from "./StandardCourseTemplate";
import ChallengeTemplate from "./ChallengeTemplate";
import WebinarTemplate from "./WebinarTemplate";
import LeadMagnetTemplate from "./LeadMagnetTemplate";
import CoachPortfolioTemplate from "./CoachPortfolioTemplate";

export type OfferType = "standard" | "challenge" | "webinar" | "lead_magnet" | "coach_portfolio";

export interface CourseWithOfferType extends ExtendedCourse {
  offer_type?: OfferType;
}

interface CourseRendererProps {
  course: CourseWithOfferType;
  isPreview?: boolean;
  onUpdate?: (course: ExtendedCourse) => void;
  onEnroll?: () => void;
  isEnrolled?: boolean;
  isEnrolling?: boolean;
}

const CourseRenderer = ({ course, ...props }: CourseRendererProps) => {
  const shared = { course, ...props };

  switch (course.offer_type) {
    case "challenge":
      return <ChallengeTemplate {...shared} />;
    case "webinar":
      return <WebinarTemplate {...shared} />;
    case "lead_magnet":
      return <LeadMagnetTemplate {...shared} />;
    case "coach_portfolio":
      return <CoachPortfolioTemplate {...shared} />;
    default:
      return <StandardCourseTemplate {...shared} />;
  }
};

export default CourseRenderer;
