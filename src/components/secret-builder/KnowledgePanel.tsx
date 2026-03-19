import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, FileText, Link } from "lucide-react";

const KNOWLEDGE_ITEMS = [
  { type: "doc", title: "Platform Documentation", desc: "How the course builder works" },
  { type: "doc", title: "Design System Guide", desc: "Colors, fonts, and layout tokens" },
  { type: "link", title: "Supabase Docs", desc: "Database and auth reference" },
  { type: "doc", title: "Edge Functions", desc: "AI and payment integrations" },
];

const KnowledgePanel = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 text-foreground">
      <Brain className="h-5 w-5 text-primary" />
      <h3 className="text-sm font-semibold">Knowledge Base</h3>
    </div>

    <div className="space-y-2">
      {KNOWLEDGE_ITEMS.map((item, i) => (
        <Card key={i} className="border-border/50 cursor-pointer hover:border-primary/30 transition-colors">
          <CardContent className="flex items-start gap-2 py-2 px-3">
            {item.type === "link" ? <Link className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" /> : <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />}
            <div>
              <p className="text-xs font-medium text-foreground">{item.title}</p>
              <p className="text-[10px] text-muted-foreground">{item.desc}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default KnowledgePanel;
