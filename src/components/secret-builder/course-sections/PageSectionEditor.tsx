import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SectionEditor from "./SectionEditor";
import { getSectionsForPage, DEFAULT_PAGE_SECTIONS } from "./sectionConfigs";

interface PageSections {
  [page: string]: string[];
}

interface PageSectionEditorProps {
  pageSections: PageSections;
  sectionOrders: Record<string, string[]>;
  onPageSectionsChange: (pageSections: PageSections) => void;
  onSectionOrderChange: (page: string, order: string[]) => void;
}

const PAGES = [
  { value: "landing", label: "Landing" },
  { value: "curriculum", label: "Curriculum" },
  { value: "lesson", label: "Lesson" },
  { value: "dashboard", label: "Dashboard" },
];

const PageSectionEditor = ({
  pageSections,
  sectionOrders,
  onPageSectionsChange,
  onSectionOrderChange,
}: PageSectionEditorProps) => {
  const getEnabled = (page: string) => pageSections[page] ?? DEFAULT_PAGE_SECTIONS[page] ?? [];
  const getOrder = (page: string) => {
    const order = sectionOrders[page];
    if (order?.length) return order;
    return getSectionsForPage(page).map((s) => s.id);
  };

  const handleToggle = (page: string, sectionId: string) => {
    const current = getEnabled(page);
    const updated = current.includes(sectionId)
      ? current.filter((id) => id !== sectionId)
      : [...current, sectionId];
    onPageSectionsChange({ ...pageSections, [page]: updated });
  };

  const handleAdd = (page: string, sectionId: string) => {
    const order = getOrder(page);
    if (!order.includes(sectionId)) {
      onSectionOrderChange(page, [...order, sectionId]);
    }
    const enabled = getEnabled(page);
    if (!enabled.includes(sectionId)) {
      onPageSectionsChange({ ...pageSections, [page]: [...enabled, sectionId] });
    }
  };

  const handleRemove = (page: string, sectionId: string) => {
    const order = getOrder(page).filter((id) => id !== sectionId);
    onSectionOrderChange(page, order);
    const enabled = getEnabled(page).filter((id) => id !== sectionId);
    onPageSectionsChange({ ...pageSections, [page]: enabled });
  };

  return (
    <Tabs defaultValue="landing">
      <TabsList className="w-full grid grid-cols-4">
        {PAGES.map((p) => (
          <TabsTrigger key={p.value} value={p.value} className="text-xs">
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {PAGES.map((p) => (
        <TabsContent key={p.value} value={p.value} className="mt-3">
          <SectionEditor
            allSections={getSectionsForPage(p.value)}
            enabledSections={getEnabled(p.value)}
            sectionOrder={getOrder(p.value)}
            onOrderChange={(order) => onSectionOrderChange(p.value, order)}
            onToggleSection={(id) => handleToggle(p.value, id)}
            onAddSection={(id) => handleAdd(p.value, id)}
            onRemoveSection={(id) => handleRemove(p.value, id)}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
};

export default PageSectionEditor;
