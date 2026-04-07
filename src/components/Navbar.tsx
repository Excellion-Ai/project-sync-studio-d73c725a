import { Link, useLocation } from "react-router-dom";
import excellionLogo from "@/assets/excellion-logo.png";
import { useState } from "react";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    if (!isHome) {
      window.location.href = `/#${id}`;
      return;
    }
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[hsl(0_0%_4%/0.85)] backdrop-blur-xl border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={excellionLogo} alt="Excellion" className="w-8 h-8 rounded-full object-cover" />
            <span className="text-foreground font-heading font-bold text-lg">Excellion</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo("how-it-works")} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-body">
              How it Works
            </button>
            <button onClick={() => scrollTo("pricing")} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-body">
              Pricing
            </button>
            <button onClick={() => scrollTo("faq")} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-body">
              FAQ
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => scrollTo("how-it-works")}
              className="px-4 py-2 rounded-[10px] btn-primary text-sm font-body"
            >
              Start Building
            </button>
          </div>

          <button className="md:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-[hsl(0_0%_4%/0.95)] backdrop-blur-xl border-b border-border px-4 pb-4 space-y-3">
          <button onClick={() => scrollTo("how-it-works")} className="block text-muted-foreground hover:text-foreground text-sm w-full text-left py-2 font-body">How it Works</button>
          <button onClick={() => scrollTo("pricing")} className="block text-muted-foreground hover:text-foreground text-sm w-full text-left py-2 font-body">Pricing</button>
          <button onClick={() => scrollTo("faq")} className="block text-muted-foreground hover:text-foreground text-sm w-full text-left py-2 font-body">FAQ</button>
          <button onClick={() => scrollTo("how-it-works")} className="block px-4 py-2 rounded-[10px] btn-primary text-center text-sm font-body w-full">Start Building</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
