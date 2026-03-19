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

export interface EditTarget {
  label: string;
  type: "text" | "textarea" | "number" | "url";
  value: string;
  onSave: (newValue: string) => void;
}

interface InlineEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: EditTarget | null;
}

const InlineEditModal = ({
  open,
  onOpenChange,
  target,
}: InlineEditModalProps) => {
  const [value, setValue] = useState(target?.value || "");

  // Sync when target changes
  if (target && value === "" && target.value !== "") {
    setValue(target.value);
  }

  const handleSave = () => {
    if (target) {
      target.onSave(value);
    }
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && target) {
      setValue(target.value);
    }
    onOpenChange(isOpen);
  };

  if (!target) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit {target.label}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <Label>{target.label}</Label>
          {target.type === "textarea" ? (
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              rows={5}
              autoFocus
            />
          ) : (
            <Input
              type={target.type === "number" ? "number" : "text"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InlineEditModal;
