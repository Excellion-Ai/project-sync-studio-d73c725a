import { useCallback } from "react";

interface SiteData {
  hero?: { headline?: string; subheadline?: string; cta_text?: string; image?: string };
  features?: Array<{ title: string; description: string; icon?: string }>;
  name?: string;
  nav?: Array<{ label: string; href: string }>;
  sections?: string[];
  pages?: Array<{ id: string; title: string; slug: string }>;
  [key: string]: unknown;
}

export function useSiteEditor(
  site: SiteData,
  onUpdate: (updated: SiteData) => void
) {
  const updateHeroContent = useCallback(
    (fields: Partial<NonNullable<SiteData["hero"]>>) => {
      onUpdate({ ...site, hero: { ...site.hero, ...fields } });
    },
    [site, onUpdate]
  );

  const updateFeaturesContent = useCallback(
    (features: NonNullable<SiteData["features"]>) => {
      onUpdate({ ...site, features });
    },
    [site, onUpdate]
  );

  const updateFeatureItem = useCallback(
    (index: number, fields: Partial<{ title: string; description: string; icon: string }>) => {
      const features = [...(site.features ?? [])];
      features[index] = { ...features[index], ...fields };
      onUpdate({ ...site, features });
    },
    [site, onUpdate]
  );

  const updateSiteName = useCallback(
    (name: string) => {
      onUpdate({ ...site, name });
    },
    [site, onUpdate]
  );

  const updateNavItem = useCallback(
    (index: number, fields: Partial<{ label: string; href: string }>) => {
      const nav = [...(site.nav ?? [])];
      nav[index] = { ...nav[index], ...fields };
      onUpdate({ ...site, nav });
    },
    [site, onUpdate]
  );

  const reorderSections = useCallback(
    (sections: string[]) => {
      onUpdate({ ...site, sections });
    },
    [site, onUpdate]
  );

  const addPage = useCallback(
    (page: { id: string; title: string; slug: string }) => {
      onUpdate({ ...site, pages: [...(site.pages ?? []), page] });
    },
    [site, onUpdate]
  );

  const removePage = useCallback(
    (pageId: string) => {
      onUpdate({
        ...site,
        pages: (site.pages ?? []).filter((p) => p.id !== pageId),
      });
    },
    [site, onUpdate]
  );

  const renamePage = useCallback(
    (pageId: string, title: string) => {
      onUpdate({
        ...site,
        pages: (site.pages ?? []).map((p) =>
          p.id === pageId ? { ...p, title } : p
        ),
      });
    },
    [site, onUpdate]
  );

  const updateSection = useCallback(
    (sectionKey: string, data: unknown) => {
      onUpdate({ ...site, [sectionKey]: data });
    },
    [site, onUpdate]
  );

  return {
    updateHeroContent,
    updateFeaturesContent,
    updateFeatureItem,
    updateSiteName,
    updateNavItem,
    reorderSections,
    addPage,
    removePage,
    renamePage,
    updateSection,
  };
}
