import {
  Award,
  Phone,
  Mail,
  Star,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExtendedCourse } from "@/types/course-pages";

interface CoachPortfolioTemplateProps {
  course: ExtendedCourse;
  isPreview?: boolean;
  onUpdate?: (course: ExtendedCourse) => void;
  onEnroll?: () => void;
  isEnrolled?: boolean;
  isEnrolling?: boolean;
}

const CoachPortfolioTemplate = ({
  course,
  isPreview = false,
  onEnroll,
  isEnrolled = false,
  isEnrolling = false,
}: CoachPortfolioTemplateProps) => {
  const instructor = course.pages?.instructor;
  const initials = (instructor?.name ?? course.title)
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const placeholderTestimonials = [
    { name: "Sarah M.", text: "Completely transformed my approach. Highly recommended!" },
    { name: "James K.", text: "The coaching sessions were invaluable. Best investment I've made." },
    { name: "Lisa T.", text: "Exceeded all my expectations. The results speak for themselves." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section
        className="py-16 px-4"
        style={{
          background: "linear-gradient(135deg, #f43f5e22 0%, #ec489922 50%, transparent 80%)",
        }}
      >
        <div className="max-w-4xl mx-auto text-center">
          {/* Avatar */}
          {instructor?.avatar ? (
            <img
              src={instructor.avatar}
              alt={instructor.name}
              className="w-24 h-24 rounded-full mx-auto mb-4 object-cover border-2 border-rose-500/30"
            />
          ) : (
            <div className="w-24 h-24 rounded-full mx-auto mb-4 bg-rose-500/20 border-2 border-rose-500/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-rose-400">{initials}</span>
            </div>
          )}

          <Badge className="mb-4 bg-rose-500/20 text-rose-400 border-rose-500/30">
            <Award className="h-3 w-3 mr-1" /> Certified Coach
          </Badge>
          <h1 className="text-4xl font-bold mb-3 text-foreground">{course.title}</h1>
          {course.tagline && <p className="text-xl text-muted-foreground mb-4">{course.tagline}</p>}
          {course.description && <p className="text-muted-foreground max-w-2xl mx-auto mb-6">{course.description}</p>}

          {!isPreview && (
            <div className="flex gap-3 justify-center">
              <Button size="lg" onClick={onEnroll} disabled={isEnrolling} className="bg-rose-600 hover:bg-rose-700 text-white">
                <Phone className="h-4 w-4 mr-1" /> Book a Call
              </Button>
              <Button size="lg" variant="outline" className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                <Mail className="h-4 w-4 mr-1" /> Get in Touch
              </Button>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* About */}
        {instructor?.bio && (
          <div>
            <h2 className="text-2xl font-bold mb-4 text-foreground">About Me</h2>
            <p className="text-muted-foreground">{instructor.bio}</p>
          </div>
        )}

        {/* Services */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Services & Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {course.modules.map((mod) => (
              <Card key={mod.id} className="border-rose-500/10 hover:border-rose-500/30 transition-colors">
                <CardHeader>
                  <CardTitle className="text-lg text-foreground">{mod.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {mod.description && <p className="text-sm text-muted-foreground mb-3">{mod.description}</p>}
                  <ul className="space-y-1.5 mb-4">
                    {mod.lessons.slice(0, 4).map((l) => (
                      <li key={l.id} className="text-sm text-foreground flex items-center gap-1.5">
                        <ChevronRight className="h-3 w-3 text-rose-500" />
                        {l.title}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="w-full border-rose-500/30 text-rose-400 hover:bg-rose-500/10">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Credentials */}
        {course.learningOutcomes && course.learningOutcomes.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6 text-foreground">Credentials & Expertise</h2>
            <div className="space-y-3">
              {course.learningOutcomes.map((o, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Award className="h-4 w-4 mt-0.5 shrink-0 text-rose-500" />
                  <span className="text-sm text-foreground">{o}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Testimonials */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-foreground">Client Testimonials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {placeholderTestimonials.map((t, i) => (
              <Card key={i} className="border-rose-500/10">
                <CardContent className="pt-5">
                  <div className="flex gap-0.5 mb-3">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} className="h-4 w-4 fill-rose-500 text-rose-500" />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">"{t.text}"</p>
                  <p className="text-sm font-medium text-foreground">{t.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        {!isPreview && (
          <div className="text-center py-8">
            <Button size="lg" onClick={onEnroll} disabled={isEnrolling} className="bg-rose-600 hover:bg-rose-700 text-white">
              <Phone className="h-4 w-4 mr-1" /> Book Free Call
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachPortfolioTemplate;
