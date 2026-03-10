import {
  Check,
  BookOpen,
  Clock,
  Users,
  Award,
  Gift,
  Shield,
  Star,
  MessageCircle,
  ChevronDown,
  Play,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ExtendedCourse,
  LandingSectionType,
  getLayoutStyleConfig,
  calculateModuleDuration,
} from "@/types/course-pages";

interface CourseLandingPreviewProps {
  course: ExtendedCourse;
  onUpdate?: (course: ExtendedCourse) => void;
  onEnrollClick?: () => void;
}

// ── Section Components ──────────────────────────────────────

const HeroSection = ({
  course,
  onEnrollClick,
  style,
}: {
  course: ExtendedCourse;
  onEnrollClick?: () => void;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalDuration = course.modules.reduce((s, m) => {
    const dur = calculateModuleDuration(m.lessons);
    const h = dur.match(/([\d.]+)h/);
    const min = dur.match(/([\d.]+)m/);
    return s + (h ? parseFloat(h[1]) * 60 : 0) + (min ? parseFloat(min[1]) : 0);
  }, 0);
  const durationStr =
    totalDuration >= 60
      ? `${Math.floor(totalDuration / 60)}h ${Math.round(totalDuration % 60)}m`
      : `${Math.round(totalDuration)}m`;

  return (
    <section
      className={`py-20 px-6 bg-gradient-to-br ${style.heroGradient} text-white`}
    >
      <div className={style.containerClass}>
        <div className="max-w-3xl">
          {course.tagline && (
            <p className="text-white/80 text-lg mb-3">{course.tagline}</p>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            {course.title}
          </h1>
          <p className="text-white/90 text-lg mb-8 leading-relaxed">
            {course.description}
          </p>
          <div className="flex flex-wrap gap-3 mb-8">
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              {course.modules.length} modules
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <FileText className="h-3.5 w-3.5" />
              {totalLessons} lessons
            </Badge>
            <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
              <Clock className="h-3.5 w-3.5" />
              {durationStr}
            </Badge>
          </div>
          <Button
            size="lg"
            onClick={onEnrollClick}
            className="text-lg px-8 py-6 bg-white text-foreground hover:bg-white/90 font-semibold"
          >
            Enroll Now
          </Button>
        </div>
      </div>
    </section>
  );
};

const OutcomesSection = ({
  course,
  style,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const outcomes = course.learningOutcomes ?? [];
  if (!outcomes.length) return null;

  return (
    <section className="py-16 px-6">
      <div className={style.containerClass}>
        <h2 className={`text-3xl font-bold mb-8 ${style.headingClass}`}>
          What You'll Learn
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {outcomes.map((o, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div
                className="mt-1 rounded-full p-1 shrink-0"
                style={{ backgroundColor: `${style.primaryHex}20` }}
              >
                <Check
                  className="h-4 w-4"
                  style={{ color: style.primaryHex }}
                />
              </div>
              <span className="text-muted-foreground">{o}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const CurriculumSection = ({
  course,
  style,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const layoutStyle = course.layout_style ?? "creator";

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className={style.containerClass}>
        <h2 className={`text-3xl font-bold mb-8 ${style.headingClass}`}>
          Course Curriculum
        </h2>

        {layoutStyle === "creator" && (
          <div className="relative pl-8 space-y-8">
            <div
              className="absolute left-3 top-2 bottom-2 w-0.5"
              style={{ backgroundColor: `${style.primaryHex}40` }}
            />
            {course.modules.map((mod, i) => (
              <div key={mod.id} className="relative">
                <div
                  className="absolute -left-5 top-1.5 h-4 w-4 rounded-full border-2"
                  style={{
                    borderColor: style.primaryHex,
                    backgroundColor: `${style.primaryHex}30`,
                  }}
                />
                <Card className={style.cardClass}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Module {i + 1}: {mod.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {mod.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1.5">
                      {mod.lessons.map((l) => (
                        <li
                          key={l.id}
                          className="text-sm text-muted-foreground flex gap-2"
                        >
                          <Play className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
                          {l.title}
                          <span className="ml-auto text-xs opacity-60">
                            {l.duration}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}

        {layoutStyle === "academic" && (
          <div className="space-y-6">
            {course.modules.map((mod, i) => (
              <div key={mod.id}>
                <h3
                  className={`text-xl mb-2 ${style.headingFont ?? ""} ${style.headingClass}`}
                >
                  {i + 1}. {mod.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {mod.description}
                </p>
                <ul className="ml-6 space-y-1">
                  {mod.lessons.map((l, li) => (
                    <li key={l.id} className="text-sm text-muted-foreground">
                      {i + 1}.{li + 1} — {l.title}{" "}
                      <span className="opacity-50">({l.duration})</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {layoutStyle === "visual" && (
          <div className="grid md:grid-cols-2 gap-4">
            {course.modules.map((mod, i) => (
              <Card key={mod.id} className={style.cardClass}>
                <CardHeader>
                  <Badge
                    className="w-fit mb-1"
                    style={{ backgroundColor: style.primaryHex }}
                  >
                    Module {i + 1}
                  </Badge>
                  <CardTitle className="text-lg">{mod.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {mod.lessons.length} lessons ·{" "}
                    {calculateModuleDuration(mod.lessons)}
                  </p>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {(layoutStyle === "technical" || !["creator", "academic", "visual"].includes(layoutStyle)) && (
          <Accordion type="multiple" className="space-y-2">
            {course.modules.map((mod, i) => (
              <AccordionItem
                key={mod.id}
                value={mod.id}
                className={`border rounded-lg px-4 ${style.cardClass}`}
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded`}
                      style={{
                        backgroundColor: `${style.primaryHex}20`,
                        color: style.primaryHex,
                      }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-medium">{mod.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {mod.lessons.length} lessons ·{" "}
                        {calculateModuleDuration(mod.lessons)}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1.5 pl-10">
                    {mod.lessons.map((l) => (
                      <li
                        key={l.id}
                        className="text-sm text-muted-foreground flex justify-between"
                      >
                        <span>{l.title}</span>
                        <span className="text-xs opacity-50">{l.duration}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </section>
  );
};

const InstructorSection = ({
  course,
  style,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const instructor = course.pages?.instructor;
  if (!instructor) return null;

  return (
    <section className="py-16 px-6">
      <div className={style.containerClass}>
        <h2 className={`text-3xl font-bold mb-8 ${style.headingClass}`}>
          Your Instructor
        </h2>
        <div className="flex items-start gap-6">
          <Avatar className="h-20 w-20">
            <AvatarImage src={instructor.avatar} />
            <AvatarFallback className="text-2xl">
              {instructor.name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{instructor.name}</h3>
            <p className="text-muted-foreground mt-2 leading-relaxed">
              {instructor.bio}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const TestimonialsSection = ({
  course,
  style,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const testimonials = course.pages?.faq
    ? undefined
    : undefined; // testimonials come from pages content
  const pageTestimonials =
    course.separatePages?.find((p) => p.type === "testimonials")?.content
      ?.testimonials ?? [];
  if (!pageTestimonials.length) return null;

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className={style.containerClass}>
        <h2 className={`text-3xl font-bold mb-8 ${style.headingClass}`}>
          What Students Say
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageTestimonials.map((t, i) => (
            <Card key={i} className={style.cardClass}>
              <CardContent className="pt-6">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, s) => (
                    <Star
                      key={s}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-muted-foreground italic mb-4">
                  "{t.text}"
                </p>
                <p className="font-medium text-sm">{t.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

const PricingSection = ({
  course,
  onEnrollClick,
  style,
}: {
  course: ExtendedCourse;
  onEnrollClick?: () => void;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const pricing = course.pages?.pricing;

  return (
    <section className="py-16 px-6">
      <div className={style.containerClass}>
        <div className="max-w-md mx-auto text-center">
          <h2 className={`text-3xl font-bold mb-4 ${style.headingClass}`}>
            Get Started Today
          </h2>
          {pricing && (
            <div className="mb-6">
              {pricing.original_price && (
                <span className="text-xl text-muted-foreground line-through mr-3">
                  {pricing.currency === "USD" ? "$" : pricing.currency}
                  {pricing.original_price}
                </span>
              )}
              <span className="text-4xl font-bold" style={{ color: style.primaryHex }}>
                {pricing.currency === "USD" ? "$" : pricing.currency}
                {pricing.price}
              </span>
            </div>
          )}
          <Button
            size="lg"
            onClick={onEnrollClick}
            className="w-full text-lg py-6"
            style={{ backgroundColor: style.primaryHex }}
          >
            Enroll Now
          </Button>
        </div>
      </div>
    </section>
  );
};

const FAQSection = ({
  course,
  style,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const faqs = course.pages?.faq ?? [];
  if (!faqs.length) return null;

  return (
    <section className="py-16 px-6">
      <div className={style.containerClass}>
        <h2 className={`text-3xl font-bold mb-8 ${style.headingClass}`}>
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger>{f.question}</AccordionTrigger>
              <AccordionContent>{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

const WhoIsForSection = ({
  course,
  style,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const audience = course.pages?.target_audience;
  if (!audience) return null;

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className={style.containerClass}>
        <h2 className={`text-3xl font-bold mb-4 ${style.headingClass}`}>
          Who Is This Course For?
        </h2>
        <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
          {audience}
        </p>
      </div>
    </section>
  );
};

const CourseIncludesSection = ({
  course,
  style,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const items = [
    `${course.modules.length} comprehensive modules`,
    `${course.modules.reduce((s, m) => s + m.lessons.length, 0)} lessons`,
    "Lifetime access",
    "Certificate of completion",
  ];

  return (
    <section className="py-16 px-6">
      <div className={style.containerClass}>
        <h2 className={`text-3xl font-bold mb-8 ${style.headingClass}`}>
          This Course Includes
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 items-center">
              <Check className="h-5 w-5" style={{ color: style.primaryHex }} />
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const GuaranteeSection = ({
  style,
}: {
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => (
  <section className="py-16 px-6 bg-muted/30">
    <div className={style.containerClass}>
      <div className="flex items-start gap-4 max-w-2xl mx-auto text-center flex-col items-center">
        <Shield className="h-12 w-12" style={{ color: style.primaryHex }} />
        <h2 className={`text-2xl font-bold ${style.headingClass}`}>
          30-Day Money-Back Guarantee
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          If you're not completely satisfied, get a full refund within 30 days.
          No questions asked.
        </p>
      </div>
    </div>
  </section>
);

const BonusesSection = ({
  course,
  style,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const bonuses = course.pages?.included_bonuses ?? [];
  if (!bonuses.length) return null;

  return (
    <section className="py-16 px-6">
      <div className={style.containerClass}>
        <h2 className={`text-3xl font-bold mb-8 ${style.headingClass}`}>
          Bonus Materials
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {bonuses.map((b, i) => (
            <Card key={i} className={style.cardClass}>
              <CardContent className="pt-6 flex gap-3 items-start">
                <Gift className="h-5 w-5 shrink-0" style={{ color: style.primaryHex }} />
                <span>{b}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

const CommunitySection = ({
  style,
}: {
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => (
  <section className="py-16 px-6 bg-muted/30">
    <div className={style.containerClass}>
      <div className="flex flex-col items-center text-center max-w-lg mx-auto">
        <MessageCircle
          className="h-10 w-10 mb-4"
          style={{ color: style.primaryHex }}
        />
        <h2 className={`text-2xl font-bold mb-3 ${style.headingClass}`}>
          Join Our Community
        </h2>
        <p className="text-muted-foreground">
          Connect with fellow students, share progress, and get support from
          instructors in our private community.
        </p>
      </div>
    </div>
  </section>
);

const CertificateSection = ({
  style,
}: {
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => (
  <section className="py-16 px-6">
    <div className={style.containerClass}>
      <div className="flex flex-col items-center text-center max-w-lg mx-auto">
        <Award
          className="h-10 w-10 mb-4"
          style={{ color: style.primaryHex }}
        />
        <h2 className={`text-2xl font-bold mb-3 ${style.headingClass}`}>
          Certificate of Completion
        </h2>
        <p className="text-muted-foreground">
          Earn a verifiable certificate upon completing all modules to showcase
          your achievement.
        </p>
      </div>
    </div>
  </section>
);

// ── Main Component ──────────────────────────────────────────

const SECTION_RENDERERS: Record<
  LandingSectionType,
  React.FC<{
    course: ExtendedCourse;
    onEnrollClick?: () => void;
    style: ReturnType<typeof getLayoutStyleConfig>;
  }>
> = {
  hero: ({ course, onEnrollClick, style }) => (
    <HeroSection course={course} onEnrollClick={onEnrollClick} style={style} />
  ),
  outcomes: ({ course, style }) => (
    <OutcomesSection course={course} style={style} />
  ),
  curriculum: ({ course, style }) => (
    <CurriculumSection course={course} style={style} />
  ),
  instructor: ({ course, style }) => (
    <InstructorSection course={course} style={style} />
  ),
  testimonials: ({ course, style }) => (
    <TestimonialsSection course={course} style={style} />
  ),
  pricing: ({ course, onEnrollClick, style }) => (
    <PricingSection course={course} onEnrollClick={onEnrollClick} style={style} />
  ),
  faq: ({ course, style }) => <FAQSection course={course} style={style} />,
  who_is_for: ({ course, style }) => (
    <WhoIsForSection course={course} style={style} />
  ),
  course_includes: ({ course, style }) => (
    <CourseIncludesSection course={course} style={style} />
  ),
  guarantee: ({ style }) => <GuaranteeSection style={style} />,
  bonuses: ({ course, style }) => (
    <BonusesSection course={course} style={style} />
  ),
  community: ({ style }) => <CommunitySection style={style} />,
  certificate: ({ style }) => <CertificateSection style={style} />,
};

const CourseLandingPreview = ({
  course,
  onEnrollClick,
}: CourseLandingPreviewProps) => {
  const style = getLayoutStyleConfig(course.layout_style ?? "creator");
  const sections: LandingSectionType[] = course.pages?.landing_sections ??
    course.section_order?.filter((s): s is LandingSectionType =>
      Object.keys(SECTION_RENDERERS).includes(s)
    ) ?? [
      "hero",
      "outcomes",
      "curriculum",
      "instructor",
      "pricing",
      "faq",
    ];

  return (
    <div className="min-h-screen bg-background">
      {sections.map((sectionType) => {
        const Renderer = SECTION_RENDERERS[sectionType];
        if (!Renderer) return null;
        return (
          <Renderer
            key={sectionType}
            course={course}
            onEnrollClick={onEnrollClick}
            style={style}
          />
        );
      })}

      {/* Final CTA */}
      <section
        className={`py-20 px-6 bg-gradient-to-br ${style.heroGradient} text-white text-center`}
      >
        <div className={style.containerClass}>
          <h2 className="text-3xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-white/80 mb-8 max-w-lg mx-auto">
            Join students already enrolled and start your learning journey today.
          </p>
          <Button
            size="lg"
            onClick={onEnrollClick}
            className="text-lg px-10 py-6 bg-white text-foreground hover:bg-white/90 font-semibold"
          >
            Enroll Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default CourseLandingPreview;
