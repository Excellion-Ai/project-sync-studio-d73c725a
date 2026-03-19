import SectionEditor from "./SectionEditor";
import { LANDING_SECTIONS, DEFAULT_PAGE_SECTIONS } from "./sectionConfigs";

interface LandingSectionEditorProps {
  enabledSections: string[];
  sectionOrder: string[];
  onEnabledChange: (enabled: string[]) => void;
  onOrderChange: (order: string[]) => void;
}

const LandingSectionEditor = ({
  enabledSections,
  sectionOrder,
  onEnabledChange,
  onOrderChange,
}: LandingSectionEditorProps) => {
  const order = sectionOrder.length > 0 ? sectionOrder : DEFAULT_PAGE_SECTIONS.landing;

  const handleToggle = (id: string) => {
    const updated = enabledSections.includes(id)
      ? enabledSections.filter((s) => s !== id)
      : [...enabledSections, id];
    onEnabledChange(updated);
  };

  const handleAdd = (id: string) => {
    if (!order.includes(id)) onOrderChange([...order, id]);
    if (!enabledSections.includes(id)) onEnabledChange([...enabledSections, id]);
  };

  const handleRemove = (id: string) => {
    onOrderChange(order.filter((s) => s !== id));
    onEnabledChange(enabledSections.filter((s) => s !== id));
  };

  return (
    <SectionEditor
      allSections={LANDING_SECTIONS}
      enabledSections={enabledSections}
      sectionOrder={order}
      onOrderChange={onOrderChange}
      onToggleSection={handleToggle}
      onAddSection={handleAdd}
      onRemoveSection={handleRemove}
    />
  );
};

export default LandingSectionEditor;
