import { useRef } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Paperclip, FileUp, Type, Link, Palette } from "lucide-react";
import { toast } from "sonner";
import type { AttachmentItem } from "./types";

interface AttachmentMenuProps {
  onAdd: (item: AttachmentItem) => void;
  disabled?: boolean;
}

/** Extract text content from a File using FileReader */
async function extractFileContent(file: File): Promise<string> {
  // Plain text, markdown, CSV, JSON, code files
  const textTypes = [
    "text/", "application/json", "application/xml", "application/csv",
    "application/javascript", "application/typescript",
  ];
  const textExtensions = [
    ".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm",
    ".js", ".ts", ".jsx", ".tsx", ".py", ".rb", ".yml", ".yaml",
    ".doc", ".rtf", ".log", ".ini", ".cfg", ".env",
  ];

  const isText = textTypes.some((t) => file.type.startsWith(t))
    || textExtensions.some((ext) => file.name.toLowerCase().endsWith(ext))
    || file.type === "";

  if (isText) {
    return file.text();
  }

  // PDF — extract raw text (basic approach: read as text and strip binary)
  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    // Extract text between BT/ET markers and parentheses in PDF streams
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const textChunks: string[] = [];
    // Match text inside parentheses in PDF text objects
    const regex = /\(([^)]+)\)/g;
    let match;
    while ((match = regex.exec(raw)) !== null) {
      const chunk = match[1]
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "")
        .replace(/\\\\/g, "\\")
        .replace(/\\([()])/g, "$1");
      if (chunk.length > 2 && /[a-zA-Z]/.test(chunk)) {
        textChunks.push(chunk);
      }
    }
    const extracted = textChunks.join(" ").replace(/\s+/g, " ").trim();
    if (extracted.length > 50) return extracted;
    return `[PDF file: ${file.name} — content could not be fully extracted. File size: ${(file.size / 1024).toFixed(0)}KB]`;
  }

  // Word documents (.docx) — extract from XML inside ZIP
  if (file.name.toLowerCase().endsWith(".docx") || file.type.includes("wordprocessingml")) {
    try {
      const buffer = await file.arrayBuffer();
      const raw = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(buffer));
      // Extract text between <w:t> tags
      const texts: string[] = [];
      const tagRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
      let m;
      while ((m = tagRegex.exec(raw)) !== null) {
        texts.push(m[1]);
      }
      if (texts.length > 0) return texts.join(" ");
    } catch { /* fall through */ }
    return `[Word document: ${file.name} — ${(file.size / 1024).toFixed(0)}KB]`;
  }

  // Images — return description placeholder
  if (file.type.startsWith("image/")) {
    return `[Image file: ${file.name} — ${(file.size / 1024).toFixed(0)}KB]`;
  }

  // Unsupported — read as text anyway (might work for many formats)
  try {
    const text = await file.text();
    if (text.length > 10 && /[a-zA-Z]/.test(text)) return text;
  } catch { /* ignore */ }

  return `[File: ${file.name} — ${file.type || "unknown type"}, ${(file.size / 1024).toFixed(0)}KB]`;
}

const MAX_CONTENT_LENGTH = 15000; // ~15K chars max to avoid bloating AI prompts

const AttachmentMenu = ({ onAdd, disabled }: AttachmentMenuProps) => {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Size check: 10MB max
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      e.target.value = "";
      return;
    }

    toast.info(`Reading ${file.name}...`);

    try {
      let content = await extractFileContent(file);

      // Truncate very long content
      if (content.length > MAX_CONTENT_LENGTH) {
        content = content.slice(0, MAX_CONTENT_LENGTH) + `\n\n[... truncated, ${file.name} was ${(file.size / 1024).toFixed(0)}KB total]`;
      }

      onAdd({
        id: crypto.randomUUID(),
        name: file.name,
        type: "file",
        mimeType: file.type,
        size: file.size,
        content,
      });

      toast.success(`${file.name} attached`);
    } catch (err) {
      console.error("File read error:", err);
      toast.error(`Failed to read ${file.name}`);
    }

    e.target.value = "";
  };

  const handleText = () => {
    const text = prompt("Enter text to attach:");
    if (text?.trim()) {
      onAdd({
        id: crypto.randomUUID(),
        name: text.slice(0, 30) + (text.length > 30 ? "…" : ""),
        type: "text",
        content: text,
      });
    }
  };

  const handleLink = () => {
    const url = prompt("Enter URL:");
    if (url?.trim()) {
      onAdd({
        id: crypto.randomUUID(),
        name: url.slice(0, 40),
        type: "link",
        url,
        content: `Reference link: ${url}`,
      });
    }
  };

  const handleBrandKit = () => {
    onAdd({
      id: crypto.randomUUID(),
      name: "Brand Kit",
      type: "brandkit",
      content: "Creator wants to apply their brand kit (colors, fonts, logo) to the course.",
    });
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".txt,.md,.csv,.json,.pdf,.docx,.doc,.rtf,.html,.xml,.yaml,.yml,.py,.js,.ts"
        onChange={handleFileSelect}
      />
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
