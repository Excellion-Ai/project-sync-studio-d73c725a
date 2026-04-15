
import excellionLogo from "@/assets/excellion-logo.png";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Shield, LogOut, User } from "lucide-react";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { subscribed, startCheckout } = useSubscription();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const ALLOWED_EMAIL = "excellionai@gmail.com";
  const handleStartBuilding = async () => {
    if (user && (user.email === ALLOWED_EMAIL || subscribed)) {
      navigate("/secret-builder-hub");
    } else if (user) {
      try {
        await startCheckout("monthly");
      } catch {
        navigate("/auth");
      }
    } else {
      navigate("/auth");
    }
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="max-w-[100px] truncate">
            {user?.email?.split("@")[0]}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate("/dashboard")}>
          My Courses
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/dashboard/analytics")}>
          Analytics
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/billing")}>
          Billing
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="w-full px-6 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src={excellionLogo} alt="Excellion" className="w-8 h-8 rounded-full object-cover" />
            <span className="text-foreground font-semibold text-lg">Excellion</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo("how-it-works")} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              How it Works
            </button>
            <button onClick={() => scrollTo("pricing")} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Pricing
            </button>
            <button onClick={() => scrollTo("faq")} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              FAQ
            </button>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            {isAdmin && (
              <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-1">
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            {!loading && (
              user ? (
                <UserMenu />
              ) : (
                <Link to="/auth" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                  Sign In
                </Link>
              )
            )}
            <Button onClick={handleStartBuilding} size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              Start Building
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-6 mt-6">
                  {/* Header */}
                  <div className="flex items-center gap-2 pb-4 border-b border-border">
                    <img src={excellionLogo} alt="Excellion" className="w-8 h-8 rounded-full object-cover" />
                    <span className="text-foreground font-semibold text-lg">Excellion</span>
                  </div>

                  {/* Navigation Links */}
                  <div className="flex flex-col gap-3">
                    <button onClick={() => scrollTo("how-it-works")} className="text-muted-foreground hover:text-foreground transition-colors text-sm text-left py-2">
                      How it Works
                    </button>
                    <button onClick={() => scrollTo("pricing")} className="text-muted-foreground hover:text-foreground transition-colors text-sm text-left py-2">
                      Pricing
                    </button>
                    <button onClick={() => scrollTo("faq")} className="text-muted-foreground hover:text-foreground transition-colors text-sm text-left py-2">
                      FAQ
                    </button>
                  </div>

                  {/* User Section */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-border">
                    {isAdmin && (
                      <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2 py-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </Link>
                    )}
                    {!loading && (
                      user ? (
                        <>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 py-2">
                            <User className="h-4 w-4" />
                            {user.email}
                          </div>
                          <Link to="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors text-sm py-2">
                            My Courses
                          </Link>
                          <Link to="/dashboard/analytics" className="text-muted-foreground hover:text-foreground transition-colors text-sm py-2">
                            Analytics
                          </Link>
                          <Link to="/settings" className="text-muted-foreground hover:text-foreground transition-colors text-sm py-2">
                            Settings
                          </Link>
                          <Link to="/billing" className="text-muted-foreground hover:text-foreground transition-colors text-sm py-2">
                            Billing
                          </Link>
                          <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2 py-2 text-left">
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </>
                      ) : null
                    )}
                    <Button onClick={handleStartBuilding} className="w-full mt-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground" variant="outline">
                      Start Building
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};


export default Navigation;
