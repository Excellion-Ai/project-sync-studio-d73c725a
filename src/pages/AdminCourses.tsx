import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

const AdminCourses = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-20">
        <h1 className="font-heading text-3xl font-bold text-foreground mb-4">
          Course Management
        </h1>
        <p className="text-muted-foreground">
          Admin course management — coming soon.
        </p>
      </main>
      <Footer />
    </div>
  );
};

export default AdminCourses;
