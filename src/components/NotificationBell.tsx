import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Check, CheckCheck, Trash2, Info, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string | null;
  is_read: boolean;
  created_at: string;
}

const typeIcon: Record<string, React.ReactNode> = {
  info: <Info className="h-4 w-4 text-blue-500 shrink-0" />,
  success: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
  warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
  status_update: <RefreshCw className="h-4 w-4 text-violet-500 shrink-0" />,
};

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      if (!error && data) {
        setNotifications(data as unknown as Notification[]);
      }
    } catch {
      // table may not exist yet — graceful fail
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 30s + fetch on mount
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload: any) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from("notifications" as any).update({ is_read: true } as any).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
  };

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    await supabase
      .from("notifications" as any)
      .update({ is_read: true } as any)
      .eq("user_id", session.user.id)
      .eq("is_read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications" as any).delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) await markAsRead(n.id);
    setOpen(false);

    // Determine the right tab based on the notification message content
    let tab = "concerns";
    const msg = (n.message || "") + (n.title || "");
    if (/Document Request/i.test(msg)) {
      tab = "documents";
    } else if (/Business|Registration|Permit Renewal/i.test(msg)) {
      tab = "business";
    } else if (/Health|Vaccination|Medical/i.test(msg)) {
      tab = "health";
    }

    const params = new URLSearchParams();
    params.set("tab", tab);
    if (n.reference_id) params.set("id", n.reference_id);
    navigate(`/my-requests?${params.toString()}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none animate-pulse">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-civic-blue hover:underline flex items-center gap-1"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        <ScrollArea className="max-h-[360px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex gap-3 px-4 py-3 border-b last:border-b-0 transition-colors cursor-pointer hover:bg-gray-50 ${
                    n.is_read ? "bg-white" : "bg-blue-50/60"
                  }`}
                >
                  {/* Icon */}
                  <div className="pt-0.5">{typeIcon[n.type] ?? typeIcon.info}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${n.is_read ? "text-muted-foreground" : "font-medium text-gray-900"}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {!n.is_read && (
                      <button
                        onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                        className="p-1 rounded hover:bg-gray-100 text-blue-500"
                        title="Mark as read"
                      >
                        <Check className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                      className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

/**
 * Helper: insert a notification for a given user.
 * Call from any component after a form submission, etc.
 */
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "status_update" = "info",
  referenceId?: string,
) => {
  try {
    const { error } = await supabase.from("notifications" as any).insert({
      user_id: userId,
      title,
      message,
      type,
      reference_id: referenceId ?? null,
    } as any);
    if (error) {
      console.error("[Notification] insert failed:", error.message, error);
    } else {
      console.log("[Notification] created for user", userId, title);
    }
  } catch (err) {
    console.error("[Notification] unexpected error:", err);
  }
};
