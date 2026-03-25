import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3, Users, DollarSign, Eye, TrendingUp, BookOpen,
  ArrowLeft, ArrowUpRight, Clock, Award
} from "lucide-react";

interface CourseStats {
  id: string;
  title: string;
  status: string | null;
  total_students: number;
  views: number;
  revenue: number;
  enrollments: number;
  published_at: string | null;
}

const CreatorAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      // Fetch courses
      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title, total_students, status, published_at, price_cents")
        .eq("user_id", user.id)
        .is("deleted_at", null);

      if (!coursesData || coursesData.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      const courseIds = coursesData.map((c) => c.id);

      // Fetch views & enrollments & purchases in parallel
      const [viewsRes, enrollmentsRes, purchasesRes] = await Promise.all([
        supabase.from("course_views").select("course_id").in("course_id", courseIds),
        supabase.from("enrollments").select("course_id").in("course_id", courseIds),
        supabase.from("purchases").select("course_id, amount_cents, status").in("course_id", courseIds),
      ]);

      const viewCounts: Record<string, number> = {};
      (viewsRes.data || []).forEach((v) => {
        viewCounts[v.course_id] = (viewCounts[v.course_id] || 0) + 1;
      });

      const enrollCounts: Record<string, number> = {};
      (enrollmentsRes.data || []).forEach((e) => {
        enrollCounts[e.course_id] = (enrollCounts[e.course_id] || 0) + 1;
      });

      const revenueByCourse: Record<string, number> = {};
      (purchasesRes.data || []).forEach((p) => {
        if (p.status === "completed" || p.status === "paid") {
          revenueByCourse[p.course_id] = (revenueByCourse[p.course_id] || 0) + (p.amount_cents || 0);
        }
      });

      setCourses(
        coursesData.map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
          total_students: c.total_students || 0,
          views: viewCounts[c.id] || 0,
          revenue: (revenueByCourse[c.id] || 0) / 100,
          enrollments: enrollCounts[c.id] || 0,
          published_at: c.published_at,
        }))
      );
      setLoading(false);
    };

    load();
  }, [user]);

  const totalStudents = courses.reduce((s, c) => s + c.total_students, 0);
  const totalViews = courses.reduce((s, c) => s + c.views, 0);
  const totalRevenue = courses.reduce((s, c) => s + c.revenue, 0);
  const totalEnrollments = courses.reduce((s, c) => s + c.enrollments, 0);
  const publishedCount = courses.filter((c) => c.status === "published").length;

  const statCards = [
    { label: "Total Courses", value: courses.length, sub: `${publishedCount} published`, icon: BookOpen, color: "text-primary" },
    { label: "Total Students", value: totalEnrollments, sub: `${totalStudents} lifetime`, icon: Users, color: "text-emerald-400" },
    { label: "Total Views", value: totalViews.toLocaleString(), sub: "page views", icon: Eye, color: "text-sky-400" },
    { label: "Earnings", value: `$${totalRevenue.toFixed(2)}`, sub: "all time", icon: DollarSign, color: "text-amber-400" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/secret-builder-hub")} className="shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold font-heading">Analytics</h1>
            <p className="text-xs text-muted-foreground font-body">Track course performance & earnings</p>
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((stat) => (
            <Card key={stat.label} className="border-border bg-card hover:border-primary/20 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-2xl font-bold font-heading">{stat.value}</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">{stat.label}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Separator />

        {/* Course List */}
        <div>
          <h2 className="text-base font-semibold font-heading mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Course Performance
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : courses.length === 0 ? (
            <Card className="border-border bg-card">
              <CardContent className="flex flex-col items-center justify-center py-16 space-y-3">
                <TrendingUp className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground text-center">
                  No courses yet. Create your first course to start tracking performance.
                </p>
                <Button variant="outline" size="sm" onClick={() => navigate("/secret-builder-hub")}>
                  Go to Course Studio
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  onClick={() => navigate(`/dashboard/analytics/${course.id}`)}
                  className="border-border bg-card hover:border-primary/30 cursor-pointer transition-all group"
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold font-heading truncate">{course.title}</p>
                        <Badge
                          variant={course.status === "published" ? "default" : "secondary"}
                          className="text-[10px] shrink-0"
                        >
                          {course.status || "draft"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground font-body">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {course.enrollments} enrolled
                        </span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" /> {course.views} views
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" /> ${course.revenue.toFixed(2)}
                        </span>
                        {course.published_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {new Date(course.published_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreatorAnalytics;
