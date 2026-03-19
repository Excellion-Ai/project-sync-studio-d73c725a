import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark, Plus, Trash2, ExternalLink } from "lucide-react";

interface BookmarkItem {
  id: string;
  label: string;
  url: string;
}

const BookmarksPanel = () => {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");

  const addBookmark = () => {
    if (!label.trim() || !url.trim()) return;
    setBookmarks((prev) => [...prev, { id: crypto.randomUUID(), label: label.trim(), url: url.trim() }]);
    setLabel("");
    setUrl("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground">
        <Bookmark className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold">Bookmarks</h3>
      </div>

      <div className="space-y-2">
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" />
        <div className="flex gap-2">
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="flex-1" />
          <Button size="icon" onClick={addBookmark} disabled={!label.trim() || !url.trim()} className="shrink-0">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {bookmarks.map((b) => (
        <Card key={b.id} className="border-border/50">
          <CardContent className="flex items-center justify-between py-2 px-3">
            <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-sm text-foreground hover:text-primary transition-colors truncate">
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              {b.label}
            </a>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setBookmarks((prev) => prev.filter((x) => x.id !== b.id))}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </CardContent>
        </Card>
      ))}

      {bookmarks.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No bookmarks yet</p>
      )}
    </div>
  );
};

export default BookmarksPanel;
