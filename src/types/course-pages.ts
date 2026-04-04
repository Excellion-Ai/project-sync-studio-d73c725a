// ── Type Unions ──────────────────────────────────────────────

export type LandingSectionType =
  | 'hero' | 'outcomes' | 'curriculum' | 'instructor' | 'pricing'
  | 'faq' | 'who_is_for' | 'course_includes' | 'testimonials'
  | 'guarantee' | 'bonuses' | 'community' | 'certificate';

export type CourseLayoutStyle = 'creator' | 'technical' | 'academic' | 'visual';

export type CoursePageType =
  | 'landing' | 'curriculum' | 'bonuses' | 'community'
  | 'resources' | 'about' | 'testimonials' | 'faq';

// ── Interfaces ──────────────────────────────────────────────

export interface CoursePageContent {
  hero_headline?: string;
  hero_subheadline?: string;
  sections?: LandingSectionType[];
  bonuses?: string[];
  resources?: string[];
  communityDescription?: string;
  testimonials?: Array<{ name: string; text: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  instructorBio?: string;
}

export interface CoursePage {
  id: string;
  type: CoursePageType;
  title: string;
  slug: string;
  content: CoursePageContent;
  isEnabled: boolean;
  order: number;
}

export interface CoursePages {
  landing_sections: LandingSectionType[];
  included_bonuses?: string[];
  show_guarantee?: boolean;
  target_audience?: string;
  instructor?: { name: string; bio: string; avatar?: string };
  pricing?: { price: number; currency: string; original_price?: number };
  faq?: Array<{ question: string; answer: string }>;
  separatePages?: CoursePage[];
  isMultiPage?: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

export interface LessonContent {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'text' | 'text_video' | 'quiz' | 'assignment';
  description?: string;
  is_preview?: boolean;
  content_markdown?: string;
  video_url?: string;
  quiz_questions?: QuizQuestion[];
  passing_score?: number;
  assignment_brief?: string;
  resources?: Array<{ title: string; url: string }>;
}

export interface ModuleWithContent {
  id: string;
  title: string;
  description: string;
  lessons: LessonContent[];
  has_quiz?: boolean;
  has_assignment?: boolean;
  is_first?: boolean;
  is_last?: boolean;
  total_duration?: string;
  layout_variant?: 'video_heavy' | 'text_heavy' | 'mixed' | 'project_based';
}

export type HeroLayout = 'left' | 'centered' | 'split' | 'image_background';

export interface DesignConfig {
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    cardBackground?: string;
    text?: string;
    textMuted?: string;
  };
  fonts?: { heading?: string; body?: string };
  spacing?: 'compact' | 'normal' | 'spacious';
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
  heroStyle?: string;
  heroLayout?: HeroLayout;
  heroImage?: string;
  backgrounds?: { hero?: string; curriculum?: string; cta?: string };
  logoUrl?: string;
}

export interface ExtendedCourse {
  id?: string;
  title: string;
  description: string;
  tagline?: string;
  difficulty: string;
  duration_weeks: number;
  modules: ModuleWithContent[];
  learningOutcomes?: string[];
  thumbnail?: string;
  brand_color?: string;
  pages?: CoursePages;
  layout_style?: CourseLayoutStyle;
  design_config?: DesignConfig;
  layout_template?: string;
  section_order?: string[];
  separatePages?: CoursePage[];
  isMultiPage?: boolean;
}

export interface LayoutStyleConfig {
  containerClass: string;
  cardClass: string;
  headingClass: string;
  accentColor: string;
  primaryHex: string;
  moduleLayout: 'timeline' | 'accordion' | 'numbered' | 'grid';
  cardRadius: string;
  bgGradient: string;
  heroGradient: string;
  fontStyle?: string;
  headingFont?: string;
  showInstructorLarge?: boolean;
  showCertificate?: boolean;
  showTestimonials?: boolean;
  codeBlockStyle?: boolean;
  compactDensity?: boolean;
  imageHeavy?: boolean;
}

// ── Utility Functions ───────────────────────────────────────

export function getLayoutStyleConfig(style: CourseLayoutStyle): LayoutStyleConfig {
  const configs: Record<CourseLayoutStyle, LayoutStyleConfig> = {
    creator: {
      containerClass: 'max-w-5xl mx-auto',
      cardClass: 'bg-amber-950/30 border-amber-800/30',
      headingClass: 'text-amber-100 font-bold',
      accentColor: 'amber',
      primaryHex: '#f59e0b',
      moduleLayout: 'timeline',
      cardRadius: 'rounded-xl',
      bgGradient: 'from-amber-950/20 via-background to-background',
      heroGradient: 'from-amber-500 to-orange-500',
      showInstructorLarge: true,
      showTestimonials: true,
    },
    technical: {
      containerClass: 'max-w-6xl mx-auto',
      cardClass: 'bg-emerald-950/30 border-emerald-800/30',
      headingClass: 'text-emerald-100 font-semibold',
      accentColor: 'emerald',
      primaryHex: '#10b981',
      moduleLayout: 'accordion',
      cardRadius: 'rounded',
      bgGradient: 'from-emerald-950/20 via-background to-background',
      heroGradient: 'from-emerald-600 to-teal-600',
      fontStyle: 'font-mono',
      codeBlockStyle: true,
      compactDensity: true,
    },
    academic: {
      containerClass: 'max-w-4xl mx-auto',
      cardClass: 'bg-stone-50 border-stone-200 dark:bg-stone-900/40 dark:border-stone-700/30',
      headingClass: 'text-stone-900 dark:text-stone-100 font-semibold',
      accentColor: 'blue',
      primaryHex: '#1e40af',
      moduleLayout: 'numbered',
      cardRadius: 'rounded-sm',
      bgGradient: 'bg-stone-50 dark:bg-stone-950',
      heroGradient: 'from-blue-800 to-blue-950',
      headingFont: 'font-serif',
      showCertificate: true,
    },
    visual: {
      containerClass: 'max-w-6xl mx-auto',
      cardClass: 'bg-white/5 border-violet-500/20 backdrop-blur',
      headingClass: 'text-violet-100 font-bold',
      accentColor: 'violet',
      primaryHex: '#8b5cf6',
      moduleLayout: 'grid',
      cardRadius: 'rounded-2xl',
      bgGradient: 'from-violet-950/30 via-fuchsia-950/20 to-background',
      heroGradient: 'from-violet-500 to-fuchsia-500',
      imageHeavy: true,
    },
  };
  return configs[style];
}

export function getModuleLayoutVariant(module: ModuleWithContent): ModuleWithContent['layout_variant'] {
  const { lessons } = module;
  if (!lessons.length) return 'mixed';

  const videoCount = lessons.filter(l => l.type === 'video' || l.type === 'text_video').length;
  const textCount = lessons.filter(l => l.type === 'text').length;
  const assignmentCount = lessons.filter(l => l.type === 'assignment').length;

  if (assignmentCount >= lessons.length * 0.4) return 'project_based';
  if (videoCount >= lessons.length * 0.6) return 'video_heavy';
  if (textCount >= lessons.length * 0.6) return 'text_heavy';
  return 'mixed';
}

export function calculateModuleDuration(lessons: LessonContent[]): string {
  let totalMinutes = 0;

  for (const lesson of lessons) {
    const dur = lesson.duration?.trim() ?? '';
    // Match patterns like "1h 30m", "45m", "1h", "90 min", "1.5 hours"
    const hoursMatch = dur.match(/([\d.]+)\s*h/i);
    const minutesMatch = dur.match(/([\d.]+)\s*m/i);

    if (hoursMatch) totalMinutes += parseFloat(hoursMatch[1]) * 60;
    if (minutesMatch) totalMinutes += parseFloat(minutesMatch[1]);

    // Fallback: bare number treated as minutes
    if (!hoursMatch && !minutesMatch) {
      const num = parseFloat(dur);
      if (!isNaN(num)) totalMinutes += num;
    }
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);

  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export function formatSectionNumber(moduleIdx: number, lessonIdx?: number): string {
  const mod = moduleIdx + 1;
  if (lessonIdx === undefined) return `${mod}.0`;
  return `${mod}.${lessonIdx + 1}`;
}
