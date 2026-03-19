export interface SectionConfig {
  id: string;
  label: string;
  description: string;
  defaultEnabled: boolean;
}

export const LANDING_SECTIONS: SectionConfig[] = [
  { id: "hero", label: "Hero", description: "Main headline, tagline, and CTA", defaultEnabled: true },
  { id: "outcomes", label: "Outcomes", description: "What students will learn", defaultEnabled: true },
  { id: "curriculum", label: "Curriculum", description: "Course modules and lessons", defaultEnabled: true },
  { id: "instructor", label: "Instructor", description: "About the instructor", defaultEnabled: true },
  { id: "testimonials", label: "Testimonials", description: "Student reviews and social proof", defaultEnabled: true },
  { id: "features", label: "Features", description: "Key course features and benefits", defaultEnabled: false },
  { id: "faq", label: "FAQ", description: "Frequently asked questions", defaultEnabled: true },
  { id: "guarantee", label: "Guarantee", description: "Money-back guarantee section", defaultEnabled: false },
  { id: "bonus", label: "Bonus", description: "Bonus materials and extras", defaultEnabled: false },
  { id: "cta", label: "CTA", description: "Final call to action", defaultEnabled: true },
];

export const CURRICULUM_SECTIONS: SectionConfig[] = [
  { id: "module_list", label: "Module List", description: "All modules with lessons", defaultEnabled: true },
  { id: "progress_bar", label: "Progress Bar", description: "Student progress overview", defaultEnabled: true },
  { id: "resources", label: "Resources", description: "Downloadable materials", defaultEnabled: true },
];

export const LESSON_SECTIONS: SectionConfig[] = [
  { id: "video_player", label: "Video Player", description: "Main lesson video", defaultEnabled: true },
  { id: "lesson_content", label: "Content", description: "Lesson text and rich content", defaultEnabled: true },
  { id: "quiz", label: "Quiz", description: "Lesson quiz or assessment", defaultEnabled: true },
  { id: "resources", label: "Resources", description: "Lesson-specific resources", defaultEnabled: true },
  { id: "comments", label: "Comments", description: "Student discussion area", defaultEnabled: false },
];

export const DASHBOARD_SECTIONS: SectionConfig[] = [
  { id: "progress_overview", label: "Progress Overview", description: "Overall course progress", defaultEnabled: true },
  { id: "recent_activity", label: "Recent Activity", description: "Last accessed lessons", defaultEnabled: true },
  { id: "achievements", label: "Achievements", description: "Badges and certificates", defaultEnabled: true },
  { id: "community", label: "Community", description: "Student community feed", defaultEnabled: false },
];

export const DEFAULT_PAGE_SECTIONS: Record<string, string[]> = {
  landing: LANDING_SECTIONS.filter((s) => s.defaultEnabled).map((s) => s.id),
  curriculum: CURRICULUM_SECTIONS.filter((s) => s.defaultEnabled).map((s) => s.id),
  lesson: LESSON_SECTIONS.filter((s) => s.defaultEnabled).map((s) => s.id),
  dashboard: DASHBOARD_SECTIONS.filter((s) => s.defaultEnabled).map((s) => s.id),
};

export function getSectionsForPage(page: string): SectionConfig[] {
  switch (page) {
    case "landing": return LANDING_SECTIONS;
    case "curriculum": return CURRICULUM_SECTIONS;
    case "lesson": return LESSON_SECTIONS;
    case "dashboard": return DASHBOARD_SECTIONS;
    default: return LANDING_SECTIONS;
  }
}
