import { useState } from "react";
import {
  Play,
  Clock,
  Radio,
  ArrowRight,
  ChevronRight,
  Lock,
  Monitor,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExtendedCourse } from "@/types/course-pages";

interface WebinarTemplateProps {
  course: ExtendedCourse;
  isPreview?: boolean;
  onUpdate?: (course: ExtendedCourse) => void;
  onEnroll?: () => void;
  isEnrolled?: boolean;
  isEnrolling?: boolean;
}

const WebinarTemplate = ({
  course,
  isPreview = false,
  onEnroll,
  isEnrolled = false,
  isEnrolling = false,
}: WebinarTemplateProps) => {
  const [email, setEmail] = useState("");
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section
        className="py-16 px-4"
        style={{
          background: "linear-gradient(135deg, #6366f122 0%, #7c3aed22 50%, transparent 80%)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <Badge className="mb-4 bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
            <Play className="h-3 w-3 mr-1" /> Free Webinar
          </Badge>
          <h1 className="text-4xl font-bold mb-3 text-foreground">{course.title}</h1>
          {course.tagline && <p className="text-xl text-muted-foreground mb-4">{course.tagline}</p>}

          {/* Video placeholder */}
          <Card className="border-indigo-500/20 bg-indigo-950/10 mb-6 overflow-hidden">
            <div className="aspect-video flex items-center justify-center">
              {isEnrolled ? (
                <div className="text-center">
                  <Monitor className="h-12 w-12 text-indigo-400 mx-auto mb-2" />
                  <p className="text-muted-foreground text-sm">Video player area</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-3">
                    <Play className="h-8 w-8 text-indigo-400" />
                  </div>
                  <p className="text-muted-foreground text-sm">Register to watch</p>
                </div>
              )}
            </div>
          </Card>

          <div className="flex flex-wrap gap-3">
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <Clock className="h-3.5 w-3.5" /> {course.duration_weeks * 60} min
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              <Radio className="h-3.5 w-3.5" /> On Demand
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1 px-3">
              Free Registration
            </Badge>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-10">
        {/* Description */}
        {course.description && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">About This Webinar</h2>
            <p className="text-muted-foreground">{course.description}</p>
          </div>
        )}

        {/* Outcomes */}
        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-foreground">
              In This Webinar, You'll Discover
            </h2>
            <div className="space-y-3">
              {course.learningOutcomes.map((o, i) => (
                <div key={i} className="flex items-start gap-3">
                  <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-indigo-500" />
                  <span className="text-sm text-foreground">{o}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Registration */}
        {!isEnrolled && !isPreview && (
          <Card className="border-indigo-500/20 bg-indigo-950/10">
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Register to Watch</h3>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={onEnroll}
                disabled={isEnrolling}
              >
                {isEnrolling ? "Registering…" : "Watch Now"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Trusted by thousands of learners · Your email is safe with us
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default WebinarTemplate;
