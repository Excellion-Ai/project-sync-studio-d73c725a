import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DiffLine {
  type: "added" | "removed" | "unchanged";
  content: string;
}

interface DiffViewerProps {
  title?: string;
  lines: DiffLine[];
}

const DiffViewer = ({ title = "Changes", lines }: DiffViewerProps) => (
  <Card className="border-border/50">
    <CardHeader className="pb-2 px-4 pt-3">
      <CardTitle className="text-sm flex items-center gap-2 text-foreground">
        <GitCompare className="h-4 w-4 text-primary" />
        {title}
        <Badge variant="secondary" className="text-[10px] ml-auto">
          +{lines.filter((l) => l.type === "added").length} -{lines.filter((l) => l.type === "removed").length}
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent className="px-0 pb-3">
      <div className="font-mono text-xs overflow-x-auto">
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "px-4 py-0.5",
              line.type === "added" && "bg-primary/10 text-primary",
              line.type === "removed" && "bg-destructive/10 text-destructive",
              line.type === "unchanged" && "text-muted-foreground"
            )}
          >
            <span className="select-none mr-2 text-muted-foreground/50">
              {line.type === "added" ? "+" : line.type === "removed" ? "-" : " "}
            </span>
            {line.content}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export default DiffViewer;
