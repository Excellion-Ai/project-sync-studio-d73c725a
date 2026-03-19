export interface AttachmentItem {
  id: string;
  name: string;
  type: "file" | "screenshot" | "text" | "link" | "brandkit";
  url?: string;
  content?: string;
  mimeType?: string;
  size?: number;
}
