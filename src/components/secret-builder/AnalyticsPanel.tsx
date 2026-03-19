import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Users, Eye, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsPanelProps {
  courseId: string | null;
}

const AnalyticsPanel = ({ courseId }: AnalyticsPanelProps) => {
  const [stats, setStats] = useState({ views: 0, enrollments: 0, completionRate: 0 });

  useEffect(() => {
    if (!courseId) return;
    (async () => {
      const [{ count: views }, { count: enrollments }, { data: completed }] = await Promise.all([
        supabase.from("course_views").select("*", { count: "exact", head: true }).eq("course_id", courseId),
        supabase.from("enrollments").select("*", { count: "exact", head: true }).eq("course_id", courseId),
        supabase.from("enrollments").select("id").eq("course_id", courseId).not("completed_at", "is", null),
      ]);
      const totalEnroll = enrollments ?? 0;
      const completedCount = completed?.length ?? 0;
      setStats({
        views: views ?? 0,
        enrollments: totalEnroll,
        completionRate: totalEnroll > 0 ? Math.round((completedCount / totalEnroll) * 100) : 0,
      });
    })();
  }, [courseId]);

  const cards = [
    { label: "Page Views", value: stats.views, icon: Eye },
    { label: "Enrollments", value: stats.enrollments, icon: Users },
    { label: "Completion", value: `${stats.completionRate}%`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="text-sm font-semibold">Analytics</h3>
      </div>
      {!courseId ? (
        <p className="text-xs text-muted-foreground text-center py-8">Select a course to view analytics</p>
      ) : (
        <div className="grid gap-3">
          {cards.map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border-border/50">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <Icon className="h-5 w-5 text-primary shrink-0" />
                <div>
                  <p className="text-lg font-semibold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalyticsPanel;
