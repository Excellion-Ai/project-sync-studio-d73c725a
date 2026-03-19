import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import SortableSection from "./SortableSection";
import type { SectionConfig } from "./sectionConfigs";

interface SectionEditorProps {
  allSections: SectionConfig[];
  enabledSections: string[];
  sectionOrder: string[];
  onOrderChange: (order: string[]) => void;
  onToggleSection: (id: string) => void;
  onAddSection?: (id: string) => void;
  onRemoveSection?: (id: string) => void;
}

const SectionEditor = ({
  allSections,
  enabledSections,
  sectionOrder,
  onOrderChange,
  onToggleSection,
  onAddSection,
  onRemoveSection,
}: SectionEditorProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const orderedSections = sectionOrder
    .map((id) => allSections.find((s) => s.id === id))
    .filter(Boolean) as SectionConfig[];

  const availableToAdd = allSections.filter((s) => !sectionOrder.includes(s.id));

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = sectionOrder.indexOf(active.id as string);
        const newIndex = sectionOrder.indexOf(over.id as string);
        onOrderChange(arrayMove(sectionOrder, oldIndex, newIndex));
      }
    },
    [sectionOrder, onOrderChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Sections</p>
        {availableToAdd.length > 0 && onAddSection && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                <Plus className="h-3 w-3" /> Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {availableToAdd.map((s) => (
                <DropdownMenuItem key={s.id} onClick={() => onAddSection(s.id)}>
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {orderedSections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                isEnabled={enabledSections.includes(section.id)}
                onToggle={onToggleSection}
                onRemove={onRemoveSection}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};

export default SectionEditor;
