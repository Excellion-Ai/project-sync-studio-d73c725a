import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Settings = () => (
  <div className="min-h-screen bg-background text-foreground">
    <Navbar />
    <main className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Settings</h1>
      <Outlet />
    </main>
    <Footer />
  </div>
);

export default Settings;
