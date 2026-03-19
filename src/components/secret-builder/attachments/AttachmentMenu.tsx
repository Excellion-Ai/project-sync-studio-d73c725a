import { useRef } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Paperclip, FileUp, Camera, Type, Link, Palette } from "lucide-react";
import type { AttachmentItem } from "./types";

interface AttachmentMenuProps {
  onAdd: (item: AttachmentItem) => void;
  disabled?: boolean;
}

const AttachmentMenu = ({ onAdd, disabled }: AttachmentMenuProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onAdd({
      id: crypto.randomUUID(),
      name: file.name,
      type: "file",
      mimeType: file.type,
      size: file.size,
    });
    e.target.value = "";
  };

  const handleScreenshot = () => {
    onAdd({ id: crypto.randomUUID(), name: "Screenshot", type: "screenshot" });
  };

  const handleText = () => {
    const text = prompt("Enter text to attach:");
    if (text?.trim()) {
      onAdd({ id: crypto.randomUUID(), name: text.slice(0, 30) + (text.length > 30 ? "…" : ""), type: "text", content: text });
    }
  };

  const handleLink = () => {
    const url = prompt("Enter URL:");
    if (url?.trim()) {
      onAdd({ id: crypto.randomUUID(), name: url.slice(0, 40), type: "link", url });
    }
  };

  const handleBrandKit = () => {
    onAdd({ id: crypto.randomUUID(), name: "Brand Kit", type: "brandkit" });
  };

  return (
    <>
      <input ref={fileRef} type="file" className="hidden" onChange={handleFileSelect} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled}>
            <Paperclip className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44">
          <DropdownMenuItem onClick={() => fileRef.current?.click()}>
            <FileUp className="h-4 w-4 mr-2" /> Upload File
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleScreenshot}>
            <Camera className="h-4 w-4 mr-2" /> Screenshot
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleText}>
            <Type className="h-4 w-4 mr-2" /> Text Note
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLink}>
            <Link className="h-4 w-4 mr-2" /> Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleBrandKit}>
            <Palette className="h-4 w-4 mr-2" /> Brand Kit
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export default AttachmentMenu;
