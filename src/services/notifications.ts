import { supabase } from "@/integrations/supabase/client";

/**
 * Insert a notification for a given user.
 * Can be called from any component after a form submission, status change, etc.
 */
export const createNotification = async (
  userId: string,
  title: string,
  message: string,
  type: "info" | "success" | "warning" | "status_update" = "info",
  referenceId?: string,
): Promise<void> => {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type,
      reference_id: referenceId ?? null,
    });
    if (error) {
      console.error("[Notification] insert failed:", error.message, error);
    }
  } catch (err) {
    console.error("[Notification] unexpected error:", err);
  }
};
