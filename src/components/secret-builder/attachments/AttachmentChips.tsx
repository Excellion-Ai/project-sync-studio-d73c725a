import { Badge } from "@/components/ui/badge";
import { X, FileUp, Camera, Type, Link, Palette } from "lucide-react";
import type { AttachmentItem } from "./types";

const ICONS: Record<AttachmentItem["type"], typeof FileUp> = {
  file: FileUp,
  screenshot: Camera,
  text: Type,
  link: Link,
  brandkit: Palette,
};

interface AttachmentChipsProps {
  items: AttachmentItem[];
  onRemove: (id: string) => void;
}

const AttachmentChips = ({ items, onRemove }: AttachmentChipsProps) => {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => {
        const Icon = ICONS[item.type] ?? FileUp;
        return (
          <Badge key={item.id} variant="secondary" className="gap-1 text-xs pr-1 max-w-[180px]">
            <Icon className="h-3 w-3 shrink-0" />
            <span className="truncate">{item.name}</span>
            <button onClick={() => onRemove(item.id)} className="ml-0.5 hover:text-destructive shrink-0">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        );
      })}
    </div>
  );
};

export default AttachmentChips;
