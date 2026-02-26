import Navbar from "./Navbar";
import Footer from "./Footer";

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

const PlaceholderPage = ({ title, description = "This page is under construction." }: PlaceholderPageProps) => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="pt-24 pb-16 px-4">
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
        <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
      </div>
    </main>
    <Footer />
  </div>
);

export default PlaceholderPage;
