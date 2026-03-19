import { Link } from "react-router-dom";
import excellionLogo from "@/assets/excellion-logo.png";
import { ExternalLink } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[hsl(0_0%_3%)] border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <img src={excellionLogo} alt="Excellion" className="w-8 h-8 rounded-full object-cover" />
              <span className="text-foreground font-heading font-bold text-lg">Excellion</span>
            </Link>
            <p className="text-muted-foreground text-sm font-body">
              AI Course Builder for Fitness Influencers
            </p>
          </div>

          {/* Product Column */}
          <div>
            <h4 className="text-foreground font-heading font-semibold text-sm mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/secret-builder" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-body">
                  Create Course
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-body">
                  Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-foreground font-heading font-semibold text-sm mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <button onClick={() => { const el = document.getElementById("how-it-works"); if (el) el.scrollIntoView({ behavior: "smooth" }); else window.location.href = "/#how-it-works"; }} className="text-muted-foreground hover:text-foreground transition-colors text-sm font-body">
                  About
                </button>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-body">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h4 className="text-foreground font-heading font-semibold text-sm mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-body">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-body">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/sitemap.xml" className="text-muted-foreground hover:text-foreground transition-colors text-sm inline-flex items-center gap-1 font-body">
                  Sitemap
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm text-center font-body">
            © 2025 Excellion. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
