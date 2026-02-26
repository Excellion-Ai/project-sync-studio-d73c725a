import { lazy, ComponentType } from "react";

type ComponentModule = { default: ComponentType<any> };

export function lazyWithRetry(
  factory: () => Promise<ComponentModule>,
  _name?: string
): React.LazyExoticComponent<ComponentType<any>> {
  return lazy(async () => {
    const PAGE_ALREADY_FORCE_REFRESHED = "page-has-been-force-refreshed";
    try {
      const component = await factory();
      sessionStorage.removeItem(PAGE_ALREADY_FORCE_REFRESHED);
      return component;
    } catch (error) {
      const pageAlreadyForceRefreshed = JSON.parse(
        sessionStorage.getItem(PAGE_ALREADY_FORCE_REFRESHED) || "false"
      );
      if (!pageAlreadyForceRefreshed) {
        sessionStorage.setItem(PAGE_ALREADY_FORCE_REFRESHED, "true");
        window.location.reload();
        return { default: () => null } as ComponentModule;
      }
      throw error;
    }
  });
}
