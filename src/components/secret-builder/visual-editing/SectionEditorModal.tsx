import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LandingSectionType } from "@/types/course-pages";

interface SectionData {
  headline?: string;
  subheadline?: string;
  body?: string;
  items?: string[];
  backgroundImage?: string;
}

interface SectionEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionType: LandingSectionType;
  data: SectionData;
  onSave: (sectionType: LandingSectionType, data: SectionData) => void;
}

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Section",
  outcomes: "Learning Outcomes",
  curriculum: "Curriculum Overview",
  instructor: "Instructor Bio",
  testimonials: "Testimonials",
  faq: "FAQ",
  pricing: "Pricing",
  guarantee: "Guarantee",
  bonuses: "Bonuses",
  who_is_for: "Who Is This For",
  course_includes: "Course Includes",
  community: "Community",
  certificate: "Certificate",
};

const SectionEditorModal = ({
  open,
  onOpenChange,
  sectionType,
  data,
  onSave,
}: SectionEditorModalProps) => {
  const [form, setForm] = useState<SectionData>(data);

  const update = (field: keyof SectionData, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    onSave(sectionType, form);
    onOpenChange(false);
  };

  const handleItemChange = (index: number, value: string) => {
    const items = [...(form.items || [])];
    items[index] = value;
    update("items", items);
  };

  const addItem = () => update("items", [...(form.items || []), ""]);

  const removeItem = (index: number) => {
    const items = [...(form.items || [])];
    items.splice(index, 1);
    update("items", items);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {SECTION_LABELS[sectionType] || sectionType}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Headline</Label>
            <Input
              value={form.headline || ""}
              onChange={(e) => update("headline", e.target.value)}
              placeholder="Section headline"
            />
          </div>

          <div className="space-y-2">
            <Label>Subheadline</Label>
            <Input
              value={form.subheadline || ""}
              onChange={(e) => update("subheadline", e.target.value)}
              placeholder="Optional subheadline"
            />
          </div>

          <div className="space-y-2">
            <Label>Body Content</Label>
            <Textarea
              value={form.body || ""}
              onChange={(e) => update("body", e.target.value)}
              placeholder="Section content..."
              rows={4}
            />
          </div>

          {(sectionType === "outcomes" ||
            sectionType === "bonuses" ||
            sectionType === "course_includes") && (
            <div className="space-y-2">
              <Label>Items</Label>
              {(form.items || []).map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleItemChange(i, e.target.value)}
                    placeholder={`Item ${i + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(i)}
                    className="text-destructive shrink-0"
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addItem}>
                + Add Item
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <Label>Background Image URL</Label>
            <Input
              value={form.backgroundImage || ""}
              onChange={(e) => update("backgroundImage", e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SectionEditorModal;
