
import { useState } from "react";
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
  const { subscribed } = useSubscription();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const handleSignOut = () => {
    closeMobile();
    // eslint-disable-next-line no-console
    console.log("[signout] handleSignOut invoked", {
      userId: user?.id ?? null,
      email: user?.email ?? null,
      href: window.location.href,
    });

    // Absolute 3s failsafe: no matter what — pending promises, stuck
    // signOut network call, React state race — the tab redirects to /.
    const failsafe = window.setTimeout(() => {
      // eslint-disable-next-line no-console
      console.warn("[signout] 3s failsafe — forcing redirect to /");
      window.location.href = "/";
    }, 3000);

    // Race signOut against a 1.5s timeout. The SDK clears the session
    // from localStorage in the first microtask; the network call to
    // invalidate the refresh token server-side is async and can hang
    // on a dead JWT — we don't wait for it.
    Promise.race([
      supabase.auth.signOut(),
      new Promise<{ error: null }>((resolve) =>
        window.setTimeout(() => resolve({ error: null }), 1500)
      ),
    ])
      .catch((err: any) => {
        // eslint-disable-next-line no-console
        console.error("[signout] signOut threw:", err);
      })
      .finally(() => {
        window.clearTimeout(failsafe);
        // eslint-disable-next-line no-console
        console.log("[signout] redirecting to /");
        window.location.href = "/";
      });
  };

  const ALLOWED_EMAIL = "excellionai@gmail.com";
  const handleStartBuilding = () => {
    closeMobile();
    // Route unsubscribed coaches through /paywall; everyone else hits
    // /dashboard, whose guard handles auth/role/subscription redirects.
    if (!user) {
      navigate("/auth?mode=signup&redirect=/dashboard");
      return;
    }
    if (user.email === ALLOWED_EMAIL || subscribed) {
      navigate("/dashboard");
      return;
    }
    navigate("/paywall");
  };

  const scrollTo = (id: string) => {
    closeMobile();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = `/#${id}`;
    }
  };

  const mobileNavigate = (path: string) => {
    closeMobile();
    navigate(path);
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
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            handleSignOut();
          }}
        >
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
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
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
                <Link to="/auth?mode=signin" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
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
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
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
                    <button onClick={() => scrollTo("how-it-works")} className="text-muted-foreground hover:text-foreground transition-colors text-sm text-left py-2 touch-manipulation">
                      How it Works
                    </button>
                    <button onClick={() => scrollTo("pricing")} className="text-muted-foreground hover:text-foreground transition-colors text-sm text-left py-2 touch-manipulation">
                      Pricing
                    </button>
                    <button onClick={() => scrollTo("faq")} className="text-muted-foreground hover:text-foreground transition-colors text-sm text-left py-2 touch-manipulation">
                      FAQ
                    </button>
                  </div>

                  {/* User Section */}
                  <div className="flex flex-col gap-3 pt-4 border-t border-border">
                    {isAdmin && (
                      <button onClick={() => mobileNavigate("/admin")} className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2 py-2 text-left touch-manipulation">
                        <Shield className="h-4 w-4" />
                        Admin
                      </button>
                    )}
                    {!loading && (
                      user ? (
                        <>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 py-2">
                            <User className="h-4 w-4" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          <button onClick={() => mobileNavigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors text-sm py-2 text-left touch-manipulation">
                            My Courses
                          </button>
                          <button onClick={() => mobileNavigate("/dashboard/analytics")} className="text-muted-foreground hover:text-foreground transition-colors text-sm py-2 text-left touch-manipulation">
                            Analytics
                          </button>
                          <button onClick={() => mobileNavigate("/settings")} className="text-muted-foreground hover:text-foreground transition-colors text-sm py-2 text-left touch-manipulation">
                            Settings
                          </button>
                          <button onClick={() => mobileNavigate("/billing")} className="text-muted-foreground hover:text-foreground transition-colors text-sm py-2 text-left touch-manipulation">
                            Billing
                          </button>
                          <button
                            onClick={handleSignOut}
                            className="text-muted-foreground hover:text-foreground transition-colors text-sm flex items-center gap-2 py-2 text-left touch-manipulation"
                          >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                          </button>
                        </>
                      ) : (
                        <button onClick={() => mobileNavigate("/auth?mode=signin")} className="text-muted-foreground hover:text-foreground transition-colors text-sm py-2 text-left touch-manipulation">
                          Sign In
                        </button>
                      )
                    )}
                    <Button onClick={handleStartBuilding} className="w-full mt-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground touch-manipulation" variant="outline">
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
