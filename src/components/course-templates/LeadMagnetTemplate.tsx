import { useState } from "react";
import {
  Check,
  Download,
  Lock,
  Star,
  Users,
  ChevronRight,
  FileDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExtendedCourse } from "@/types/course-pages";

interface LeadMagnetTemplateProps {
  course: ExtendedCourse;
  isPreview?: boolean;
  onUpdate?: (course: ExtendedCourse) => void;
  onEnroll?: () => void;
  isEnrolled?: boolean;
  isEnrolling?: boolean;
}

const LeadMagnetTemplate = ({
  course,
  isPreview = false,
  onEnroll,
  isEnrolled = false,
  isEnrolling = false,
}: LeadMagnetTemplateProps) => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const outcomes = (course.learningOutcomes ?? []).slice(0, 5);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section
        className="py-16 px-4"
        style={{
          background: "linear-gradient(135deg, #05966922 0%, #0d948822 50%, transparent 80%)",
        }}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Content */}
          <div>
            <h1 className="text-4xl font-bold mb-3 text-foreground">{course.title}</h1>
            {course.tagline && <p className="text-xl text-muted-foreground mb-4">{course.tagline}</p>}
            {course.description && <p className="text-muted-foreground mb-8">{course.description}</p>}

            {outcomes.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-4 text-foreground">What's Inside</h2>
                <div className="space-y-3">
                  {outcomes.map((o, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
                      <span className="text-sm text-foreground">{o}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Download form */}
          <Card className="border-emerald-500/20 bg-emerald-950/10">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-center mb-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <FileDown className="h-7 w-7 text-emerald-400" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-foreground text-center">Get Instant Access</h3>
              <Input
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={onEnroll}
                disabled={isEnrolling}
              >
                {isEnrolling ? "Processing…" : "Get Instant Access"}
                <Download className="h-4 w-4 ml-1" />
              </Button>
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" /> We respect your privacy. Unsubscribe anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Trust badges */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex flex-wrap justify-center gap-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium">10k+ Downloads</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium">4.9 Rating</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Download className="h-5 w-5 text-emerald-500" />
            <span className="text-sm font-medium">Free Forever</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadMagnetTemplate;
