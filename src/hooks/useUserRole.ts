import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export const useUserRole = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const initialised = useRef(false);

  useEffect(() => {
    const checkRole = async (sessionOverride?: Session | null) => {
      const session = sessionOverride ?? (await supabase.auth.getSession()).data.session;
      if (!session?.user) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        initialised.current = true;
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
      initialised.current = true;
    };

    checkRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Token refreshes fire on tab focus — the Supabase client already
      // updated the token internally. Skip completely to avoid re-renders.
      if (event === "TOKEN_REFRESHED") return;

      if (initialised.current) {
        setLoading(true);
      }
      checkRole(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { isAdmin, loading, user };
};
