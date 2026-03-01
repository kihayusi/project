import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Shield, BarChart3, Megaphone, MessageSquare, Users, LogOut, FileText,
  Briefcase, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import cityLogo from "@/assets/san-carlos-city-seal.png";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
}

const navGroups = [
  {
    label: "Dashboard",
    items: [
      { id: "overview", label: "Overview", icon: BarChart3 },
    ],
  },
  {
    label: "Citizen Requests",
    items: [
      { id: "concerns",  label: "Concerns",          icon: MessageSquare },
      { id: "documents", label: "Document Requests",  icon: FileText      },
      { id: "business",  label: "Business Services",  icon: Briefcase     },
      { id: "health",    label: "Health Services",    icon: Activity      },
    ],
  },
  {
    label: "Content",
    items: [
      { id: "announcements", label: "Announcements", icon: Megaphone },
    ],
  },
  {
    label: "System",
    items: [
      { id: "users", label: "Users", icon: Users },
    ],
  },
];

export const AdminSidebar = ({ activeTab, onTabChange, user }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: "global" });
    toast({ title: "Signed out", description: "You have been successfully signed out." });
    navigate("/");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <img src={cityLogo} alt="San Carlos City Seal" className="h-9 w-9 object-contain" />
        <div>
          <h1 className="text-lg font-bold text-foreground">CityLife</h1>
          <p className="text-[10px] leading-none text-muted-foreground">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    activeTab === item.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4 space-y-3">
        <div className="flex items-center gap-2">
          {user?.user_metadata?.avatar_url ? (
            <img src={user.user_metadata.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {user?.user_metadata?.full_name || user?.user_metadata?.name || "Admin"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="w-full gap-1" onClick={handleSignOut}>
            <LogOut className="h-3 w-3" /> Sign Out
          </Button>
        </div>
      </div>
    </aside>
  );
};
