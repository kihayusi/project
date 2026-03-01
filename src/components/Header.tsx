import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Menu, Globe, LogOut, User, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import cityLogo from "@/assets/san-carlos-city-seal.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { NotificationBell } from "@/components/NotificationBell";

// Active-state class for nav links
const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `relative text-sm font-medium transition-colors pb-0.5 ${
    isActive
      ? "text-civic-blue after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[2px] after:bg-civic-blue after:rounded-full"
      : "text-civic-gray-dark hover:text-civic-blue"
  }`;

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" });
      setUser(null);
      toast({ title: "Signed out", description: "You have been successfully signed out." });
      navigate("/");
    } catch (error) {
      // Force clear even if signOut fails
      setUser(null);
      navigate("/");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-civic-gray bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 animate-fade-in-down">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center space-x-2 hover:scale-105 transition-transform duration-300 cursor-pointer" onClick={() => navigate("/")}>
          <img src={cityLogo} alt="San Carlos City Seal" className="h-10 w-10 object-contain" />
          <div>
            <h1 className="text-xl font-bold text-civic-gray-dark">CityLife</h1>
            <p className="text-xs text-muted-foreground">San Carlos City</p>
          </div>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-6">
          <NavLink to="/" end className={navLinkClass}>Home</NavLink>
          <NavLink to="/services" className={navLinkClass}>Services</NavLink>
          <NavLink to="/announcements" className={navLinkClass}>Announcements</NavLink>
          <NavLink to="/emergency" className={navLinkClass}>Emergency</NavLink>
          {user && (
            <NavLink to="/my-requests" className={navLinkClass}>
              My Requests
            </NavLink>
          )}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="h-9 w-9 hover:rotate-12 transition-transform duration-300">
            <Globe className="h-4 w-4" />
          </Button>

          {user && <NotificationBell />}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 gap-2 px-2">
                  {user.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="Avatar"
                      className="h-7 w-7 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  <span className="hidden md:inline text-sm font-medium max-w-[120px] truncate">
                    {user.user_metadata?.full_name || user.user_metadata?.name || user.email}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="text-xs text-muted-foreground cursor-default">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="civic" size="sm" onClick={() => navigate("/auth")} className="hidden md:flex">
              Sign In
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-civic-gray bg-white animate-fade-in">
          <nav className="flex flex-col px-4 py-3 space-y-1">
            <NavLink to="/" end className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-civic-blue/10 text-civic-blue" : "text-civic-gray-dark hover:bg-gray-100"}`
            }>Home</NavLink>
            <NavLink to="/services" className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-civic-blue/10 text-civic-blue" : "text-civic-gray-dark hover:bg-gray-100"}`
            }>Services</NavLink>
            <NavLink to="/announcements" className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-civic-blue/10 text-civic-blue" : "text-civic-gray-dark hover:bg-gray-100"}`
            }>Announcements</NavLink>
            <NavLink to="/emergency" className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-civic-blue/10 text-civic-blue" : "text-civic-gray-dark hover:bg-gray-100"}`
            }>Emergency</NavLink>
            {user && (
              <NavLink to="/my-requests" className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive ? "bg-civic-blue/10 text-civic-blue" : "text-civic-gray-dark hover:bg-gray-100"}`
              }>My Requests</NavLink>
            )}
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors mt-1"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </button>
            ) : (
              <Button variant="civic" size="sm" onClick={() => navigate("/auth")} className="mt-2 w-full">
                Sign In
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};