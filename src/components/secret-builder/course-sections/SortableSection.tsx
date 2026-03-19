import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SectionConfig } from "./sectionConfigs";

interface SortableSectionProps {
  section: SectionConfig;
  isEnabled: boolean;
  onToggle: (id: string) => void;
  onRemove?: (id: string) => void;
}

const SortableSection = ({ section, isEnabled, onToggle, onRemove }: SortableSectionProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-md border px-3 py-2 transition-colors",
        isDragging ? "z-50 border-primary bg-primary/5 shadow-lg" : "border-border bg-card",
        !isEnabled && "opacity-50"
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab touch-none text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{section.label}</p>
        <p className="text-xs text-muted-foreground truncate">{section.description}</p>
      </div>

      <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => onToggle(section.id)}>
        {isEnabled ? <Eye className="h-3.5 w-3.5 text-foreground" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
      </Button>

      {onRemove && (
        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onRemove(section.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
};

export default SortableSection;
