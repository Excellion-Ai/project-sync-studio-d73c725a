import { Card, CardContent } from "@/components/ui/card";
import { Database } from "lucide-react";

const TABLES = [
  { name: "courses", cols: ["id", "title", "slug", "curriculum", "design_config", "status"] },
  { name: "enrollments", cols: ["id", "course_id", "user_id", "progress_percent"] },
  { name: "lesson_progress", cols: ["id", "enrollment_id", "lesson_id", "completed_at"] },
  { name: "purchases", cols: ["id", "course_id", "user_id", "amount_cents"] },
  { name: "certificates", cols: ["id", "course_id", "user_id", "certificate_number"] },
];

const SchemaVizPanel = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 text-foreground">
      <Database className="h-5 w-5 text-primary" />
      <h3 className="text-sm font-semibold">Schema Overview</h3>
    </div>
    <div className="space-y-2">
      {TABLES.map((t) => (
        <Card key={t.name} className="border-border/50">
          <CardContent className="py-2 px-3">
            <p className="text-xs font-semibold text-primary font-mono">{t.name}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {t.cols.map((c) => (
                <span key={c} className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{c}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

export default SchemaVizPanel;
