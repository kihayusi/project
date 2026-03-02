import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Shield, BarChart3, Megaphone, MessageSquare, Users, LogOut, FileText,
  Briefcase, Activity, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import cityLogo from "@/assets/san-carlos-city-seal.png";

interface BadgeCounts {
  concerns?: number;
  documents?: number;
  business?: number;
  health?: number;
}

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  user: any;
  badgeCounts?: BadgeCounts;
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

export const AdminSidebar = ({ activeTab, onTabChange, user, badgeCounts = {} }: AdminSidebarProps) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut({ scope: "global" });
    toast.success("You have been successfully signed out.");
    navigate("/");
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-border px-4">
          <img
            src={cityLogo}
            alt="San Carlos City Seal"
            className="h-9 w-9 flex-shrink-0 object-contain"
          />
          <div
            className={cn(
              "overflow-hidden transition-all duration-300",
              collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            )}
          >
            <h1 className="text-lg font-bold text-foreground whitespace-nowrap">CityLife</h1>
            <p className="text-[10px] leading-none text-muted-foreground whitespace-nowrap">Admin Panel</p>
          </div>
        </div>

        {/* Collapse toggle */}
        <div className="flex justify-end px-2 py-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">{collapsed ? "Expand sidebar" : "Collapse sidebar"}</TooltipContent>
          </Tooltip>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {group.label}
                </p>
              )}
              {collapsed && <div className="mb-1 border-b border-border/40 mx-2" />}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const count = badgeCounts[item.id as keyof BadgeCounts];
                  const navButton = (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative",
                        activeTab === item.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        collapsed && "justify-center px-0"
                      )}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && (
                        <span className="flex-1 text-left truncate">{item.label}</span>
                      )}
                      {count !== undefined && count > 0 && (
                        <Badge
                          variant={activeTab === item.id ? "secondary" : "destructive"}
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4 min-w-[18px] flex items-center justify-center font-bold",
                            collapsed && "absolute -top-1 -right-1 scale-90"
                          )}
                        >
                          {count > 99 ? "99+" : count}
                        </Badge>
                      )}
                    </button>
                  );

                  return collapsed ? (
                    <Tooltip key={item.id}>
                      <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                      <TooltipContent side="right" className="flex items-center gap-2">
                        {item.label}
                        {count !== undefined && count > 0 && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                            {count}
                          </Badge>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    navButton
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-3 space-y-2">
          {/* User info */}
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex-shrink-0">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-primary/20"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-card" />
                </div>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">
                  <p className="font-medium">{user?.user_metadata?.full_name || user?.user_metadata?.name || "Admin"}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </TooltipContent>
              )}
            </Tooltip>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate text-foreground">
                    {user?.user_metadata?.full_name || user?.user_metadata?.name || "Admin"}
                  </p>
                  <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 font-semibold border-primary/30 text-primary">
                    <Shield className="h-2 w-2 mr-0.5" />
                    Admin
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className={cn("flex gap-1.5", collapsed && "flex-col items-center")}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "gap-1.5 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30",
                    collapsed ? "w-10 h-8 p-0" : "w-full"
                  )}
                  onClick={handleSignOut}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {!collapsed && <span>Sign Out</span>}
                </Button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Sign Out</TooltipContent>}
            </Tooltip>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
};
