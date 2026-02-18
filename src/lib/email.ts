import { supabase } from "@/integrations/supabase/client";

export const openEmailRequest = async (subject: string, bodyLines: string[]) => {
  const { error } = await supabase.functions.invoke("send-request-email", {
    body: {
      subject,
      bodyLines,
    },
  });

  if (error) {
    throw error;
  }
};
