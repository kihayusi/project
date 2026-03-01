import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUserRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkRole = async (sessionOverride?: any) => {
      const session = sessionOverride ?? (await supabase.auth.getSession()).data.session;
      if (!session?.user) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setUser(session.user);

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      setIsAdmin(!!data);
      setLoading(false);
    };

    checkRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setLoading(true);
      checkRole(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, loading, user };
};
