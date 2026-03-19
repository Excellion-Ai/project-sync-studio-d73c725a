import { useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableOverlayProps {
  children: React.ReactNode;
  label?: string;
  onEdit: () => void;
  className?: string;
  enabled?: boolean;
}

const EditableOverlay = ({
  children,
  label,
  onEdit,
  className,
  enabled = true,
}: EditableOverlayProps) => {
  const [hovered, setHovered] = useState(false);

  if (!enabled) return <>{children}</>;

  return (
    <div
      className={cn("relative group", className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}

      {/* Hover overlay */}
      <div
        className={cn(
          "absolute inset-0 z-10 transition-all pointer-events-none",
          hovered
            ? "ring-2 ring-primary/50 bg-primary/5"
            : "ring-0 bg-transparent"
        )}
      />

      {/* Edit button */}
      {hovered && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-2 right-2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary text-primary-foreground text-xs font-medium shadow-lg hover:bg-primary/90 transition-colors"
        >
          <Pencil className="w-3 h-3" />
          {label || "Edit"}
        </button>
      )}
    </div>
  );
};

export default EditableOverlay;
