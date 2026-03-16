import { motion } from "framer-motion";
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
  Play,
  FileText,
  Target,
  Zap,
  TrendingUp,
  Lightbulb,
  ChevronRight,
  Infinity,
  Download,
  Headphones,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const outcomeIcons = [Target, Zap, TrendingUp, Lightbulb, Award, BookOpen, Star, Users];

// ── Section Components ──────────────────────────────────────

const HeroSection = ({
  course,
  onEnrollClick,
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

  const pricing = course.pages?.pricing;

  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      {/* Background layers */}
      {course.thumbnail && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${course.thumbnail})` }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background/95 to-background/80" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      {/* Radial gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,hsl(var(--gold)/0.1)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 w-full">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {course.tagline && (
            <motion.p
              variants={fadeUp}
              className="text-primary font-body text-sm uppercase tracking-[0.2em] font-semibold mb-4"
            >
              {course.tagline}
            </motion.p>
          )}

          <motion.h1
            variants={fadeUp}
            className="text-4xl sm:text-5xl md:text-6xl font-heading font-black text-foreground mb-6 leading-[1.1]"
          >
            {course.title}
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="text-lg sm:text-xl text-muted-foreground font-body max-w-2xl mb-8 leading-relaxed"
          >
            {course.description}
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-4 mb-10">
            {[
              { icon: BookOpen, label: `${course.modules.length} Modules` },
              { icon: FileText, label: `${totalLessons} Lessons` },
              { icon: Clock, label: durationStr },
              { icon: Award, label: "Certificate" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/60 border border-border backdrop-blur-sm"
              >
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-body text-foreground font-medium">{label}</span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="flex items-center gap-6">
            <Button
              size="lg"
              onClick={onEnrollClick}
              className="btn-primary text-lg px-10 py-6 font-heading font-bold shadow-glow"
            >
              {pricing
                ? `Enroll — $${pricing.price}`
                : "Enroll Now"}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            {pricing?.original_price && (
              <span className="text-muted-foreground line-through text-lg font-body">
                ${pricing.original_price}
              </span>
            )}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

const OutcomesSection = ({
  course,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const outcomes = course.learningOutcomes ?? [];
  if (!outcomes.length) return null;

  return (
    <section className="py-[60px] px-6 bg-background relative radial-glow">
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            What You'll Learn
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Skills and knowledge you'll walk away with
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {outcomes.map((o, i) => {
            const Icon = outcomeIcons[i % outcomeIcons.length];
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                className="premium-card p-6 flex gap-4 items-start group"
              >
                <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <p className="text-foreground text-sm font-body leading-relaxed">{o}</p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

const CurriculumSection = ({
  course,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);

  return (
    <section className="py-[60px] px-6 bg-background">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Course Curriculum
          </h2>
          <p className="text-muted-foreground font-body">
            {course.modules.length} modules · {totalLessons} lessons
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <Accordion type="multiple" className="space-y-3">
            {course.modules.map((mod, i) => (
              <AccordionItem
                key={mod.id}
                value={mod.id}
                className="premium-card px-6 border-none"
              >
                <AccordionTrigger className="hover:no-underline py-5">
                  <div className="flex items-center gap-4 text-left w-full">
                    <span className="text-2xl font-heading font-black text-primary/20 w-8">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-foreground text-sm">
                        {mod.title}
                      </p>
                      <p className="text-xs text-muted-foreground font-body mt-0.5">
                        {mod.lessons.length} lessons · {calculateModuleDuration(mod.lessons)}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-5">
                  <ul className="space-y-2 pl-12">
                    {mod.lessons.map((l) => (
                      <li
                        key={l.id}
                        className="flex items-center justify-between text-sm text-muted-foreground font-body"
                      >
                        <div className="flex items-center gap-2">
                          <Play className="h-3 w-3 text-primary/50" />
                          <span>{l.title}</span>
                        </div>
                        <span className="text-xs text-muted-foreground/60">{l.duration}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

const InstructorSection = ({
  course,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const instructor = course.pages?.instructor;
  if (!instructor) return null;

  return (
    <section className="py-[60px] px-6 bg-background relative radial-glow">
      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
            Your Instructor
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="premium-card p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6"
        >
          <Avatar className="h-24 w-24 border-2 border-primary/30">
            <AvatarImage src={instructor.avatar} />
            <AvatarFallback className="text-2xl font-heading gradient-gold text-primary-foreground">
              {instructor.name
                .split(" ")
                .map((w) => w[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-heading font-bold text-foreground mb-1">
              {instructor.name}
            </h3>
            <p className="text-muted-foreground font-body text-sm leading-relaxed">
              {instructor.bio}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const TestimonialsSection = ({
  course,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const pageTestimonials =
    course.separatePages?.find((p) => p.type === "testimonials")?.content
      ?.testimonials ?? [];

  // Always show placeholder testimonials if none exist
  const testimonials = pageTestimonials.length
    ? pageTestimonials
    : [
        { name: "Sarah K.", text: "This course completely transformed my approach. Worth every penny." },
        { name: "Mike R.", text: "Incredibly well-structured and practical. I saw results within the first week." },
        { name: "Jessica T.", text: "The best online course I've taken. Clear, actionable, and beautifully presented." },
      ];

  return (
    <section className="py-[60px] px-6 bg-background relative radial-glow">
      <div className="max-w-5xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            What Students Say
          </h2>
          <p className="text-muted-foreground text-lg font-body">
            Real results from real students
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6"
        >
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="premium-card p-8 flex flex-col"
            >
              <div className="flex gap-1 mb-5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-foreground italic text-sm leading-relaxed mb-6 flex-1 font-body">
                "{t.text}"
              </p>
              <div className="text-foreground font-semibold text-sm font-body">
                {t.name}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const PricingSection = ({
  course,
  onEnrollClick,
}: {
  course: ExtendedCourse;
  onEnrollClick?: () => void;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const pricing = course.pages?.pricing;
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);

  const includes = [
    { icon: BookOpen, label: `${course.modules.length} comprehensive modules` },
    { icon: FileText, label: `${totalLessons} in-depth lessons` },
    { icon: Infinity, label: "Lifetime access" },
    { icon: Award, label: "Certificate of completion" },
    { icon: Download, label: "Downloadable resources" },
    { icon: Headphones, label: "Community support" },
  ];

  return (
    <section className="py-[60px] px-6 bg-background relative radial-glow">
      <div className="max-w-lg mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Invest in Yourself
          </h2>
          <p className="text-muted-foreground font-body text-lg">
            Everything you need, nothing you don't
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <div className="premium-card p-8 text-center shadow-glow">
            {pricing ? (
              <div className="mb-6">
                {pricing.original_price && (
                  <span className="text-xl text-muted-foreground line-through mr-3 font-body">
                    ${pricing.original_price}
                  </span>
                )}
                <span className="text-5xl font-heading font-black text-gradient-gold">
                  ${pricing.price}
                </span>
                <span className="text-muted-foreground text-sm ml-2 font-body">
                  one-time payment
                </span>
              </div>
            ) : (
              <div className="mb-6">
                <span className="text-5xl font-heading font-black text-gradient-gold">Free</span>
              </div>
            )}

            <ul className="space-y-3 mb-8 text-left">
              {includes.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-foreground font-body">
                  <Icon className="w-4 h-4 text-primary shrink-0" />
                  {label}
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              onClick={onEnrollClick}
              className="w-full btn-primary text-lg py-6 font-heading font-bold shadow-glow"
            >
              {pricing ? `Enroll for $${pricing.price}` : "Enroll for Free"}
            </Button>

            <p className="text-xs text-muted-foreground mt-4 font-body">
              30-day money-back guarantee · Instant access
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const FAQSection = ({
  course,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const faqs = course.pages?.faq ?? [];
  if (!faqs.length) return null;

  return (
    <section className="py-[60px] px-6 bg-background relative radial-glow">
      <div className="max-w-2xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="premium-card px-6 border-none"
              >
                <AccordionTrigger className="text-foreground text-sm font-heading font-semibold hover:no-underline hover:text-primary py-5">
                  {f.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-sm leading-relaxed font-body pb-5">
                  {f.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
};

const WhoIsForSection = ({
  course,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const audience = course.pages?.target_audience;
  if (!audience) return null;

  return (
    <section className="py-[60px] px-6 bg-background">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="premium-card p-8 flex flex-col sm:flex-row items-center gap-6"
        >
          <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center shrink-0">
            <Users className="w-7 h-7 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-foreground mb-2">
              Who Is This Course For?
            </h2>
            <p className="text-muted-foreground text-sm font-body leading-relaxed">
              {audience}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const CourseIncludesSection = ({
  course,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const items = [
    { icon: BookOpen, label: `${course.modules.length} comprehensive modules` },
    { icon: FileText, label: `${course.modules.reduce((s, m) => s + m.lessons.length, 0)} lessons` },
    { icon: Infinity, label: "Lifetime access" },
    { icon: Award, label: "Certificate of completion" },
  ];

  return (
    <section className="py-[60px] px-6 bg-background">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
            This Course Includes
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 gap-4"
        >
          {items.map(({ icon: Icon, label }, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="premium-card p-5 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-foreground text-sm font-body">{label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const GuaranteeSection = () => (
  <section className="py-[60px] px-6 bg-background">
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="premium-card p-8 text-center flex flex-col items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center">
          <Shield className="w-7 h-7 text-primary-foreground" />
        </div>
        <h3 className="text-xl font-heading font-bold text-foreground">
          30-Day Money-Back Guarantee
        </h3>
        <p className="text-muted-foreground text-sm font-body max-w-md">
          If you're not completely satisfied, get a full refund within 30 days. No questions asked.
        </p>
      </motion.div>
    </div>
  </section>
);

const BonusesSection = ({
  course,
}: {
  course: ExtendedCourse;
  style: ReturnType<typeof getLayoutStyleConfig>;
}) => {
  const bonuses = course.pages?.included_bonuses ?? [];
  if (!bonuses.length) return null;

  return (
    <section className="py-[60px] px-6 bg-background">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Bonus Materials
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid sm:grid-cols-2 gap-4"
        >
          {bonuses.map((b, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="premium-card p-6 flex gap-4 items-start"
            >
              <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shrink-0">
                <Gift className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-foreground text-sm font-body">{b}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const CommunitySection = () => (
  <section className="py-[60px] px-6 bg-background">
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="premium-card p-8 text-center flex flex-col items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center">
          <MessageCircle className="w-7 h-7 text-primary-foreground" />
        </div>
        <h3 className="text-xl font-heading font-bold text-foreground">
          Join Our Community
        </h3>
        <p className="text-muted-foreground text-sm font-body max-w-md">
          Connect with fellow students, share progress, and get support from instructors in our private community.
        </p>
      </motion.div>
    </div>
  </section>
);

const CertificateSection = () => (
  <section className="py-[60px] px-6 bg-background">
    <div className="max-w-2xl mx-auto">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="premium-card p-8 text-center flex flex-col items-center gap-4"
      >
        <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center">
          <Award className="w-7 h-7 text-primary-foreground" />
        </div>
        <h3 className="text-xl font-heading font-bold text-foreground">
          Certificate of Completion
        </h3>
        <p className="text-muted-foreground text-sm font-body max-w-md">
          Earn a verifiable certificate upon completing all modules to showcase your achievement.
        </p>
      </motion.div>
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
  guarantee: ({ style }) => <GuaranteeSection />,
  bonuses: ({ course, style }) => (
    <BonusesSection course={course} style={style} />
  ),
  community: ({ style }) => <CommunitySection />,
  certificate: ({ style }) => <CertificateSection />,
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
      "testimonials",
      "pricing",
      "guarantee",
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
      <section className="py-20 px-6 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none" />
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="max-w-2xl mx-auto text-center relative z-10"
        >
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-muted-foreground mb-8 font-body text-lg">
            Join students already enrolled and start your learning journey today.
          </p>
          <Button
            size="lg"
            onClick={onEnrollClick}
            className="btn-primary text-lg px-10 py-6 font-heading font-bold shadow-glow"
          >
            Enroll Now
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </section>
    </div>
  );
};

export default CourseLandingPreview;
