import { useRef, useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Paperclip, FileUp, Type, Link, Palette, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { AttachmentItem } from "./types";

// ── PDF extraction using pdf.js ─────────────────────────────

async function extractPdfText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();

  // Method 1: Try pdf.js (works for most text-based PDFs)
  try {
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    const pages: string[] = [];
    const maxPages = Math.min(pdf.numPages, 50);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      if (!content.items.length) continue;

      // Reconstruct text with proper spacing and line breaks
      let lastY: number | null = null;
      const lines: string[] = [];
      let currentLine = "";

      for (const item of content.items as any[]) {
        if (!item.str) continue;

        // Detect line breaks by checking Y position change
        const y = item.transform?.[5];
        if (lastY !== null && y !== undefined && Math.abs(y - lastY) > 2) {
          if (currentLine.trim()) lines.push(currentLine.trim());
          currentLine = "";
        }
        lastY = y;

        // Add space between items on the same line
        if (currentLine && !currentLine.endsWith(" ") && !item.str.startsWith(" ")) {
          currentLine += " ";
        }
        currentLine += item.str;
      }
      if (currentLine.trim()) lines.push(currentLine.trim());

      const pageText = lines.join("\n");
      if (pageText.trim()) pages.push(pageText);
    }

    const pdfJsResult = pages.join("\n\n");
    if (pdfJsResult.length > 100) {
      console.log(`PDF extraction (pdf.js): ${pdfJsResult.length} chars from ${maxPages} pages`);
      return pdfJsResult;
    }
    console.warn(`PDF extraction (pdf.js): only ${pdfJsResult.length} chars — trying fallback`);
  } catch (err) {
    console.warn("pdf.js extraction failed:", err);
  }

  // Method 2: Raw binary text extraction fallback
  // Works for PDFs where pdf.js fails (embedded fonts, unusual encoding)
  try {
    const bytes = new Uint8Array(buffer);
    const raw = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    const textChunks: string[] = [];

    // Extract text from PDF stream objects between BT/ET markers
    const streamRegex = /BT\s([\s\S]*?)ET/g;
    let streamMatch;
    while ((streamMatch = streamRegex.exec(raw)) !== null) {
      const stream = streamMatch[1];
      // Extract text inside parentheses (PDF literal strings)
      const parenRegex = /\(([^)]*)\)/g;
      let pm;
      while ((pm = parenRegex.exec(stream)) !== null) {
        const text = pm[1]
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "")
          .replace(/\\\\/g, "\\")
          .replace(/\\([()])/g, "$1");
        if (text.length > 1 && /[a-zA-Z]/.test(text)) {
          textChunks.push(text);
        }
      }
      // Also extract hex strings <...>
      const hexRegex = /<([0-9a-fA-F]+)>/g;
      let hm;
      while ((hm = hexRegex.exec(stream)) !== null) {
        const hex = hm[1];
        let decoded = "";
        for (let i = 0; i < hex.length - 1; i += 2) {
          const code = parseInt(hex.substring(i, i + 2), 16);
          if (code >= 32 && code < 127) decoded += String.fromCharCode(code);
        }
        if (decoded.length > 1 && /[a-zA-Z]/.test(decoded)) {
          textChunks.push(decoded);
        }
      }
    }

    // Also try extracting readable ASCII strings (4+ chars) from the entire binary
    if (textChunks.length < 10) {
      const asciiStrings = raw.match(/[\x20-\x7E]{6,}/g) || [];
      const filtered = asciiStrings.filter((s) =>
        /[a-zA-Z]{2,}/.test(s) &&
        !/^[%\/\[\]<>{}()\\]+$/.test(s) &&
        !s.startsWith("/") &&
        !s.includes("obj") &&
        !s.includes("endobj") &&
        !s.includes("stream") &&
        s.length < 500
      );
      textChunks.push(...filtered);
    }

    const fallbackResult = textChunks.join(" ").replace(/\s+/g, " ").trim();
    if (fallbackResult.length > 100) {
      console.log(`PDF extraction (fallback): ${fallbackResult.length} chars`);
      return fallbackResult;
    }
  } catch (err) {
    console.warn("PDF fallback extraction failed:", err);
  }

  return `[PDF: ${file.name} — ${(file.size / 1024).toFixed(0)}KB, ${Math.round(file.size / 1024 / 40)} estimated pages. This PDF may contain scanned images instead of text. Try copying the text manually and pasting it as a Text Note instead.]`;
}

// ── DOCX extraction using JSZip ─────────────────────────────

async function extractDocxText(file: File): Promise<string> {
  try {
    const JSZip = (await import("jszip")).default;
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    // DOCX is a ZIP containing word/document.xml
    const docXml = await zip.file("word/document.xml")?.async("text");
    if (!docXml) return `[DOCX: ${file.name} — could not find document.xml]`;

    // Extract text from <w:t> tags, with paragraph breaks
    const paragraphs: string[] = [];
    // Split by paragraph markers
    const paraRegex = /<w:p[^>]*>([\s\S]*?)<\/w:p>/g;
    let paraMatch;
    while ((paraMatch = paraRegex.exec(docXml)) !== null) {
      const paraContent = paraMatch[1];
      const texts: string[] = [];
      const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
      let textMatch;
      while ((textMatch = textRegex.exec(paraContent)) !== null) {
        texts.push(textMatch[1]);
      }
      const line = texts.join("");
      if (line.trim()) paragraphs.push(line.trim());
    }

    const result = paragraphs.join("\n");
    if (result.length > 20) return result;
    return `[DOCX: ${file.name} — text extraction returned minimal content]`;
  } catch (err) {
    console.error("DOCX extraction failed:", err);
    return `[DOCX: ${file.name} — could not extract text. ${(file.size / 1024).toFixed(0)}KB]`;
  }
}

// ── Main extraction function ────────────────────────────────

async function extractFileContent(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  // PDF
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return extractPdfText(file);
  }

  // DOCX
  if (name.endsWith(".docx") || file.type.includes("wordprocessingml")) {
    return extractDocxText(file);
  }

  // Plain text and code files
  const textExtensions = [
    ".txt", ".md", ".csv", ".json", ".xml", ".html", ".htm",
    ".js", ".ts", ".jsx", ".tsx", ".py", ".rb", ".yml", ".yaml",
    ".rtf", ".log", ".ini", ".cfg", ".env", ".sql", ".sh",
  ];
  const isText = file.type.startsWith("text/")
    || file.type === "application/json"
    || file.type === "application/xml"
    || textExtensions.some((ext) => name.endsWith(ext))
    || file.type === "";

  if (isText) {
    return file.text();
  }

  // Old .doc format (binary) — try reading as text, often has readable strings
  if (name.endsWith(".doc") && !name.endsWith(".docx")) {
    try {
      const buffer = await file.arrayBuffer();
      const raw = new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(buffer));
      // Extract readable ASCII strings (4+ chars)
      const strings = raw.match(/[\x20-\x7E]{4,}/g) || [];
      const cleaned = strings
        .filter((s) => /[a-zA-Z]/.test(s) && s.length > 5)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (cleaned.length > 50) return cleaned;
    } catch { /* fall through */ }
    return `[DOC: ${file.name} — legacy .doc format, limited text extraction. ${(file.size / 1024).toFixed(0)}KB]`;
  }

  // Images
  if (file.type.startsWith("image/")) {
    return `[Image: ${file.name} — ${(file.size / 1024).toFixed(0)}KB. Upload images via the hero image or thumbnail settings instead.]`;
  }

  // Unknown — try reading as text
  try {
    const text = await file.text();
    if (text.length > 10 && /[a-zA-Z]/.test(text)) return text;
  } catch { /* ignore */ }

  return `[Unsupported file: ${file.name} — ${file.type || "unknown type"}, ${(file.size / 1024).toFixed(0)}KB. Try .pdf, .docx, .txt, .md, or .csv]`;
}

// ── Component ───────────────────────────────────────────────

const MAX_CONTENT_LENGTH = 15000;

interface AttachmentMenuProps {
  onAdd: (item: AttachmentItem) => void;
  disabled?: boolean;
}

const AttachmentMenu = ({ onAdd, disabled }: AttachmentMenuProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File too large (max 10MB)");
      e.target.value = "";
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading(`Reading ${file.name}...`);

    try {
      let content = await extractFileContent(file);

      if (content.length > MAX_CONTENT_LENGTH) {
        content = content.slice(0, MAX_CONTENT_LENGTH) +
          `\n\n[... truncated, ${file.name} was ${(file.size / 1024).toFixed(0)}KB total]`;
      }

      onAdd({
        id: crypto.randomUUID(),
        name: file.name,
        type: "file",
        mimeType: file.type,
        size: file.size,
        content,
      });

      // Show preview of what was extracted
      const preview = content.slice(0, 100).replace(/\n/g, " ");
      toast.success(`${file.name} attached — ${content.length.toLocaleString()} chars extracted`, {
        id: toastId,
        description: preview + (content.length > 100 ? "..." : ""),
      });
    } catch (err) {
      console.error("File read error:", err);
      toast.error(`Failed to read ${file.name}`, { id: toastId });
    }

    setIsProcessing(false);
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
        accept=".txt,.md,.csv,.json,.pdf,.docx,.doc,.rtf,.html,.xml,.yaml,.yml,.py,.js,.ts,.sql"
        onChange={handleFileSelect}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={disabled || isProcessing}>
            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
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
