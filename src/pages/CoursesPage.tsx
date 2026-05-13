import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Users, ArrowLeft, ExternalLink } from "lucide-react";

interface PublicCourse {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  thumbnail_url: string | null;
  total_students: number;
  is_free: boolean;
  price_cents: number | null;
}

const CoursesPage = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<PublicCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("courses")
        .select("id, title, description, slug, thumbnail_url, total_students, is_free, price_cents")
        .not("published_at", "is", null)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      setCourses((data as PublicCourse[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Browse Courses | Excellion</title>
        <meta name="description" content="Discover fitness, coaching, and training courses published on Excellion. Browse the latest programs from independent creators." />
        <link rel="canonical" href="/courses" />
        <meta property="og:title" content="Browse Courses | Excellion" />
        <meta property="og:description" content="Discover fitness, coaching, and training courses published on Excellion." />
        <meta property="og:url" content="/courses" />
      </Helmet>
      <Navigation />
      <main className="pt-24 pb-16 px-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/secret-builder-hub")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Resources</h1>
            <p className="text-sm text-muted-foreground">Browse published courses and learning resources.</p>
          </div>
        </div>
        <Separator className="mb-6" />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-lg font-medium">No published courses yet</p>
            <p className="text-sm text-muted-foreground">Published courses will appear here for students to browse.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <Card
                key={course.id}
                className="border-border bg-card hover:border-primary/30 transition-colors cursor-pointer overflow-hidden"
                onClick={() => navigate(`/course/${course.slug}`)}
              >
                {course.thumbnail_url && (
                  <div className="h-36 bg-muted">
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-sm line-clamp-2">{course.title}</h3>
                  {course.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                  )}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {course.total_students || 0} students
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      {course.is_free ? "Free" : `$${((course.price_cents || 0) / 100).toFixed(0)}`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CoursesPage;
